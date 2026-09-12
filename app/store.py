from __future__ import annotations

import json
import re
import threading
import uuid
from copy import deepcopy
from pathlib import Path
from typing import Any, Optional

from app.constants import (
    CATEGORY_TARGETS,
    CLOSENESS_SENSITIVITY,
    DEPTH_SENSITIVITY,
)
from app.models import ChangeLogEntry, Question, QuestionCreate, QuestionUpdate, utc_now

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SEED = DATA / "questions_seed.json"
STORE = DATA / "questions_store.json"
CHANGE_LOG = DATA / "change_log.json"
SYNC_META = DATA / "sync_meta.json"
SNAPSHOTS = DATA / "snapshots"

_lock = threading.RLock()
_cache: list[dict[str, Any]] | None = None
_cache_version = 0


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return deepcopy(default)
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def ensure_store() -> None:
    try:
        DATA.mkdir(parents=True, exist_ok=True)
        SNAPSHOTS.mkdir(parents=True, exist_ok=True)
    except OSError:
        # Read-only deploy environments (e.g. Vercel) may ship data already.
        pass
    if not STORE.exists():
        if not SEED.exists():
            raise FileNotFoundError("Missing questions_seed.json — run scripts/generate_questions.py")
        try:
            _write_json(STORE, _read_json(SEED, []))
        except OSError as exc:
            raise FileNotFoundError("questions_store.json missing and filesystem is read-only") from exc
    if not CHANGE_LOG.exists():
        try:
            _write_json(CHANGE_LOG, [])
        except OSError:
            pass
    if not SYNC_META.exists():
        try:
            _write_json(
                SYNC_META,
                {
                    "lastSuccessfulBackup": None,
                    "lastAttemptedBackup": None,
                    "backupStatus": "not_configured",
                    "lastError": None,
                    "pendingChanges": 0,
                    "schemaVersion": "1.0.0",
                    "applicationVersion": "1.0.0",
                },
            )
        except OSError:
            pass


def invalidate_cache() -> None:
    global _cache, _cache_version
    _cache = None
    _cache_version += 1


def cache_version() -> int:
    return _cache_version


def load_all() -> list[dict[str, Any]]:
    global _cache
    ensure_store()
    with _lock:
        if _cache is None:
            _cache = _read_json(STORE, [])
        return _cache


def save_all(questions: list[dict[str, Any]]) -> None:
    global _cache
    with _lock:
        _write_json(STORE, questions)
        _cache = questions
        invalidate_cache()
        # reload after invalidate
        _cache = questions


def append_change(entry: ChangeLogEntry) -> None:
    with _lock:
        log = _read_json(CHANGE_LOG, [])
        log.append(entry.model_dump())
        _write_json(CHANGE_LOG, log)
        meta = _read_json(SYNC_META, {})
        meta["pendingChanges"] = int(meta.get("pendingChanges", 0)) + 1
        if meta.get("backupStatus") not in {"in_progress"}:
            meta["backupStatus"] = "pending"
        _write_json(SYNC_META, meta)


def get_sync_meta() -> dict[str, Any]:
    ensure_store()
    return _read_json(SYNC_META, {})


