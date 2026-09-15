"""Relationship Stock Market — server-authoritative multiplayer."""

from __future__ import annotations

import os
import random
import secrets
import threading
import time
from copy import deepcopy
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.rsm_data import CLASSIC_TICKERS, QUESTIONS

router = APIRouter(prefix="/api/rsm", tags=["rsm"])

_lock = threading.RLock()
_memory: dict[str, dict[str, Any]] = {}
ROOM_TTL_SEC = 60 * 60 * 6
WORDISH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
START_CASH = 100.0
TOTAL_ROUNDS = 5
MIN_PLAYERS = 2
MAX_PLAYERS = 6
ONLINE_SEC = 20.0
REVEAL_HOLD_SEC = 2.6

# percent moves with rough weights
MOVE_POOL = [
    (20, 18),
    (50, 14),
    (100, 8),
    (200, 4),
    (300, 2),
    (-20, 16),
    (-50, 12),
    (-80, 5),
    (-100, 3),
]


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


def _sb_get(code: str) -> Optional[dict[str, Any]]:
    sb = _supabase()
    if not sb:
        return None
    res = sb.table("rsm_rooms").select("*").eq("code", code.upper()).limit(1).execute()
    rows = res.data or []
    if not rows:
        return None
    state = rows[0].get("state") or {}
    state["_supabase"] = True
    return state


def _sb_upsert(room: dict[str, Any]) -> None:
    sb = _supabase()
    if not sb:
        return
    payload = {k: v for k, v in room.items() if not str(k).startswith("_")}
    sb.table("rsm_rooms").upsert(
        {"code": room["code"], "state": payload, "updated_at": room.get("updatedAt") or _now()}
    ).execute()


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


def _find_player(room: dict[str, Any], player_id: str) -> Optional[dict[str, Any]]:
    for p in room.get("players") or []:
        if p.get("id") == player_id:
            return p
    return None


def _active_players(room: dict[str, Any]) -> list[dict[str, Any]]:
    return [p for p in room.get("players") or [] if p.get("id") and not p.get("left")]


def _net_worth(p: dict[str, Any]) -> float:
    return round(float(p.get("cash", 0)) + float(p.get("position", 0)), 2)


def _weighted_move(bias: str) -> int:
    """bias: bullish | bearish | uncertain | strong_bull | strong_bear"""
    pool = list(MOVE_POOL)
    adjusted: list[tuple[int, float]] = []
    for pct, w in pool:
        weight = float(w)
        if bias in ("bullish", "strong_bull") and pct > 0:
            weight *= 1.8 if bias == "bullish" else 2.4
        if bias in ("bearish", "strong_bear") and pct < 0:
            weight *= 1.8 if bias == "bearish" else 2.4
        if bias == "uncertain":
            weight *= 1.0
        if bias == "strong_bull" and pct < 0:
            weight *= 0.45
        if bias == "strong_bear" and pct > 0:
            weight *= 0.45
        if bias == "bullish" and pct < 0:
            weight *= 0.65
        if bias == "bearish" and pct > 0:
            weight *= 0.65
        adjusted.append((pct, weight))
    total = sum(w for _, w in adjusted)
    r = random.random() * total
    acc = 0.0
    for pct, w in adjusted:
        acc += w
        if r <= acc:
            return pct
    return adjusted[-1][0]


def _sentiment_from_bias(bias: str) -> tuple[str, int]:
    mapping = {
        "strong_bull": ("Bullish", random.randint(72, 92)),
        "bullish": ("Bullish", random.randint(58, 78)),
        "uncertain": ("Mixed", random.randint(42, 58)),
        "bearish": ("Bearish", random.randint(55, 75)),
        "strong_bear": ("Bearish", random.randint(70, 90)),
    }
    return mapping.get(bias, ("Mixed", 50))


def _bias_from_share(share_a: float) -> str:
    """share_a: fraction who picked A (0..1)."""
    if share_a >= 0.8:
        return "strong_bull"
    if share_a >= 0.6:
        return "bullish"
    if share_a >= 0.4:
        return "uncertain"
    if share_a >= 0.2:
        return "bearish"
    return "strong_bear"


