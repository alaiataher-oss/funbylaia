from __future__ import annotations

import os
import secrets
import string
import threading
import time
from copy import deepcopy
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/ttt", tags=["tictactoe"])

_lock = threading.RLock()
_memory: dict[str, dict[str, Any]] = {}
ROOM_TTL_SEC = 60 * 60 * 6
WORDISH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _supabase():
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        return None
    try:
        from supabase import create_client

        return create_client(url, key)
    except Exception:
        return None


def _use_supabase() -> bool:
    return _supabase() is not None


def _now() -> float:
    return time.time()


def _code(n: int = 6) -> str:
    return "".join(secrets.choice(WORDISH) for _ in range(n))


def _player_id() -> str:
    return secrets.token_urlsafe(12)


def _empty_board() -> list[None]:
    return [None] * 9


def _winner(board: list[Any]) -> tuple[Optional[str], Optional[list[int]]]:
    lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ]
    for line in lines:
        a, b, c = line
        if board[a] and board[a] == board[b] == board[c]:
            return str(board[a]), line
    if all(cell is not None for cell in board):
        return "draw", None
    return None, None


_ONLINE_SEC = 8.0


def _is_online(player: dict[str, Any]) -> bool:
    if not player.get("id"):
        return False
    seen = player.get("lastSeen")
    if seen is None:
        return True
    try:
        return (_now() - float(seen)) <= _ONLINE_SEC
    except (TypeError, ValueError):
        return True


def _public(room: dict[str, Any], you: Optional[str] = None) -> dict[str, Any]:
    scores = room.get("scores", {"X": 0, "O": 0, "draws": 0})
    host_id = room.get("hostId")
    host_mark = None
    for mark in ("X", "O"):
        if host_id and room["players"][mark].get("id") == host_id:
            host_mark = mark
            break
    guest_mark = "O" if host_mark == "X" else ("X" if host_mark == "O" else None)
    scoreboard = {
        "player1": int(scores.get(host_mark, 0)) if host_mark else int(scores.get("X", 0)),
        "player2": int(scores.get(guest_mark, 0)) if guest_mark else int(scores.get("O", 0)),
        "draws": int(scores.get("draws", 0)),
    }
    out = {
        "code": room["code"],
        "board": room["board"],
        "turn": room["turn"],
        "status": room["status"],
        "winner": room["winner"],
        "winningLine": room.get("winningLine"),
        "firstMark": room.get("firstMark", "X"),
        "scores": scores,
        "scoreboard": scoreboard,
        "rematch": room.get("rematch", {"X": False, "O": False}),
        "hostId": host_id,
        "players": {
            "X": {
                "ready": bool(room["players"]["X"].get("ready")),
                "connected": _is_online(room["players"]["X"]),
                "joined": bool(room["players"]["X"].get("id")),
                "lastSeen": room["players"]["X"].get("lastSeen"),
            },
            "O": {
                "ready": bool(room["players"]["O"].get("ready")),
                "connected": _is_online(room["players"]["O"]),
                "joined": bool(room["players"]["O"].get("id")),
                "lastSeen": room["players"]["O"].get("lastSeen"),
            },
        },
        "backend": "supabase" if room.get("_supabase") else "memory",
        "updatedAt": room.get("updatedAt"),
    }
    if you:
        out["you"] = you
        out["youAreHost"] = bool(host_mark and you == host_mark)
    return out


def _mark_for(room: dict[str, Any], player_id: str) -> Optional[str]:
    if room["players"]["X"].get("id") == player_id:
        return "X"
    if room["players"]["O"].get("id") == player_id:
        return "O"
    return None


def _row_to_room(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "code": row["code"],
        "board": row.get("board") or _empty_board(),
        "turn": row.get("turn") or "X",
        "status": row.get("status") or "lobby",
        "winner": row.get("winner"),
        "winningLine": row.get("winning_line"),
        "firstMark": row.get("first_mark") or "X",
        "scores": row.get("scores") or {"X": 0, "O": 0, "draws": 0},
        "rematch": {
            "X": bool(row.get("rematch_x")),
            "O": bool(row.get("rematch_o")),
        },
        "players": {
            "X": {
                "id": row.get("player_x_id"),
                "ready": bool(row.get("ready_x")),
                "lastSeen": row.get("last_seen_x"),
            },
            "O": {
                "id": row.get("player_o_id"),
                "ready": bool(row.get("ready_o")),
                "lastSeen": row.get("last_seen_o"),
            },
        },
        "hostId": row.get("host_id"),
        "updatedAt": row.get("updated_at") or _now(),
        "_supabase": True,
    }


