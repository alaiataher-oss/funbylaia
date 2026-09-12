from __future__ import annotations

import csv
import io
import json
import os
import threading
import time
from typing import Any, Optional

from app.models import SyncStatus, utc_now
from app.store import get_sync_meta, load_all, update_sync_meta

_queue_lock = threading.Lock()
_retry_thread_started = False


def sheets_configured() -> bool:
    return bool(
        os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        and os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
        and os.getenv("GOOGLE_PRIVATE_KEY")
    )


def _private_key() -> str:
    key = os.getenv("GOOGLE_PRIVATE_KEY", "")
    return key.replace("\\n", "\n")


def _client():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    info = {
        "type": "service_account",
        "client_email": os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        "private_key": _private_key(),
        "token_uri": "https://oauth2.googleapis.com/token",
    }
    creds = service_account.Credentials.from_service_account_info(
        info,
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def get_status() -> SyncStatus:
    meta = get_sync_meta()
    configured = sheets_configured()
    status = meta.get("backupStatus") or ("not_configured" if not configured else "idle")
    if not configured:
        status = "not_configured"
    return SyncStatus(
        configured=configured,
        spreadsheetId=os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID"),
        lastSuccessfulBackup=meta.get("lastSuccessfulBackup"),
        lastAttemptedBackup=meta.get("lastAttemptedBackup"),
        backupStatus=status,
        pendingChanges=int(meta.get("pendingChanges", 0)),
        lastError=meta.get("lastError"),
        localCount=len(load_all()),
        backupCount=meta.get("backupCount"),
    )


def queue_backup(reason: str = "change") -> None:
    meta = update_sync_meta(
        {
            "pendingChanges": int(get_sync_meta().get("pendingChanges", 0)),
            "backupStatus": "pending" if sheets_configured() else "not_configured",
        }
    )
    if not sheets_configured():
        return
    start_retry_worker()
    threading.Thread(target=run_backup_safe, kwargs={"reason": reason}, daemon=True).start()


def run_backup_safe(reason: str = "manual") -> dict[str, Any]:
    try:
        return full_backup(reason=reason)
    except Exception as exc:  # noqa: BLE001
        update_sync_meta(
            {
                "lastAttemptedBackup": utc_now(),
                "backupStatus": "failed",
                "lastError": str(exc),
            }
        )
        return {"ok": False, "error": str(exc)}


def full_backup(reason: str = "manual") -> dict[str, Any]:
    if not sheets_configured():
        update_sync_meta({"backupStatus": "not_configured", "lastError": "Backup not configured"})
        return {"ok": False, "error": "Backup not configured"}

    with _queue_lock:
        update_sync_meta({"backupStatus": "in_progress", "lastAttemptedBackup": utc_now(), "lastError": None})
        service = _client()
        sheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        questions = load_all()
        _ensure_worksheets(service, sheet_id)
        _write_questions(service, sheet_id, questions)
        _append_changelog_marker(service, sheet_id, reason, len(questions))
        _write_metadata(service, sheet_id, questions, reason)
        update_sync_meta(
            {
                "backupStatus": "saved_and_backed_up",
                "lastSuccessfulBackup": utc_now(),
                "pendingChanges": 0,
                "backupCount": len(questions),
                "lastError": None,
                "lastValidationResult": "ok",
            }
        )
        return {"ok": True, "count": len(questions), "reason": reason}


def _ensure_worksheets(service: Any, spreadsheet_id: str) -> None:
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    titles = {s["properties"]["title"] for s in meta.get("sheets", [])}
    requests = []
    for title in ["Questions", "Change Log", "Backup Metadata"]:
        if title not in titles:
            requests.append({"addSheet": {"properties": {"title": title}}})
    if requests:
        service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body={"requests": requests}).execute()


