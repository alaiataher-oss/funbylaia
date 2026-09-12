from __future__ import annotations

import random
import uuid
from typing import Any

from app.models import DeckQuestion, DeckRequest, DeckResponse
from app.store import allowed_sensitivity_for, bump_times_shown, is_near_duplicate, load_all


DEPTH_ORDER = {"light": 0, "meaningful": 1, "deep": 2}

OCCASION_LABELS = {
    "first-hangout": "First hangout",
    "casual-catch-up": "Catch-up",
    "date-night": "Date night",
    "late-night-talk": "Late-night talk",
    "celebration": "Celebration",
    "road-trip": "Road trip",
    "dinner-or-party": "Dinner / hangout",
    "no-particular-occasion": "Anytime",
}

# Occasion → allowed settings (fixes date-night + group)
OCCASION_SETTINGS = {
    "first-hangout": {"two-people"},
    "casual-catch-up": {"two-people", "group"},
    "date-night": {"two-people"},
    "late-night-talk": {"two-people"},
    "celebration": {"two-people", "group"},
    "road-trip": {"two-people", "group"},
    "dinner-or-party": {"group"},
    "no-particular-occasion": {"two-people", "group"},
}

REL_LABELS = {
    "friend": "Friend",
    "friends": "Friends",
    "family": "Family",
    "romantic-partner": "Romantic Partner",
    "getting-to-know": "Someone New",
    "mixed-group": "Mixed Group",
    "couples": "Couples",
    "new-people": "New People",
}

CLOSE_LABELS = {
    "just-met": "Just Met",
    "getting-closer": "Getting Closer",
    "already-close": "Already Close",
}


def _resolve_depth(req: DeckRequest) -> str:
    if req.depth != "surprise":
        return req.depth
    # surprise: pick best depth for closeness
    if req.closeness == "just-met":
        return "light"
    if req.closeness == "getting-closer":
        return "meaningful"
    return "deep"


def score_question(
    q: dict[str, Any],
    req: DeckRequest,
    depth: str,
    recent: set[str],
    prev: set[str],
    *,
    allow_anytime_fallback: bool = False,
) -> float | None:
    if q.get("status") != "active":
        return None
    if q["id"] in prev:
        return None

    allowed_settings = OCCASION_SETTINGS.get(req.occasion, {"two-people", "group"})
    if req.setting not in allowed_settings:
        return None

    allowed_sens = allowed_sensitivity_for(req.closeness, depth)
    if q.get("sensitivity") not in allowed_sens:
        return None
    if req.setting == "group" and not q.get("groupSafe"):
        return None
    if req.setting not in q.get("settings", []):
        return None
    if req.relationship not in q.get("relationships", []):
        return None
    if req.closeness not in q.get("closeness", []):
        return None

    occs = set(q.get("occasions", []))
    exact = req.occasion in occs
    anytime = "no-particular-occasion" in occs
    if not exact and not (allow_anytime_fallback and anytime):
        return None

    score = 0.0
    if exact:
        score += 5
    elif anytime:
        score += 1
    score += 3  # setting
    score += 3  # relationship
    score += 3  # closeness
    if q.get("depth") == depth:
        score += 4
    elif abs(DEPTH_ORDER.get(q.get("depth", ""), 9) - DEPTH_ORDER.get(depth, 9)) == 1:
        score += 1
    else:
        return None

    for feeling in req.feelings[:2]:
        if feeling in q.get("feelings", []):
            score += 2

    if q["id"] in recent:
        score -= 10

    return score


def _collect(req: DeckRequest, depth: str, recent: set[str], prev: set[str], allow_anytime: bool) -> list[tuple[float, dict[str, Any]]]:
    scored: list[tuple[float, dict[str, Any]]] = []
    for q in load_all():
        s = score_question(q, req, depth, recent, prev, allow_anytime_fallback=allow_anytime)
        if s is None:
            continue
        scored.append((s, q))
    return scored


def generate_deck(req: DeckRequest) -> DeckResponse:
    depth = _resolve_depth(req)
    recent = set(req.recentQuestionIds[-100:])
    prev = set(req.previousDeckIds)

    scored = _collect(req, depth, recent, prev, allow_anytime=False)
    # Anytime fallback only when needed — never for date-night (too specific)
    if len(scored) < req.count and req.occasion != "date-night":
        scored = _collect(req, depth, recent, prev, allow_anytime=True)

    if len(scored) < req.count:
        recent_relaxed = set(list(req.recentQuestionIds[-100:])[:-40]) if len(req.recentQuestionIds) > 40 else set()
        scored = _collect(
            req,
            depth,
            recent_relaxed,
            prev,
            allow_anytime=(req.occasion != "date-night"),
        )

    if len(scored) < req.count:
        scored = _collect(
            req,
            depth,
            set(),
            set(),
            allow_anytime=(req.occasion != "date-night"),
        )

    # weighted random from top candidates
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return DeckResponse(
            deckId=str(uuid.uuid4()),
            questions=[],
            requested=req.count,
            returned=0,
            notice="We found 0 questions that closely match your choices. Adjust a filter to unlock more.",
            filters={**req.model_dump(), "resolvedDepth": depth},
        )

    top = scored[: max(req.count * 6, 40)]
    weights = [max(0.1, s + 5) for s, _ in top]
    chosen: list[dict[str, Any]] = []
    pool = list(zip(top, weights, strict=False))

    while pool and len(chosen) < req.count:
        items, wts = zip(*[(p[0][1], p[1]) for p in pool], strict=False)
        pick = random.choices(list(items), weights=list(wts), k=1)[0]
        # near-dup check inside deck
        if any(is_near_duplicate(pick["question"], c["question"]) for c in chosen):
            pool = [p for p in pool if p[0][1]["id"] != pick["id"]]
            continue
        # avoid consecutive same theme
        if chosen and pick.get("themes") and chosen[-1].get("themes"):
            if pick["themes"][0] == chosen[-1]["themes"][0] and random.random() < 0.7:
                # try skip once
                pool = [p for p in pool if p[0][1]["id"] != pick["id"]]
                # put back later maybe
                continue
        chosen.append(pick)
        pool = [p for p in pool if p[0][1]["id"] != pick["id"]]

    # arrange safest → most personal within depth
    sens_order = {"low": 0, "medium": 1, "high": 2}
    chosen.sort(key=lambda q: (sens_order.get(q.get("sensitivity", "low"), 0), DEPTH_ORDER.get(q.get("depth", "light"), 0)))

    notice = None
    if len(chosen) < req.count:
        notice = (
            f"We found {len(chosen)} questions that closely match your choices. "
            "Adjust a filter to unlock more, or continue with this smaller deck."
        )

    bump_times_shown([q["id"] for q in chosen])

    context = f"{OCCASION_LABELS.get(req.occasion, req.occasion)} · {REL_LABELS.get(req.relationship, req.relationship)} · {CLOSE_LABELS.get(req.closeness, req.closeness)}"
    deck_questions = [
        DeckQuestion(
            id=q["id"],
            question=q["question"],
            followUp=q.get("followUp"),
            depth=q.get("depth", depth),
            contextLabel=context,
            sensitivity=q.get("sensitivity", "low"),
        )
        for q in chosen
    ]

    return DeckResponse(
        deckId=str(uuid.uuid4()),
        questions=deck_questions,
        requested=req.count,
        returned=len(deck_questions),
        notice=notice,
        filters={**req.model_dump(), "resolvedDepth": depth},
    )
