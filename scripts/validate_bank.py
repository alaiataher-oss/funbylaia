#!/usr/bin/env python3
"""Validate the 1000-question bank and recommendation safety rules."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.constants import CATEGORY_TARGETS, CLOSENESS_SENSITIVITY, DEPTH_SENSITIVITY, OCCASIONS  # noqa: E402
from app.models import DeckRequest  # noqa: E402
from app.recommend import generate_deck  # noqa: E402
from app.store import ensure_store, load_all, normalize_text  # noqa: E402


def is_near_duplicate(a: str, b: str, threshold: float = 0.92) -> bool:
    wa, wb = set(normalize_text(a).split()), set(normalize_text(b).split())
    if not wa or not wb:
        return False
    return len(wa & wb) / len(wa | wb) >= threshold


PLACEHOLDER_RE = re.compile(r"TODO|placeholder|lorem ipsum|sample question", re.I)


def main() -> int:
    ensure_store()
    qs = load_all()
    errors: list[str] = []
    warnings: list[str] = []

    if len(qs) != 1000:
        errors.append(f"Expected 1000 questions, found {len(qs)}")

    ids = [q["id"] for q in qs]
    if len(ids) != len(set(ids)):
        errors.append("Duplicate IDs found")

    texts = [normalize_text(q["question"]) for q in qs]
    if len(texts) != len(set(texts)):
        errors.append("Duplicate normalized question text found")

    for q in qs:
        if not q.get("question", "").endswith("?"):
            errors.append(f"{q['id']} missing ?")
        if PLACEHOLDER_RE.search(q.get("question", "")):
            errors.append(f"{q['id']} looks like placeholder")
        if not q.get("occasions") or not q.get("settings") or not q.get("relationships") or not q.get("closeness"):
            errors.append(f"{q['id']} missing required tags")
        depth, sens = q.get("depth"), q.get("sensitivity")
        if sens not in DEPTH_SENSITIVITY.get(depth, set()):
            errors.append(f"{q['id']} incompatible depth/sensitivity {depth}/{sens}")
        if "group" in q.get("settings", []) and set(q.get("settings", [])) == {"group"} and not q.get("groupSafe"):
            errors.append(f"{q['id']} group-only but not groupSafe")

    counts = Counter(q["primaryCategory"] for q in qs)
    for cat, need in CATEGORY_TARGETS.items():
        got = counts.get(cat, 0)
        if got != need:
            errors.append(f"Category {cat}: {got} != {need}")

    # near-dup scan (sample pairs by theme)
    by_theme: dict[str, list] = {}
    for q in qs:
        key = (q.get("themes") or ["_"])[0]
        by_theme.setdefault(key, []).append(q)
    near = 0
    for group in by_theme.values():
        for i, a in enumerate(group):
            for b in group[i + 1 : i + 8]:
                if is_near_duplicate(a["question"], b["question"]):
                    near += 1
                    warnings.append(f"Near-duplicate: {a['id']} ~ {b['id']}")
    if near > 40:
        errors.append(f"Too many near-duplicates flagged: {near}")

    # common filter combos should return up to 30 where possible
    combos = [
        ("first-hangout", "two-people", "getting-to-know", "just-met", "light"),
        ("casual-catch-up", "two-people", "friend", "getting-closer", "meaningful"),
        ("date-night", "two-people", "romantic-partner", "already-close", "deep"),
        ("dinner-or-party", "group", "friends", "just-met", "light"),
        ("celebration", "group", "family", "getting-closer", "light"),
        ("late-night-talk", "two-people", "romantic-partner", "already-close", "deep"),
        ("no-particular-occasion", "two-people", "friend", "getting-closer", "surprise"),
        ("road-trip", "group", "friends", "getting-closer", "light"),
    ]
    thin = []
    for occasion, setting, relationship, closeness, depth in combos:
        res = generate_deck(
            DeckRequest(
                occasion=occasion,
                setting=setting,
                relationship=relationship,
                closeness=closeness,
                depth=depth,
                feelings=[],
                count=30,
                recentQuestionIds=[],
                previousDeckIds=[],
            )
        )
        if res.returned < 30:
            thin.append((occasion, setting, relationship, closeness, depth, res.returned))
        # archived never appear
        for q in res.questions:
            full = next(x for x in qs if x["id"] == q.id)
            if full.get("status") != "active":
                errors.append(f"Archived/inactive question generated: {q.id}")
            allowed = CLOSENESS_SENSITIVITY[closeness] & DEPTH_SENSITIVITY[
                res.filters.get("resolvedDepth", depth if depth != "surprise" else "light")
            ]
            # re-check with resolved depth
            rd = res.filters.get("resolvedDepth", depth)
            allowed = CLOSENESS_SENSITIVITY[closeness] & DEPTH_SENSITIVITY[rd]
            if full.get("sensitivity") not in allowed:
                errors.append(f"Unsafe sensitivity leaked: {q.id}")
            if setting == "group" and not full.get("groupSafe"):
                errors.append(f"Non-groupSafe in group deck: {q.id}")

    print("=== Question Bank Validation ===")
    print(f"Questions: {len(qs)}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    for e in errors[:50]:
        print("ERROR:", e)
    for w in warnings[:20]:
        print("WARN:", w)
    print("\nFilter combos returning < 30:")
    for row in thin:
        print(" ", row)
    if not thin:
        print("  (none)")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