def _empty_stats() -> dict[str, Any]:
    return {
        "allIns": 0,
        "sells": 0,
        "holds": 0,
        "roundsHeld": 0,
        "biggestLoss": 0.0,
        "predictionHits": 0,
        "predictionTotal": 0,
        "cashPreference": 0.0,
    }


def _new_player(pid: str, name: str, avatar: int) -> dict[str, Any]:
    return {
        "id": pid,
        "name": name.strip()[:18] or "Player",
        "avatar": avatar % 8,
        "cash": float(START_CASH),
        "position": 0.0,
        "lastSeen": _now(),
        "left": False,
        "investAmount": None,
        "investLocked": False,
        "decision": None,
        "decisionLocked": False,
        "answer": None,
        "answerLocked": False,
        "roundInvest": 0.0,
        "roundStartPosition": 0.0,
        "roundPl": 0.0,
        "stats": _empty_stats(),
    }


def _setup_classic_round(room: dict[str, Any]) -> None:
    tick = random.choice(CLASSIC_TICKERS)
    bias = random.choice(["bullish", "bullish", "uncertain", "bearish"])
    sentiment, confidence = _sentiment_from_bias(bias)
    price = float(room.get("price") or 10)
    room["market"] = {
        "mode": "classic",
        "ticker": tick["ticker"],
        "name": tick["name"],
        "price": price,
        "headline": random.choice(tick["headlines"]),
        "sentiment": sentiment,
        "confidence": confidence,
        "bias": bias,
        "question": None,
        "movement": None,
        "answersReveal": None,
        "shareA": None,
    }
    room["pendingMove"] = _weighted_move(bias)


def _setup_relationship_round(room: dict[str, Any]) -> None:
    used = set(room.get("usedQuestions") or [])
    pool = [q for q in QUESTIONS if q["id"] not in used] or list(QUESTIONS)
    q = random.choice(pool)
    room.setdefault("usedQuestions", []).append(q["id"])
    room["market"] = {
        "mode": "relationship",
        "ticker": None,
        "name": None,
        "price": float(room.get("price") or 10),
        "headline": None,
        "sentiment": None,
        "confidence": None,
        "bias": None,
        "question": {
            "id": q["id"],
            "prompt": q["prompt"],
            "a": q["a"],
            "b": q["b"],
        },
        "movement": None,
        "answersReveal": None,
        "shareA": None,
        "favored": "a",
    }
    room["pendingMove"] = None
    room["status"] = "QUESTION"


def _begin_round(room: dict[str, Any]) -> None:
    room["round"] = int(room.get("round") or 0) + 1
    for p in _active_players(room):
        p["investAmount"] = None
        p["investLocked"] = False
        p["decision"] = None
        p["decisionLocked"] = False
        p["answer"] = None
        p["answerLocked"] = False
        p["roundInvest"] = 0.0
        p["roundStartPosition"] = float(p.get("position") or 0)
        p["roundPl"] = 0.0
        p["stats"]["cashPreference"] = float(p.get("cash") or 0)
    # relationship on rounds 2 and 4
    if room["round"] in (2, 4):
        _setup_relationship_round(room)
    else:
        _setup_classic_round(room)
        room["status"] = "MARKET_SIGNAL"
        room["phaseAt"] = _now()
        room["autoAdvanceAt"] = _now() + 4.0


