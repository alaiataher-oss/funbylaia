"""Editable stories overrides — password-gated write, public read."""

from __future__ import annotations

import json
import os
import secrets
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/stories", tags=["stories"])

ROOT = Path(__file__).resolve().parents[2]
STORE = ROOT / "data" / "stories_overrides.json"

# In-memory fallback for read-only hosts (Vercel)
_memory: dict[str, Any] = {"overrides": {}, "deleted": []}


def _password() -> str:
    return os.getenv("STORIES_PASSWORD", "sushiro")


def _load() -> dict[str, Any]:
    try:
        if STORE.exists():
            data = json.loads(STORE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {
                    "overrides": data.get("overrides") or {},
                    "deleted": data.get("deleted") or [],
                }
    except OSError:
        pass
    return {"overrides": dict(_memory["overrides"]), "deleted": list(_memory["deleted"])}


def _save(data: dict[str, Any]) -> None:
    _memory["overrides"] = dict(data.get("overrides") or {})
    _memory["deleted"] = list(data.get("deleted") or [])
    try:
        STORE.parent.mkdir(parents=True, exist_ok=True)
        tmp = STORE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(STORE)
    except OSError:
        # Read-only filesystem — memory only for this instance
        pass


class SaveBody(BaseModel):
    password: str = Field(min_length=1)
    overrides: dict[str, Any] = Field(default_factory=dict)
    deleted: list[str] = Field(default_factory=list)


@router.get("/overrides")
def get_overrides() -> dict[str, Any]:
    return _load()


@router.put("/overrides")
def put_overrides(body: SaveBody) -> dict[str, Any]:
    if not secrets.compare_digest(body.password, _password()):
        raise HTTPException(status_code=401, detail="Wrong password.")
    payload = {"overrides": body.overrides or {}, "deleted": body.deleted or []}
    _save(payload)
    return {"ok": True, **_load()}
