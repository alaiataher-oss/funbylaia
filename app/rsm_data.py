"""Relationship Stock Market — question bank (easy to expand)."""

from __future__ import annotations

QUESTIONS: list[dict] = [
    {
        "id": "beach_mountains",
        "prompt": "What would you rather choose?",
        "a": {"label": "Beach vacation", "emoji": "🏖", "ticker": "BEACH", "name": "Beach Corp"},
        "b": {"label": "Mountain vacation", "emoji": "🏔", "ticker": "PEAK", "name": "Peak Co"},
    },
    {
        "id": "night_out_in",
        "prompt": "Ideal Friday night?",
        "a": {"label": "Night Out", "emoji": "🪩", "ticker": "OUT", "name": "Nightlife Inc"},
        "b": {"label": "Night In", "emoji": "🛋", "ticker": "COZY", "name": "Cozy Holdings"},
    },
    {
        "id": "sweet_savory",
        "prompt": "Craving check:",
        "a": {"label": "Sweet", "emoji": "🍰", "ticker": "SUGR", "name": "Sugar Rush Ltd"},
        "b": {"label": "Savory", "emoji": "🍕", "ticker": "SLTY", "name": "Salty Snacks Co"},
    },
    {
        "id": "call_text",
        "prompt": "How do you prefer to talk?",
        "a": {"label": "Call", "emoji": "📞", "ticker": "CALL", "name": "VoiceLine"},
        "b": {"label": "Text", "emoji": "💬", "ticker": "TXT", "name": "TypeSpace"},
    },
    {
        "id": "plan_spontaneous",
        "prompt": "Trip energy:",
        "a": {"label": "Plan Everything", "emoji": "🗓", "ticker": "PLAN", "name": "Agenda Corp"},
        "b": {"label": "Be Spontaneous", "emoji": "🎲", "ticker": "WING", "name": "Wing It LLC"},
    },
    {
        "id": "money_freetime",
        "prompt": "What matters more right now?",
        "a": {"label": "Money", "emoji": "💵", "ticker": "CASH", "name": "Cashflow Co"},
        "b": {"label": "Free Time", "emoji": "⏳", "ticker": "TIME", "name": "Slow Hours Inc"},
    },
    {
        "id": "city_country",
        "prompt": "Where do you recharge?",
        "a": {"label": "City", "emoji": "🏙", "ticker": "CITY", "name": "Metro Pulse"},
        "b": {"label": "Countryside", "emoji": "🌾", "ticker": "FARM", "name": "Open Field Co"},
    },
    {
        "id": "early_night",
        "prompt": "Your natural clock:",
        "a": {"label": "Early Bird", "emoji": "🌅", "ticker": "DAWN", "name": "Sunrise Group"},
        "b": {"label": "Night Owl", "emoji": "🦉", "ticker": "MIDN", "name": "Midnight Markets"},
    },
    {
        "id": "love_career",
        "prompt": "If you had to pick a season:",
        "a": {"label": "Love", "emoji": "💞", "ticker": "LOVR", "name": "Heart Cap"},
        "b": {"label": "Career", "emoji": "💼", "ticker": "CLMB", "name": "Climb Corp"},
    },
    {
        "id": "travel_luxury",
        "prompt": "Extra money goes to:",
        "a": {"label": "Travel", "emoji": "✈️", "ticker": "TRIP", "name": "Wander Fund"},
        "b": {"label": "Luxury Items", "emoji": "✨", "ticker": "LUXE", "name": "Luxe Line"},
    },
]

CLASSIC_TICKERS = [
    {"ticker": "LOVR", "name": "Love Industries", "headlines": [
        "LOVR just announced a mysterious new product.",
        "Rumors swirl that LOVR is launching a couples app.",
        "Analysts whisper LOVR might acquire HeartTech.",
    ]},
    {"ticker": "TEXT", "name": "TextMe Corp", "headlines": [
        "TEXT rolls out read-receipt drama mode.",
        "TEXT claims a breakthrough in reply-speed AI.",
        "Whispers: TEXT partnering with a dating giant.",
    ]},
    {"ticker": "DATE", "name": "DateNight Inc", "headlines": [
        "DATE reports surge in spontaneous reservations.",
        "DATE tests a VIP surprise-date marketplace.",
        "DATE stock buzz after a celebrity endorsement.",
    ]},
    {"ticker": "VIBE", "name": "GoodVibes LLC", "headlines": [
        "VIBE drops a limited mood playlist NFT. Kind of.",
        "VIBE claims weekends just got 12% happier.",
        "Insiders say VIBE is expanding into group hangs.",
    ]},
    {"ticker": "SHIP", "name": "Relationship Co", "headlines": [
        "SHIP files a patent for conflict-resolution bots.",
        "SHIP announces “soft launch” of honesty mode.",
        "SHIP sees unusual options activity overnight.",
    ]},
]