def _after_answers_locked(room: dict[str, Any]) -> None:
    q = room["market"]["question"]
    players = _active_players(room)
    answers = {p["id"]: p.get("answer") for p in players}
    a_count = sum(1 for v in answers.values() if v == "a")
    total = max(len(players), 1)
    share_a = a_count / total
    bias = _bias_from_share(share_a)
    sentiment, confidence = _sentiment_from_bias(bias)
    # stock is always option A brand; rumor based on room lean
    room["market"]["ticker"] = q["a"]["ticker"]
    room["market"]["name"] = q["a"]["name"]
    room["market"]["headline"] = (
        f"Market rumor: {q['a']['label']} may be more popular in this room."
        if share_a >= 0.5
        else f"Market rumor: {q['b']['label']} energy is circulating in this room."
    )
    room["market"]["sentiment"] = sentiment
    room["market"]["confidence"] = confidence
    room["market"]["bias"] = bias
    room["market"]["shareA"] = round(share_a * 100)
    room["market"]["_privateAnswers"] = answers  # kept until reveal
    room["pendingMove"] = _weighted_move(bias)
    room["status"] = "MARKET_SIGNAL"
    room["phaseAt"] = _now()
    room["autoAdvanceAt"] = _now() + 4.0


def _apply_market_move(room: dict[str, Any]) -> None:
    move = int(room.get("pendingMove") or 0)
    price = float(room["market"]["price"])
    new_price = max(0.01, round(price * (1 + move / 100.0), 2))
    room["market"]["movement"] = move
    room["market"]["priceBefore"] = price
    room["market"]["priceAfter"] = new_price
    room["price"] = new_price
    room["market"]["price"] = new_price

    for p in _active_players(room):
        invested = float(p.get("roundInvest") or 0)
        # position already includes invested cash from lock step
        before = float(p.get("position") or 0)
        after = round(before * (1 + move / 100.0), 2)
        if move <= -100:
            after = 0.0
        p["roundPl"] = round(after - before, 2)
        if p["roundPl"] < float(p["stats"].get("biggestLoss") or 0):
            p["stats"]["biggestLoss"] = float(p["roundPl"])
        p["position"] = after
    room["status"] = "MARKET_REVEAL"
    room["phaseAt"] = _now()
    room["autoAdvanceAt"] = _now() + 3.2


def _lock_investments_advance(room: dict[str, Any]) -> None:
    players = _active_players(room)
    reveal = [{"id": p["id"], "name": p["name"], "amount": float(p.get("roundInvest") or 0)} for p in players]
    room["investmentReveal"] = reveal
    # relationship: also prepare answer reveal
    if room["market"].get("mode") == "relationship":
        private = room["market"].get("_privateAnswers") or {}
        q = room["market"]["question"]
        room["market"]["answersReveal"] = [
            {
                "id": p["id"],
                "name": p["name"],
                "answer": private.get(p["id"]),
                "label": (q["a"]["label"] if private.get(p["id"]) == "a" else q["b"]["label"]),
            }
            for p in players
        ]
        # prediction accuracy: favored side is majority
        share = float(room["market"].get("shareA") or 0) / 100.0
        majority = "a" if share >= 0.5 else "b"
        for p in players:
            p["stats"]["predictionTotal"] = int(p["stats"].get("predictionTotal") or 0) + 1
            if p.get("answer") == majority:
                p["stats"]["predictionHits"] = int(p["stats"].get("predictionHits") or 0) + 1
    room["status"] = "INVESTMENTS_LOCKED"
    room["phaseAt"] = _now()
    room["autoAdvanceAt"] = _now() + REVEAL_HOLD_SEC