def _write_questions(service: Any, spreadsheet_id: str, questions: list[dict[str, Any]]) -> None:
    header = [
        "ID",
        "Question",
        "Follow-Up",
        "Primary Category",
        "Occasions",
        "Settings",
        "Relationships",
        "Closeness",
        "Depth",
        "Desired Feelings",
        "Themes",
        "Sensitivity",
        "Group Safe",
        "Status",
        "Times Shown",
        "Created At",
        "Updated At",
        "Last Synced At",
    ]
    now = utc_now()
    rows = [header]
    for q in questions:
        rows.append(
            [
                q.get("id", ""),
                q.get("question", ""),
                q.get("followUp") or "",
                q.get("primaryCategory", ""),
                ",".join(q.get("occasions", [])),
                ",".join(q.get("settings", [])),
                ",".join(q.get("relationships", [])),
                ",".join(q.get("closeness", [])),
                q.get("depth", ""),
                ",".join(q.get("feelings", [])),
                ",".join(q.get("themes", [])),
                q.get("sensitivity", ""),
                str(bool(q.get("groupSafe"))),
                q.get("status", ""),
                str(q.get("timesShown", 0)),
                q.get("createdAt", ""),
                q.get("updatedAt", ""),
                now,
            ]
        )
    service.spreadsheets().values().clear(spreadsheetId=spreadsheet_id, range="Questions!A:Z").execute()
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Questions!A1",
        valueInputOption="RAW",
        body={"values": rows},
    ).execute()


def _append_changelog_marker(service: Any, spreadsheet_id: str, reason: str, count: int) -> None:
    row = [
        [
            utc_now(),
            utc_now(),
            "*",
            "BULK_UPDATED" if reason != "manual" else "BULK_IMPORTED",
            reason,
            "",
            f"count={count}",
            "system",
            "synced",
        ]
    ]
    service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range="Change Log!A1",
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body={"values": row},
    ).execute()


def _write_metadata(service: Any, spreadsheet_id: str, questions: list[dict[str, Any]], reason: str) -> None:
    active = sum(1 for q in questions if q.get("status") == "active")
    archived = sum(1 for q in questions if q.get("status") == "archived")
    values = [
        ["Key", "Value"],
        ["Total records", str(len(questions))],
        ["Active records", str(active)],
        ["Archived records", str(archived)],
        ["Last successful backup", utc_now()],
        ["Last attempted backup", utc_now()],
        ["Backup status", "ok"],
        ["Application version", "1.0.0"],
        ["Schema version", "1.0.0"],
        ["Last validation result", "ok"],
        ["Reason", reason],
    ]
    service.spreadsheets().values().clear(spreadsheetId=spreadsheet_id, range="Backup Metadata!A:B").execute()
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Backup Metadata!A1",
        valueInputOption="RAW",
        body={"values": values},
    ).execute()


def export_json() -> str:
    return json.dumps(load_all(), ensure_ascii=False, indent=2)


def export_csv() -> str:
    output = io.StringIO()
    fields = [
        "id",
        "question",
        "followUp",
        "primaryCategory",
        "occasions",
        "settings",
        "relationships",
        "closeness",
        "depth",
        "feelings",
        "themes",
        "groupSafe",
        "sensitivity",
        "status",
        "timesShown",
        "createdAt",
        "updatedAt",
    ]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for q in load_all():
        row = {k: q.get(k) for k in fields}
        for list_key in ["occasions", "settings", "relationships", "closeness", "feelings", "themes"]:
            row[list_key] = ",".join(q.get(list_key) or [])
        writer.writerow(row)
    return output.getvalue()


def start_retry_worker() -> None:
    global _retry_thread_started
    if _retry_thread_started:
        return
    _retry_thread_started = True

    def loop() -> None:
        delay = 5
        while True:
            time.sleep(delay)
            meta = get_sync_meta()
            if not sheets_configured():
                continue
            if meta.get("backupStatus") == "failed" or int(meta.get("pendingChanges", 0)) > 0:
                result = run_backup_safe(reason="retry")
                delay = 5 if result.get("ok") else min(delay * 2, 300)
            else:
                delay = 15

    threading.Thread(target=loop, daemon=True).start()