def _room_to_row(room: dict[str, Any]) -> dict[str, Any]:
    return {
        "code": room["code"],
        "board": room["board"],
        "turn": room["turn"],
        "status": room["status"],
        "winner": room["winner"],
        "winning_line": room.get("winningLine"),
        "first_mark": room.get("firstMark", "X"),
        "scores": room.get("scores", {"X": 0, "O": 0, "draws": 0}),
        "rematch_x": bool(room.get("rematch", {}).get("X")),
        "rematch_o": bool(room.get("rematch", {}).get("O")),
        "player_x_id": room["players"]["X"].get("id"),
        "player_o_id": room["players"]["O"].get("id"),
        "ready_x": bool(room["players"]["X"].get("ready")),
        "ready_o": bool(room["players"]["O"].get("ready")),
        "last_seen_x": room["players"]["X"].get("lastSeen"),
        "last_seen_o": room["players"]["O"].get("lastSeen"),
        "host_id": room.get("hostId"),
        "updated_at": room.get("updatedAt") or _now(),
    }


def _sb_get(code: str) -> Optional[dict[str, Any]]:
    sb = _supabase()
    if not sb:
        return None
    res = sb.table("ttt_rooms").select("*").eq("code", code.upper()).limit(1).execute()
    rows = res.data or []
    if not rows:
        return None
    return _row_to_room(rows[0])


def _sb_upsert(room: dict[str, Any]) -> None:
    sb = _supabase()
    if not sb:
        return
    sb.table("ttt_rooms").upsert(_room_to_row(room)).execute()


def _mem_purge() -> None:
    now = _now()
    dead = [c for c, r in _memory.items() if now - float(r.get("updatedAt") or 0) > ROOM_TTL_SEC]
    for c in dead:
        _memory.pop(c, None)


def _load(code: str) -> dict[str, Any]:
    code = code.upper().strip()
    if _use_supabase():
        room = _sb_get(code)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found. Check the code.")
        # expire soft
        updated = room.get("updatedAt")
        try:
            # supabase may return iso string
            if isinstance(updated, str):
                pass
            elif updated and _now() - float(updated) > ROOM_TTL_SEC:
                raise HTTPException(status_code=410, detail="This room expired. Start a new game.")
        except HTTPException:
            raise
        except Exception:
            pass
        return room

    with _lock:
        _mem_purge()
        room = _memory.get(code)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found. Check the code.")
        if _now() - float(room.get("updatedAt") or 0) > ROOM_TTL_SEC:
            _memory.pop(code, None)
            raise HTTPException(status_code=410, detail="This room expired. Start a new game.")
        return deepcopy(room)


def _save(room: dict[str, Any]) -> None:
    room["updatedAt"] = _now()
    if _use_supabase():
        room["_supabase"] = True
        _sb_upsert(room)
        return
    with _lock:
        _memory[room["code"]] = deepcopy(room)


def _assign_marks_random(host_id: str, guest_id: str) -> dict[str, dict[str, Any]]:
    if secrets.randbelow(2) == 0:
        return {
            "X": {"id": host_id, "ready": False, "lastSeen": _now()},
            "O": {"id": guest_id, "ready": False, "lastSeen": _now()},
        }
    return {
        "X": {"id": guest_id, "ready": False, "lastSeen": _now()},
        "O": {"id": host_id, "ready": False, "lastSeen": _now()},
    }


class IdBody(BaseModel):
    playerId: str = Field(min_length=6)


class MoveBody(BaseModel):
    playerId: str = Field(min_length=6)
    cell: int = Field(ge=0, le=8)


@router.get("/config")
def ttt_config() -> dict[str, Any]:
    return {
        "realtime": _use_supabase(),
        "supabaseUrl": os.getenv("SUPABASE_URL", "").strip() or None,
        "supabaseAnonKey": os.getenv("SUPABASE_ANON_KEY", "").strip() or None,
    }


@router.post("/rooms")
def create_room() -> dict[str, Any]:
    host_id = _player_id()
    for _ in range(30):
        code = _code()
        try:
            if _use_supabase():
                if _sb_get(code):
                    continue
            else:
                with _lock:
                    if code in _memory:
                        continue
            room = {
                "code": code,
                "board": _empty_board(),
                "turn": "X",
                "status": "waiting",  # waiting | lobby | playing | finished
                "winner": None,
                "winningLine": None,
                "firstMark": "X",
                "scores": {"X": 0, "O": 0, "draws": 0},
                "rematch": {"X": False, "O": False},
                "hostId": host_id,
                "players": {
                    "X": {"id": host_id, "ready": False, "lastSeen": _now()},
                    "O": {"id": None, "ready": False, "lastSeen": None},
                },
                "updatedAt": _now(),
                "_supabase": _use_supabase(),
            }
            # Before guest joins, host temporarily sits as X; marks reshuffled on join
            _save(room)
            return {"playerId": host_id, "mark": "X", "role": "host", **_public(room, "X")}
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Could not create room: {exc}") from exc
    raise HTTPException(status_code=500, detail="Could not generate a unique code.")