def _compute_awards(room: dict[str, Any]) -> list[dict[str, str]]:
    players = _active_players(room)
    if not players:
        return []
    awards: list[dict[str, str]] = []

    def pick(key, reverse=True, label="", desc=""):
        ranked = sorted(players, key=lambda p: float(p["stats"].get(key) or 0), reverse=reverse)
        winner = ranked[0]
        if float(winner["stats"].get(key) or 0) == 0 and key != "cashPreference":
            return
        awards.append({"id": winner["id"], "name": winner["name"], "title": label, "desc": desc})

    pick("roundsHeld", True, "💎 Diamond Hands", "Held investments the longest.")
    pick("sells", True, "🐔 Paper Hands", "Sold most frequently.")
    pick("allIns", True, "🎰 Degenerate Investor", "Made the most ALL-IN investments.")
    # risk manager = highest average cash kept (use last cashPreference sum stored as cash at end)
    cash_king = max(players, key=lambda p: float(p.get("cash") or 0))
    awards.append(
        {
            "id": cash_king["id"],
            "name": cash_king["name"],
            "title": "🛟 Risk Manager",
            "desc": "Kept the most money in cash.",
        }
    )
    bag = min(players, key=lambda p: float(p["stats"].get("biggestLoss") or 0))
    if float(bag["stats"].get("biggestLoss") or 0) < 0:
        awards.append(
            {
                "id": bag["id"],
                "name": bag["name"],
                "title": "💀 Bag Holder",
                "desc": "Lost the most money on a held position.",
            }
        )
    psychic = max(
        players,
        key=lambda p: (
            float(p["stats"].get("predictionHits") or 0)
            / max(float(p["stats"].get("predictionTotal") or 1), 1)
        ),
    )
    if int(psychic["stats"].get("predictionTotal") or 0) > 0:
        awards.append(
            {
                "id": psychic["id"],
                "name": psychic["name"],
                "title": "🔮 Market Psychic",
                "desc": "Best prediction-question accuracy.",
            }
        )
    return awards


def _finalize(room: dict[str, Any]) -> None:
    # liquidate all
    for p in _active_players(room):
        p["cash"] = round(float(p.get("cash") or 0) + float(p.get("position") or 0), 2)
        p["position"] = 0.0
    ranked = sorted(_active_players(room), key=_net_worth, reverse=True)
    room["leaderboard"] = [
        {"id": p["id"], "name": p["name"], "avatar": p.get("avatar", 0), "netWorth": _net_worth(p)}
        for p in ranked
    ]
    room["awards"] = _compute_awards(room)
    room["winner"] = ranked[0] if ranked else None
    room["status"] = "FINAL_RESULTS"
    room["phaseAt"] = _now()
    room["autoAdvanceAt"] = None


def _after_decisions(room: dict[str, Any]) -> None:
    players = _active_players(room)
    room["decisionReveal"] = [
        {"id": p["id"], "name": p["name"], "decision": p.get("decision")} for p in players
    ]
    for p in players:
        dec = p.get("decision")
        if dec == "SELL":
            p["cash"] = round(float(p.get("cash") or 0) + float(p.get("position") or 0), 2)
            p["position"] = 0.0
            p["stats"]["sells"] = int(p["stats"].get("sells") or 0) + 1
        elif dec == "HOLD":
            p["stats"]["holds"] = int(p["stats"].get("holds") or 0) + 1
            if float(p.get("position") or 0) > 0:
                p["stats"]["roundsHeld"] = int(p["stats"].get("roundsHeld") or 0) + 1
        # CONTINUE: no position
    room["status"] = "DECISION_REVEAL"
    room["phaseAt"] = _now()
    room["autoAdvanceAt"] = _now() + 2.4


def _maybe_advance(room: dict[str, Any]) -> bool:
    """Auto-advance timed phases. Returns True if mutated."""
    status = room.get("status")
    auto_at = room.get("autoAdvanceAt")
    if auto_at is None or _now() < float(auto_at):
        return False

    if status == "MARKET_SIGNAL":
        room["status"] = "INVESTING"
        room["phaseAt"] = _now()
        room["autoAdvanceAt"] = None
        return True
    if status == "INVESTMENTS_LOCKED":
        _apply_market_move(room)
        return True
    if status == "MARKET_REVEAL":
        room["status"] = "HOLD_OR_SELL"
        room["phaseAt"] = _now()
        room["autoAdvanceAt"] = None
        for p in _active_players(room):
            p["decision"] = None
            p["decisionLocked"] = False
        return True
    if status == "DECISION_REVEAL":
        if int(room.get("round") or 0) >= TOTAL_ROUNDS:
            _finalize(room)
        else:
            room["status"] = "ROUND_COMPLETE"
            room["phaseAt"] = _now()
            room["autoAdvanceAt"] = _now() + 1.2
        return True
    if status == "ROUND_COMPLETE":
        _begin_round(room)
        return True
    return False