def update_sync_meta(patch: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        meta = _read_json(SYNC_META, {})
        meta.update(patch)
        _write_json(SYNC_META, meta)
        return meta


def next_id(questions: list[dict[str, Any]]) -> str:
    nums = []
    for q in questions:
        m = re.match(r"q(\d+)$", q.get("id", ""))
        if m:
            nums.append(int(m.group(1)))
    n = max(nums) + 1 if nums else 1
    return f"q{n:04d}"


def normalize_text(text: str) -> str:
    t = text.lower().strip()
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t


def is_near_duplicate(a: str, b: str, threshold: float = 0.82) -> bool:
    wa, wb = set(normalize_text(a).split()), set(normalize_text(b).split())
    if not wa or not wb:
        return False
    return len(wa & wb) / len(wa | wb) >= threshold


def validate_depth_sensitivity(depth: str, sensitivity: str) -> None:
    allowed = DEPTH_SENSITIVITY.get(depth, set())
    if sensitivity not in allowed:
        raise ValueError(f"Sensitivity '{sensitivity}' is incompatible with depth '{depth}'")


def get_question(qid: str) -> Optional[dict[str, Any]]:
    for q in load_all():
        if q["id"] == qid:
            return q
    return None


def list_questions(
    *,
    status: Optional[str] = None,
    search: Optional[str] = None,
    occasion: Optional[str] = None,
    setting: Optional[str] = None,
    relationship: Optional[str] = None,
    closeness: Optional[str] = None,
    depth: Optional[str] = None,
    feeling: Optional[str] = None,
    theme: Optional[str] = None,
    sensitivity: Optional[str] = None,
    group_safe: Optional[bool] = None,
    sort: str = "id",
    page: int = 1,
    page_size: int = 50,
) -> dict[str, Any]:
    items = load_all()
    filtered = items

    if status:
        filtered = [q for q in filtered if q.get("status") == status]
    if occasion:
        filtered = [q for q in filtered if occasion in q.get("occasions", [])]
    if setting:
        filtered = [q for q in filtered if setting in q.get("settings", [])]
    if relationship:
        filtered = [q for q in filtered if relationship in q.get("relationships", [])]
    if closeness:
        filtered = [q for q in filtered if closeness in q.get("closeness", [])]
    if depth:
        filtered = [q for q in filtered if q.get("depth") == depth]
    if feeling:
        filtered = [q for q in filtered if feeling in q.get("feelings", [])]
    if theme:
        filtered = [q for q in filtered if theme in q.get("themes", [])]
    if sensitivity:
        filtered = [q for q in filtered if q.get("sensitivity") == sensitivity]
    if group_safe is not None:
        filtered = [q for q in filtered if bool(q.get("groupSafe")) is group_safe]
    if search:
        s = search.lower()
        filtered = [
            q
            for q in filtered
            if s in q.get("question", "").lower()
            or s in (q.get("followUp") or "").lower()
            or s in q.get("id", "").lower()
            or any(s in t.lower() for t in q.get("themes", []))
        ]

    reverse = False
    key_fn = lambda q: q.get("id", "")
    if sort == "newest":
        key_fn = lambda q: q.get("updatedAt", "")
        reverse = True
    elif sort == "oldest":
        key_fn = lambda q: q.get("updatedAt", "")
    elif sort == "depth":
        order = {"light": 0, "meaningful": 1, "deep": 2}
        key_fn = lambda q: order.get(q.get("depth", ""), 9)
    elif sort == "theme":
        key_fn = lambda q: (q.get("themes") or [""])[0]
    elif sort == "most-shown":
        key_fn = lambda q: q.get("timesShown", 0)
        reverse = True

    filtered = sorted(filtered, key=key_fn, reverse=reverse)
    total = len(filtered)
    page = max(1, page)
    page_size = min(100, max(1, page_size))
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "items": filtered[start:end],
    }


def summary() -> dict[str, Any]:
    items = load_all()
    meta = get_sync_meta()
    return {
        "totalQuestions": len(items),
        "activeQuestions": sum(1 for q in items if q.get("status") == "active"),
        "archivedQuestions": sum(1 for q in items if q.get("status") == "archived"),
        "lightQuestions": sum(1 for q in items if q.get("depth") == "light"),
        "meaningfulQuestions": sum(1 for q in items if q.get("depth") == "meaningful"),
        "deepQuestions": sum(1 for q in items if q.get("depth") == "deep"),
        "lastUpdated": max((q.get("updatedAt") for q in items), default=None),
        "lastGoogleSheetsBackup": meta.get("lastSuccessfulBackup"),
        "categoryTargets": CATEGORY_TARGETS,
        "cacheVersion": cache_version(),
    }


def create_question(payload: QuestionCreate, changed_by: str = "admin") -> dict[str, Any]:
    with _lock:
        items = list(load_all())
        validate_depth_sensitivity(payload.depth, payload.sensitivity)
        if payload.settings == ["group"] or "group" in payload.settings:
            if payload.groupSafe is False and set(payload.settings) == {"group"}:
                raise ValueError("Group-only questions must be group-safe")
        for existing in items:
            if normalize_text(existing["question"]) == normalize_text(payload.question):
                raise ValueError("Exact duplicate question text is not allowed")
            if is_near_duplicate(existing["question"], payload.question):
                # warn via exception code path handled by caller optionally
                pass
        if not payload.occasions or not payload.settings or not payload.relationships or not payload.closeness:
            raise ValueError("At least one occasion, setting, relationship, and closeness are required")
        qid = next_id(items)
        now = utc_now()
        obj = Question(
            id=qid,
            question=payload.question,
            followUp=payload.followUp,
            primaryCategory=payload.primaryCategory,
            occasions=payload.occasions,
            settings=payload.settings,
            relationships=payload.relationships,
            closeness=payload.closeness,
            depth=payload.depth,
            feelings=payload.feelings,
            themes=payload.themes,
            groupSafe=payload.groupSafe,
            sensitivity=payload.sensitivity,
            status=payload.status,
            timesShown=0,
            createdAt=now,
            updatedAt=now,
        ).model_dump()
        items.append(obj)
        save_all(items)
        append_change(
            ChangeLogEntry(
                changeId=str(uuid.uuid4()),
                timestamp=now,
                questionId=qid,
                action="CREATED",
                changedFields=list(obj.keys()),
                previousValue=None,
                newValue=obj,
                changedBy=changed_by,
                syncStatus="pending",
            )
        )
        return obj