@router.post("/rooms/{code}/join")
def join_room(code: str) -> dict[str, Any]:
    room = _load(code)
    if room["status"] == "abandoned":
        raise HTTPException(status_code=410, detail="This room was abandoned. Start a new game.")
    if room["status"] in ("playing", "finished"):
        raise HTTPException(status_code=409, detail="This game already started.")

    host_id = room.get("hostId") or room["players"]["X"].get("id")
    existing = {room["players"]["X"].get("id"), room["players"]["O"].get("id")}
    existing.discard(None)
    if len(existing) >= 2:
        raise HTTPException(status_code=409, detail="This room is full (2 players max).")
    if not host_id:
        raise HTTPException(status_code=409, detail="Room is incomplete.")

    guest_id = _player_id()
    players = _assign_marks_random(str(host_id), guest_id)
    room["players"] = players
    room["hostId"] = host_id
    room["status"] = "lobby"
    room["board"] = _empty_board()
    room["turn"] = room.get("firstMark", "X")
    room["winner"] = None
    room["winningLine"] = None
    room["rematch"] = {"X": False, "O": False}
    _save(room)
    you = _mark_for(room, guest_id)
    return {"playerId": guest_id, "mark": you, "role": "guest", **_public(room, you)}


@router.get("/rooms/{code}")
def get_room(code: str, playerId: Optional[str] = None) -> dict[str, Any]:
    room = _load(code)
    you = _mark_for(room, playerId) if playerId else None
    if playerId and you:
        room["players"][you]["lastSeen"] = _now()
        _save(room)
    return _public(room, you)


@router.post("/rooms/{code}/heartbeat")
def heartbeat(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    you = _mark_for(room, body.playerId)
    if not you:
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    room["players"][you]["lastSeen"] = _now()
    _save(room)
    return _public(room, you)


@router.post("/rooms/{code}/ready")
def set_ready(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    you = _mark_for(room, body.playerId)
    if not you:
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] not in ("lobby", "waiting"):
        raise HTTPException(status_code=400, detail="Ready is only available in the lobby.")
    if not room["players"]["X"].get("id") or not room["players"]["O"].get("id"):
        raise HTTPException(status_code=400, detail="Waiting for your partner to join.")
    room["players"][you]["ready"] = True
    room["players"][you]["lastSeen"] = _now()
    start_sound = False
    if room["players"]["X"]["ready"] and room["players"]["O"]["ready"]:
        room["status"] = "playing"
        room["board"] = _empty_board()
        room["turn"] = room.get("firstMark", "X")
        room["winner"] = None
        room["winningLine"] = None
        start_sound = True
    _save(room)
    return {"startSound": start_sound, **_public(room, you)}


@router.post("/rooms/{code}/move")
def make_move(code: str, body: MoveBody) -> dict[str, Any]:
    room = _load(code)
    you = _mark_for(room, body.playerId)
    if not you:
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "playing":
        raise HTTPException(status_code=400, detail="Game is not in play.")
    if room["turn"] != you:
        raise HTTPException(status_code=400, detail="Not your turn.")
    if room["board"][body.cell] is not None:
        raise HTTPException(status_code=400, detail="That cell is already taken.")
    room["board"][body.cell] = you
    room["players"][you]["lastSeen"] = _now()
    winner, line = _winner(room["board"])
    if winner:
        room["status"] = "finished"
        room["winner"] = winner
        room["winningLine"] = line
        scores = room.setdefault("scores", {"X": 0, "O": 0, "draws": 0})
        if winner == "draw":
            scores["draws"] = int(scores.get("draws", 0)) + 1
        else:
            scores[winner] = int(scores.get(winner, 0)) + 1
        room["rematch"] = {"X": False, "O": False}
    else:
        room["turn"] = "O" if you == "X" else "X"
    _save(room)
    return _public(room, you)


@router.post("/rooms/{code}/rematch")
def rematch(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    you = _mark_for(room, body.playerId)
    if not you:
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "finished":
        raise HTTPException(status_code=400, detail="Rematch is available after a finished game.")
    room["rematch"][you] = True
    room["players"][you]["lastSeen"] = _now()
    if room["rematch"]["X"] and room["rematch"]["O"]:
        # alternate first mover
        prev = room.get("firstMark", "X")
        room["firstMark"] = "O" if prev == "X" else "X"
        room["board"] = _empty_board()
        room["turn"] = room["firstMark"]
        room["status"] = "lobby"
        room["winner"] = None
        room["winningLine"] = None
        room["players"]["X"]["ready"] = False
        room["players"]["O"]["ready"] = False
        room["rematch"] = {"X": False, "O": False}
    _save(room)
    return _public(room, you)


@router.post("/rooms/{code}/leave")
def leave(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    you = _mark_for(room, body.playerId)
    if not you:
        return {"ok": True}
    room["players"][you]["id"] = None
    room["players"][you]["ready"] = False
    room["status"] = "abandoned"
    _save(room)
    return {"ok": True}