def _public_player(p: dict[str, Any], you_id: Optional[str], room: dict[str, Any]) -> dict[str, Any]:
    status = room.get("status")
    is_you = p.get("id") == you_id
    out = {
        "id": p["id"],
        "name": p["name"],
        "avatar": p.get("avatar", 0),
        "connected": (_now() - float(p.get("lastSeen") or 0)) <= ONLINE_SEC,
        "cash": round(float(p.get("cash") or 0), 2) if (is_you or status in ("MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS", "INVESTMENTS_LOCKED")) else None,
        "position": round(float(p.get("position") or 0), 2) if (is_you or status in ("MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS")) else None,
        "netWorth": _net_worth(p) if (is_you or status in ("MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS", "FINAL_RESULTS")) else None,
        "investLocked": bool(p.get("investLocked")),
        "decisionLocked": bool(p.get("decisionLocked")),
        "answerLocked": bool(p.get("answerLocked")),
        "briefingReady": bool(p.get("briefingReady")),
        "roundPl": p.get("roundPl") if status in ("MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS") else None,
    }
    if is_you:
        out["cash"] = round(float(p.get("cash") or 0), 2)
        out["position"] = round(float(p.get("position") or 0), 2)
        out["netWorth"] = _net_worth(p)
        out["investAmount"] = p.get("investAmount")
        out["decision"] = p.get("decision")
        out["answer"] = p.get("answer")
        out["roundInvest"] = p.get("roundInvest")
    # lock status always visible
    return out


def _public(room: dict[str, Any], you_id: Optional[str] = None) -> dict[str, Any]:
    _maybe_advance(room)
    market = deepcopy(room.get("market") or {})
    # strip private / authoritative-only fields
    market.pop("_privateAnswers", None)
    market.pop("bias", None)
    market.pop("favored", None)
    if room.get("status") in ("QUESTION", "MARKET_SIGNAL", "INVESTING") and market.get("mode") == "relationship":
        market.pop("answersReveal", None)
        # don't leak share before invest reveal
        if room.get("status") != "INVESTMENTS_LOCKED":
            pass
    if room.get("status") not in ("INVESTMENTS_LOCKED", "MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS"):
        market.pop("answersReveal", None)
        market["shareA"] = None if room.get("status") not in ("INVESTMENTS_LOCKED", "MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS") else market.get("shareA")
    if room.get("status") not in ("MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS"):
        market["movement"] = None
        market.pop("priceAfter", None)
        market.pop("priceBefore", None)

    you = _find_player(room, you_id) if you_id else None
    return {
        "code": room["code"],
        "status": room["status"],
        "round": room.get("round", 0),
        "totalRounds": TOTAL_ROUNDS,
        "hostId": room.get("hostId"),
        "youAreHost": bool(you_id and you_id == room.get("hostId")),
        "players": [_public_player(p, you_id, room) for p in room.get("players") or [] if not p.get("left")],
        "market": market,
        "investmentReveal": room.get("investmentReveal")
        if room.get("status")
        in ("INVESTMENTS_LOCKED", "MARKET_REVEAL", "HOLD_OR_SELL", "DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS")
        else None,
        "decisionReveal": room.get("decisionReveal")
        if room.get("status") in ("DECISION_REVEAL", "ROUND_COMPLETE", "FINAL_RESULTS")
        else None,
        "leaderboard": room.get("leaderboard"),
        "awards": room.get("awards"),
        "winner": (
            {
                "id": room["winner"]["id"],
                "name": room["winner"]["name"],
                "netWorth": _net_worth(room["winner"]),
            }
            if room.get("winner")
            else None
        ),
        "phaseAt": room.get("phaseAt"),
        "autoAdvanceAt": room.get("autoAdvanceAt"),
        "serverNow": _now(),
        "backend": "supabase" if room.get("_supabase") else "memory",
        "you": you_id,
        "minPlayers": MIN_PLAYERS,
        "maxPlayers": MAX_PLAYERS,
    }


class CreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=24)


class JoinBody(BaseModel):
    name: str = Field(min_length=1, max_length=24)


class IdBody(BaseModel):
    playerId: str = Field(min_length=6)


class InvestBody(BaseModel):
    playerId: str = Field(min_length=6)
    amount: float = Field(ge=0)


class AnswerBody(BaseModel):
    playerId: str = Field(min_length=6)
    answer: str = Field(pattern="^(a|b)$")


class DecisionBody(BaseModel):
    playerId: str = Field(min_length=6)
    decision: str = Field(pattern="^(SELL|HOLD|CONTINUE)$")


@router.post("/rooms")
def create_room(body: CreateBody) -> dict[str, Any]:
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
                "status": "LOBBY",
                "hostId": host_id,
                "round": 0,
                "price": 10.0,
                "players": [_new_player(host_id, body.name, 0)],
                "market": None,
                "usedQuestions": [],
                "investmentReveal": None,
                "decisionReveal": None,
                "leaderboard": None,
                "awards": None,
                "winner": None,
                "pendingMove": None,
                "phaseAt": _now(),
                "autoAdvanceAt": None,
                "updatedAt": _now(),
                "_supabase": _use_supabase(),
            }
            _save(room)
            return {"playerId": host_id, **_public(room, host_id)}
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Could not create room: {exc}") from exc
    raise HTTPException(status_code=500, detail="Could not generate a unique code.")


@router.post("/rooms/{code}/join")
def join_room(code: str, body: JoinBody) -> dict[str, Any]:
    room = _load(code)
    if room["status"] != "LOBBY":
        raise HTTPException(status_code=409, detail="This game already started.")
    players = _active_players(room)
    if len(players) >= MAX_PLAYERS:
        raise HTTPException(status_code=409, detail="Room is full (6 players max).")
    # duplicate name soft-ok; block empty
    pid = _player_id()
    room["players"].append(_new_player(pid, body.name, len(players)))
    _save(room)
    return {"playerId": pid, **_public(room, pid)}


@router.get("/rooms/{code}")
def get_room(code: str, playerId: Optional[str] = None) -> dict[str, Any]:
    """Poll room. May advance timed phases, but does not rewrite lastSeen (avoids wiping ready flags)."""
    room = _load(code)
    if _maybe_advance(room):
        _save(room)
    return _public(room, playerId)