def update_question(qid: str, payload: QuestionUpdate, changed_by: str = "admin") -> dict[str, Any]:
    with _lock:
        items = list(load_all())
        idx = next((i for i, q in enumerate(items) if q["id"] == qid), None)
        if idx is None:
            raise KeyError(qid)
        prev = deepcopy(items[idx])
        data = payload.model_dump(exclude_unset=True)
        merged = {**prev, **data}
        validate_depth_sensitivity(merged["depth"], merged["sensitivity"])
        if "group" in merged.get("settings", []) and not merged.get("groupSafe", False):
            if set(merged.get("settings", [])) == {"group"}:
                raise ValueError("Group-only questions must be group-safe")
        for existing in items:
            if existing["id"] == qid:
                continue
            if normalize_text(existing["question"]) == normalize_text(merged["question"]):
                raise ValueError("Exact duplicate question text is not allowed")
        merged["updatedAt"] = utc_now()
        Question(**merged)  # validate
        items[idx] = merged
        save_all(items)
        changed_fields = [k for k, v in data.items() if prev.get(k) != v]
        append_change(
            ChangeLogEntry(
                changeId=str(uuid.uuid4()),
                timestamp=merged["updatedAt"],
                questionId=qid,
                action="UPDATED",
                changedFields=changed_fields,
                previousValue={k: prev.get(k) for k in changed_fields},
                newValue={k: merged.get(k) for k in changed_fields},
                changedBy=changed_by,
                syncStatus="pending",
            )
        )
        return merged


def set_status(qid: str, status: str, action: str, changed_by: str = "admin") -> dict[str, Any]:
    return update_question(qid, QuestionUpdate(status=status), changed_by=changed_by) | {"_action": action}


def archive_question(qid: str, changed_by: str = "admin") -> dict[str, Any]:
    obj = update_question(qid, QuestionUpdate(status="archived"), changed_by=changed_by)
    # rewrite last change action
    with _lock:
        log = _read_json(CHANGE_LOG, [])
        if log:
            log[-1]["action"] = "ARCHIVED"
            _write_json(CHANGE_LOG, log)
    return obj


def restore_question(qid: str, changed_by: str = "admin") -> dict[str, Any]:
    obj = update_question(qid, QuestionUpdate(status="active"), changed_by=changed_by)
    with _lock:
        log = _read_json(CHANGE_LOG, [])
        if log:
            log[-1]["action"] = "RESTORED"
            _write_json(CHANGE_LOG, log)
    return obj


def delete_question(qid: str, changed_by: str = "admin") -> dict[str, Any]:
    with _lock:
        items = list(load_all())
        idx = next((i for i, q in enumerate(items) if q["id"] == qid), None)
        if idx is None:
            raise KeyError(qid)
        prev = items.pop(idx)
        save_all(items)
        now = utc_now()
        append_change(
            ChangeLogEntry(
                changeId=str(uuid.uuid4()),
                timestamp=now,
                questionId=qid,
                action="DELETED",
                changedFields=["*"],
                previousValue=prev,
                newValue=None,
                changedBy=changed_by,
                syncStatus="pending",
            )
        )
        return prev


def duplicate_question(qid: str, changed_by: str = "admin") -> dict[str, Any]:
    src = get_question(qid)
    if not src:
        raise KeyError(qid)
    payload = QuestionCreate(
        question=src["question"][:-1] + " — another angle?",
        followUp=src.get("followUp"),
        primaryCategory=src["primaryCategory"],
        occasions=list(src["occasions"]),
        settings=list(src["settings"]),
        relationships=list(src["relationships"]),
        closeness=list(src["closeness"]),
        depth=src["depth"],
        feelings=list(src.get("feelings", [])),
        themes=list(src.get("themes", [])),
        groupSafe=bool(src.get("groupSafe")),
        sensitivity=src["sensitivity"],
        status="active",
    )
    return create_question(payload, changed_by=changed_by)


def bump_times_shown(ids: list[str]) -> None:
    with _lock:
        items = list(load_all())
        idset = set(ids)
        for q in items:
            if q["id"] in idset:
                q["timesShown"] = int(q.get("timesShown", 0)) + 1
                q["updatedAt"] = utc_now()
        save_all(items)


def create_snapshot(label: str = "manual") -> Path:
    ensure_store()
    path = SNAPSHOTS / f"{utc_now().replace(':', '')}_{label}.json"
    _write_json(path, load_all())
    return path


def allowed_sensitivity_for(closeness: str, depth: str) -> set[str]:
    return CLOSENESS_SENSITIVITY.get(closeness, set()) & DEPTH_SENSITIVITY.get(depth, set())
