"""Shared constants and enums for Question Cards."""

from __future__ import annotations

from typing import Literal

Occasion = Literal[
    "first-hangout",
    "casual-catch-up",
    "reunion",
    "date-night",
    "late-night-talk",
    "celebration",
    "road-trip",
    "dinner-or-party",
    "long-distance",
    "no-particular-occasion",
]

Setting = Literal["two-people", "group"]

Relationship = Literal[
    "friend",
    "friends",
    "family",
    "romantic-partner",
    "getting-to-know",
    "mixed-group",
    "couples",
    "new-people",
]

Closeness = Literal["just-met", "getting-closer", "already-close"]
Depth = Literal["light", "meaningful", "deep"]
Feeling = Literal["seen", "closer", "curious", "nostalgic", "playful", "understood"]
Sensitivity = Literal["low", "medium", "high"]
Status = Literal["active", "archived"]

OCCASIONS: list[str] = [
    "first-hangout",
    "casual-catch-up",
    "reunion",
    "date-night",
    "late-night-talk",
    "celebration",
    "road-trip",
    "dinner-or-party",
    "long-distance",
    "no-particular-occasion",
]

SETTINGS = ["two-people", "group"]
RELATIONSHIPS = [
    "friend",
    "friends",
    "family",
    "romantic-partner",
    "getting-to-know",
    "mixed-group",
    "couples",
    "new-people",
]
CLOSENESS = ["just-met", "getting-closer", "already-close"]
DEPTHS = ["light", "meaningful", "deep"]
FEELINGS = ["seen", "closer", "curious", "nostalgic", "playful", "understood"]
SENSITIVITIES = ["low", "medium", "high"]
STATUSES = ["active", "archived"]

PRIMARY_CATEGORIES = [
    "light-icebreaker",
    "playful-hypothetical",
    "friendship",
    "family",
    "romantic-partner",
    "getting-to-know",
    "reunion-long-distance",
    "group-dinner-party",
    "celebration",
    "meaningful-reflection",
    "deep-intimate",
]

CATEGORY_TARGETS = {
    "light-icebreaker": 100,
    "playful-hypothetical": 100,
    "friendship": 100,
    "family": 90,
    "romantic-partner": 100,
    "getting-to-know": 100,
    "reunion-long-distance": 80,
    "group-dinner-party": 80,
    "celebration": 80,
    "meaningful-reflection": 90,
    "deep-intimate": 80,
}

DEPTH_SENSITIVITY = {
    "light": {"low"},
    "meaningful": {"low", "medium"},
    "deep": {"medium", "high"},
}

CLOSENESS_SENSITIVITY = {
    "just-met": {"low"},
    "getting-closer": {"low", "medium"},
    "already-close": {"low", "medium", "high"},
}