@router.post("/rooms/{code}/heartbeat")
def heartbeat(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    p = _find_player(room, body.playerId)
    if not p or p.get("left"):
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    p["lastSeen"] = _now()
    advanced = _maybe_advance(room)
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/start")
def start_game(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    if body.playerId != room.get("hostId"):
        raise HTTPException(status_code=403, detail="Only the host can start the market.")
    if room["status"] != "LOBBY":
        raise HTTPException(status_code=400, detail="Game already started.")
    n = len(_active_players(room))
    if n < MIN_PLAYERS:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {MIN_PLAYERS} players to start. Right now you have {n}. Share your room code and wait for a friend to join.",
        )
    # Beginner briefing before Round 1
    for p in _active_players(room):
        p["briefingReady"] = False
    room["status"] = "BRIEFING"
    room["phaseAt"] = _now()
    room["autoAdvanceAt"] = None
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/briefing-ready")
def briefing_ready(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    p = _find_player(room, body.playerId)
    if not p or p.get("left"):
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "BRIEFING":
        return _public(room, body.playerId)
    p["briefingReady"] = True
    p["lastSeen"] = _now()
    if all(x.get("briefingReady") for x in _active_players(room)):
        _begin_round(room)
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/answer")
def submit_answer(code: str, body: AnswerBody) -> dict[str, Any]:
    room = _load(code)
    p = _find_player(room, body.playerId)
    if not p or p.get("left"):
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "QUESTION":
        raise HTTPException(status_code=400, detail="Not in question phase.")
    if p.get("answerLocked"):
        raise HTTPException(status_code=400, detail="Answer already locked.")
    p["answer"] = body.answer
    p["answerLocked"] = True
    p["lastSeen"] = _now()
    if all(x.get("answerLocked") for x in _active_players(room)):
        _after_answers_locked(room)
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/continue-signal")
def continue_signal(code: str, body: IdBody) -> dict[str, Any]:
    """Any player can ack market signal → investing (first call moves room)."""
    room = _load(code)
    p = _find_player(room, body.playerId)
    if not p:
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "MARKET_SIGNAL":
        return _public(room, body.playerId)
    room["status"] = "INVESTING"
    room["phaseAt"] = _now()
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/invest")
def invest(code: str, body: InvestBody) -> dict[str, Any]:
    room = _load(code)
    p = _find_player(room, body.playerId)
    if not p or p.get("left"):
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "INVESTING":
        raise HTTPException(status_code=400, detail="Not in investing phase.")
    if p.get("investLocked"):
        raise HTTPException(status_code=400, detail="Investment already locked.")
    cash = float(p.get("cash") or 0)
    amount = round(float(body.amount), 2)
    if amount < 0 or amount > cash + 1e-6:
        raise HTTPException(status_code=400, detail="Not enough cash.")
    amount = min(amount, cash)
    p["cash"] = round(cash - amount, 2)
    p["position"] = round(float(p.get("position") or 0) + amount, 2)
    p["roundInvest"] = amount
    p["investAmount"] = amount
    p["investLocked"] = True
    p["lastSeen"] = _now()
    if amount >= cash - 0.01 and amount > 0:
        p["stats"]["allIns"] = int(p["stats"].get("allIns") or 0) + 1
    if all(x.get("investLocked") for x in _active_players(room)):
        _lock_investments_advance(room)
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/decide")
def decide(code: str, body: DecisionBody) -> dict[str, Any]:
    room = _load(code)
    p = _find_player(room, body.playerId)
    if not p or p.get("left"):
        raise HTTPException(status_code=403, detail="Not a player in this room.")
    if room["status"] != "HOLD_OR_SELL":
        raise HTTPException(status_code=400, detail="Not in hold/sell phase.")
    if p.get("decisionLocked"):
        raise HTTPException(status_code=400, detail="Decision already locked.")
    pos = float(p.get("position") or 0)
    if pos <= 0 and body.decision != "CONTINUE":
        raise HTTPException(status_code=400, detail="No holdings — choose CONTINUE.")
    if pos > 0 and body.decision == "CONTINUE":
        raise HTTPException(status_code=400, detail="Choose SELL or HOLD.")
    p["decision"] = body.decision
    p["decisionLocked"] = True
    p["lastSeen"] = _now()
    if all(x.get("decisionLocked") for x in _active_players(room)):
        _after_decisions(room)
    _save(room)
    return _public(room, body.playerId)


@router.post("/rooms/{code}/leave")
def leave(code: str, body: IdBody) -> dict[str, Any]:
    room = _load(code)
    p = _find_player(room, body.playerId)
    if p:
        p["left"] = True
        p["lastSeen"] = _now()
        # if in lobby and host leaves, transfer host
        if room["status"] == "LOBBY" and body.playerId == room.get("hostId"):
            others = _active_players(room)
            room["hostId"] = others[0]["id"] if others else None
        # if mid-game and all remaining locked, advance
        if room["status"] == "INVESTING" and _active_players(room) and all(
            x.get("investLocked") for x in _active_players(room)
        ):
            _lock_investments_advance(room)
        if room["status"] == "QUESTION" and _active_players(room) and all(
            x.get("answerLocked") for x in _active_players(room)
        ):
            _after_answers_locked(room)
        if room["status"] == "HOLD_OR_SELL" and _active_players(room) and all(
            x.get("decisionLocked") for x in _active_players(room)
        ):
            _after_decisions(room)
        _save(room)
    return {"ok": True}
