from __future__ import annotations

import json
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import PlainTextResponse, Response

from app import sheets
from app.auth import login, logout, optional_admin, public_question_bank, require_admin
from app.models import DeckRequest, QuestionCreate, QuestionUpdate
from app.recommend import generate_deck
from app.store import (
    archive_question,
    create_question,
    create_snapshot,
    delete_question,
    duplicate_question,
    get_question,
    is_near_duplicate,
    list_questions,
    load_all,
    normalize_text,
    restore_question,
    summary,
    update_question,
)

router = APIRouter(prefix="/api")


@router.post("/admin/login")
def admin_login(payload: dict[str, str]) -> dict[str, str]:
    token = login(payload.get("password", ""))
    return {"token": token}


@router.post("/admin/logout")
def admin_logout(token: str = Depends(require_admin)) -> dict[str, bool]:
    logout(token)
    return {"ok": True}


@router.get("/questions/summary")
def questions_summary(admin: str | None = Depends(optional_admin)) -> dict[str, Any]:
    if not public_question_bank() and not admin:
        raise HTTPException(status_code=401, detail="Admin authorization required to view bank summary")
    return summary()


@router.get("/questions")
def get_questions(
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
    groupSafe: Optional[bool] = None,
    sort: str = "id",
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    admin: str | None = Depends(optional_admin),
) -> dict[str, Any]:
    if not public_question_bank() and not admin:
        raise HTTPException(status_code=401, detail="Admin authorization required")
    return list_questions(
        status=status,
        search=search,
        occasion=occasion,
        setting=setting,
        relationship=relationship,
        closeness=closeness,
        depth=depth,
        feeling=feeling,
        theme=theme,
        sensitivity=sensitivity,
        group_safe=groupSafe,
        sort=sort,
        page=page,
        page_size=pageSize,
    )


@router.get("/questions/sync-status")
def sync_status(admin: str = Depends(require_admin)) -> Any:
    return sheets.get_status()


@router.post("/questions/sync-google-sheets")
def sync_google_sheets(admin: str = Depends(require_admin)) -> dict[str, Any]:
    return sheets.run_backup_safe(reason="manual")


@router.get("/questions/{qid}")
def get_one(qid: str, admin: str | None = Depends(optional_admin)) -> dict[str, Any]:
    if not public_question_bank() and not admin:
        raise HTTPException(status_code=401, detail="Admin authorization required")
    q = get_question(qid)
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    return q


@router.post("/questions")
def post_question(payload: QuestionCreate, admin: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        # near-dup warning as header-like field
        warns = [
            e["id"]
            for e in load_all()
            if is_near_duplicate(e["question"], payload.question)
        ]
        obj = create_question(payload, changed_by="admin")
        sheets.queue_backup("created")
        return {"question": obj, "nearDuplicateWarnings": warns}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/questions/{qid}")
def patch_question(qid: str, payload: QuestionUpdate, admin: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        obj = update_question(qid, payload, changed_by="admin")
        sheets.queue_backup("updated")
        return obj
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/questions/{qid}/archive")
def archive(qid: str, admin: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        obj = archive_question(qid)
        sheets.queue_backup("archived")
        return obj
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc


@router.post("/questions/{qid}/restore")
def restore(qid: str, admin: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        obj = restore_question(qid)
        sheets.queue_backup("restored")
        return obj
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc


@router.delete("/questions/{qid}")
def remove(qid: str, admin: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        obj = delete_question(qid)
        sheets.queue_backup("deleted")
        return {"deleted": obj["id"]}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc


@router.post("/questions/{qid}/duplicate")
def dup(qid: str, admin: str = Depends(require_admin)) -> dict[str, Any]:
    try:
        obj = duplicate_question(qid)
        sheets.queue_backup("duplicated")
        return obj
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/decks/generate")
def decks_generate(payload: DeckRequest) -> Any:
    return generate_deck(payload)


@router.get("/export/json")
def export_json(admin: str = Depends(require_admin)) -> Response:
    return Response(content=sheets.export_json(), media_type="application/json")


@router.get("/export/csv")
def export_csv(admin: str = Depends(require_admin)) -> PlainTextResponse:
    return PlainTextResponse(sheets.export_csv(), media_type="text/csv")


@router.post("/import/preview")
async def import_preview(file: UploadFile = File(...), admin: str = Depends(require_admin)) -> dict[str, Any]:
    raw = await file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".json"):
            data = json.loads(raw.decode("utf-8"))
        else:
            # CSV minimal parse
            import csv
            import io

            reader = csv.DictReader(io.StringIO(raw.decode("utf-8")))
            data = []
            for row in reader:
                for key in ["occasions", "settings", "relationships", "closeness", "feelings", "themes"]:
                    row[key] = [x for x in (row.get(key) or "").split(",") if x]
                row["groupSafe"] = str(row.get("groupSafe", "true")).lower() in {"1", "true", "yes"}
                row["timesShown"] = int(row.get("timesShown") or 0)
                data.append(row)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}") from exc

    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Import root must be a list")

    existing = {q["id"]: q for q in load_all()}
    existing_texts = {normalize_text(q["question"]): q["id"] for q in load_all()}
    new_c = updated_c = unchanged_c = invalid_c = 0
    invalid = []
    for row in data:
        try:
            if not row.get("question", "").strip().endswith("?"):
                raise ValueError("must end with ?")
            qid = row.get("id")
            if qid and qid in existing:
                if existing[qid]["question"] == row["question"]:
                    unchanged_c += 1
                else:
                    updated_c += 1
            else:
                if normalize_text(row["question"]) in existing_texts:
                    invalid_c += 1
                    invalid.append({"id": qid, "error": "duplicate text"})
                else:
                    new_c += 1
        except Exception as exc:  # noqa: BLE001
            invalid_c += 1
            invalid.append({"id": row.get("id"), "error": str(exc)})

    return {
        "new": new_c,
        "updated": updated_c,
        "unchanged": unchanged_c,
        "invalid": invalid_c,
        "invalidRows": invalid[:50],
        "totalRows": len(data),
    }


@router.post("/import/apply")
async def import_apply(file: UploadFile = File(...), admin: str = Depends(require_admin)) -> dict[str, Any]:
    create_snapshot("pre-import")
    raw = await file.read()
    data = json.loads(raw.decode("utf-8"))
    from app.store import save_all
    from app.models import utc_now
    import uuid
    from app.models import ChangeLogEntry
    from app.store import append_change

    # replace/merge by id
    by_id = {q["id"]: q for q in load_all()}
    for row in data:
        qid = row.get("id")
        if not qid:
            continue
        row["updatedAt"] = utc_now()
        by_id[qid] = {**by_id.get(qid, {}), **row}
    save_all(list(by_id.values()))
    append_change(
        ChangeLogEntry(
            changeId=str(uuid.uuid4()),
            timestamp=utc_now(),
            questionId="*",
            action="BULK_IMPORTED",
            changedFields=["*"],
            previousValue=None,
            newValue={"count": len(data)},
            changedBy="admin",
            syncStatus="pending",
        )
    )
    sheets.queue_backup("import")
    return {"ok": True, "count": len(by_id)}
