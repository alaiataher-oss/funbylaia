#!/usr/bin/env python3
"""Generate 1000 simple, fun, original conversation questions.

Inspired by common themes in popular psychology / connection research
(gratitude, values, preferences, play, belonging) — written fresh in plain language.
No scraped or copied published lists.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "questions_seed.json"
NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

DIST = {
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


def pack(
    text: str,
    *,
    cat: str,
    depth: str,
    sens: str,
    settings: list[str],
    rels: list[str],
    close: list[str],
    occ: list[str],
    feelings: list[str],
    themes: list[str],
    group_safe: bool,
    follow: str | None = None,
) -> dict:
    if not text.endswith("?"):
        text += "?"
    return {
        "question": text,
        "followUp": follow,
        "primaryCategory": cat,
        "occasions": occ,
        "settings": settings,
        "relationships": rels,
        "closeness": close,
        "depth": depth,
        "feelings": feelings,
        "themes": themes,
        "groupSafe": group_safe,
        "sensitivity": sens,
    }


def light() -> list[dict]:
    qs = [
        ("What’s the best small thing that happened to you this week?", "Why did it stick?"),
        ("What’s your comfort snack right now?", "Sweet or salty?"),
        ("Morning person or night person — and has that changed?", "What’s your best hour?"),
        ("What’s a song you secretly still love?", "Want to play it?"),
        ("What’s your go-to order when you can’t decide?", "Has it changed?"),
        ("What’s a show you can rewatch forever?", "Comfort or nostalgia?"),
        ("What’s your favorite kind of weather for hanging out?", "Indoor or outdoor?"),
        ("What’s a tiny win you’re proud of lately?", "Did you tell anyone?"),
        ("What’s something that always makes you smile weirdly fast?", "A meme, a smell, a voice?"),
        ("What’s your favorite lazy weekend plan?", "Solo or with people?"),
        ("Coffee, tea, or neither — what’s the real answer?", "Any ritual around it?"),
        ("What’s a hobby you’d try for fun, not to be good at?", "Why that one?"),
        ("What’s the nicest compliment you’ve gotten recently?", "Did you believe it?"),
        ("What’s your favorite way to spend a free hour?", "Phone away or phone on?"),
        ("What’s a place nearby that feels like a mini escape?", "Food, park, or quiet corner?"),
        ("What’s a childhood snack you’d bring back?", "Does it still taste the same?"),
        ("What’s your phone wallpaper story?", "Who or what is it?"),
        ("What’s a skill you’re quietly getting better at?", "Practice or accident?"),
        ("What’s your favorite season — and why for real?", "Clothes, mood, or food?"),
        ("What’s something you’re looking forward to this month?", "Big or tiny?"),
    ]
    more = []
    topics = [
        "playlists", "markets", "walks", "naps", "sunsets", "bookstores", "bakeries", "games",
        "stickers", "candles", "plants", "pets", "memes", "road snacks", "rainy days", "sunny benches",
        "thrift finds", "museum gift shops", "voice notes", "group chats", "polaroids", "postcards",
        "homemade soup", "ice cream runs", "sunrise alarms", "late breakfasts", "blanket forts", "board games",
        "karaoke songs", "dance breaks", "stretching", "journaling", "doodling", "puzzles", "card tricks",
        "bubble tea", "matcha phases", "soda nostalgia", "pizza debates", "taco nights", "brunch spots",
        "ferry rides", "bike lanes", "city lights", "quiet cafés", "park picnics", "rooftop views",
        "secondhand books", "vinyl crates", "film cameras", "concert merch", "sports jerseys", "team rituals",
        "language apps", "travel maps", "packing lists", "hotel breakfasts", "window seats", "aisle seats",
        "laundry day playlists", "clean-sheet feeling", "fresh haircuts", "new sneakers", "cozy socks", "big hoodies",
        "sunrise walks", "midnight snacks", "Sunday resets", "Friday energy", "holiday lights", "birthday cakes",
    ]
    frames = [
        "What’s your honest take on {t}?",
        "If {t} had a ranking in your life, top three moments?",
        "What would a perfect day involving {t} look like?",
        "Who in your life also gets weirdly excited about {t}?",
    ]
    for t in topics:
        for fr in frames:
            more.append((fr.format(t=t), "Keep it light — fun details welcome."))
    out = []
    for text, fu in qs + more:
        out.append(
            pack(
                text,
                cat="light-icebreaker",
                depth="light",
                sens="low",
                settings=["two-people", "group"],
                rels=["friend", "friends", "getting-to-know", "new-people", "family", "mixed-group"],
                close=["just-met", "getting-closer", "already-close"],
                occ=["first-hangout", "casual-catch-up", "no-particular-occasion", "dinner-or-party", "road-trip", "date-night"],
                feelings=["curious", "playful"],
                themes=["everyday", "fun"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:100]


def playful() -> list[dict]:
    qs = [
        ("Would you rather have endless plane tickets or endless dinner invites?", "Why?"),
        ("If your life had a subtitle this week, what would it be?", "Funny or honest?"),
        ("What’s a hill you’ll die on about food?", "Anyone disagree here?"),
        ("If you could teleport for errands only, where first?", "Would you still walk sometimes?"),
        ("What fictional character would survive your group chat?", "Who gets muted?"),
        ("If awkward silence had a theme song, what’s yours?", "Upbeat or dramatic?"),
        ("Invent a holiday for ordinary kindness — what’s the ritual?", "Who celebrates first?"),
        ("What’s your most specific unpopular opinion that’s still friendly?", "No politics — keep it fun."),
        ("If you hosted a tiny museum about yourself, what’s in room one?", "Gift shop item?"),
        ("Would you rather always arrive early or always have perfect timing?", "Which are you now?"),
        ("If your week was a movie genre, what genre is it?", "Who’s the sidekick?"),
        ("What’s a superpower that’s actually annoying?", "Would you still want it?"),
        ("If you renamed Monday, what would you call it?", "Does it help?"),
        ("What’s a conspiracy theory about your friend group that’s obviously fake and funny?", "Keep it kind."),
        ("If you could only ask one question to understand someone faster, what is it?", "Why that one?"),
        ("What’s your chaotic-good energy in group plans?", "Does it work?"),
        ("If your laugh needed a caption, what would it say?", "Who captions you best?"),
        ("Would you rather perfect coffee forever or perfect playlists forever?", "Dealbreakers?"),
        ("If you designed stickers for moods, which sticker are you today?", "Rare or common?"),
        ("What’s a game everyone can play in under two minutes?", "Teach us?"),
        ("If this table wrote a sitcom cold open, what’s the first joke?", "Who’s the main character?"),
        ("Would you rather have auto-replies that sound like you or a playlist that always fits the room?", "Pick one."),
        ("If your keys could talk, what’s their first complaint?", "Lost again?"),
        ("What’s a warning label for your overthinking?", "Keep it cute."),
        ("If you soft-launched a new personality trait, which one?", "Who notices first?"),
        ("Would you rather never lose a sock or never lose a charger?", "Personal crisis level?"),
        ("If grocery shopping had a soundtrack, what’s playing at produce?", "Genre?"),
        ("What’s a board-game rule you’d invent for this group?", "Win condition?"),
        ("If you bottled the feeling of a good hangout, what does the label warn about?", "Side effects?"),
        ("Would you rather always know the lunch plan or always know the weekend plan?", "Which stress is worse?"),
    ]
    left = [
        "unlimited snacks", "one perfect vacation day a month", "a pause button for awkward moments",
        "auto-translated jokes", "a rewind for conversations", "a skip intro for small talk",
        "a map of cozy cafés", "free dessert forever", "priority boarding for friendships",
        "a mute button for group-chat chaos", "instant good seating", "perfect weather on hangout days",
        "a camera roll that sorts itself", "zero spam emails", "always-fresh flowers",
        "a pet that understands sarcasm", "never-cold coffee", "on-time public transit",
        "a fridge that restocks favorites", "a calendar that protects rest",
    ]
    right = [
        "a pet that texts back", "a kitchen that cleans itself", "friends who always know the vibe",
        "a map of good conversations", "a button that finds the funniest person nearby",
        "a playlist that reads the room", "a jacket with unlimited pockets", "shoes that never hurt",
        "a suitcase that packs itself", "a plant that texts reminders", "a couch that fits everyone",
        "a toast that never burns", "a joke that always lands kindly", "a weekend that feels longer",
        "a group chat that never gets tense", "a camera with perfect lighting always",
        "a notebook that finishes your thoughts", "a door that opens to the right café",
        "a train seat by the window every time", "a friend who brings the right snacks",
    ]
    extras = []
    for i, x in enumerate(left):
        for j, y in enumerate(right):
            if (i + j) % 3 == 0:  # thin out but keep variety
                extras.append((f"Would you rather have {x} or {y}?", "No overthinking — pick fast."))
    invent = [
        "a snack that doesn’t exist yet", "a rule for kinder group chats", "a nickname for Monday mornings",
        "a tiny festival for your block", "an emoji for I’m really listening", "a stamp for good conversations",
        "a warning label for overthinking", "a souvenir for ordinary Tuesdays", "a weather app for social energy",
        "a toast for unfinished plans", "a gentle way to end a hangout", "a menu item named after tonight",
        "a handshake for this group", "a sticker for rare moods", "a fortune cookie that’s actually useful",
        "a road-trip game without license plates", "a seat-assignment method for dinners",
        "a do-not-disturb sign with better wording", "a museum audio guide for friendship",
        "a boarding pass for good hangouts",
    ]
    for item in invent:
        extras.append((f"Invent {item}: what does yours look like?", "Would anyone else want a version?"))

    out = []
    for text, fu in qs + extras:
        out.append(
            pack(
                text,
                cat="playful-hypothetical",
                depth="light",
                sens="low",
                settings=["two-people", "group"],
                rels=["friend", "friends", "mixed-group", "new-people", "couples", "getting-to-know"],
                close=["just-met", "getting-closer", "already-close"],
                occ=["dinner-or-party", "road-trip", "celebration", "casual-catch-up", "no-particular-occasion", "first-hangout"],
                feelings=["playful", "curious"],
                themes=["hypothetical", "fun"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:100]


def friendship() -> list[dict]:
    qs = [
        ("What’s a small thing friends do that makes you feel cared for?", "Do you do that for others?"),
        ("How do you usually show you’re glad someone showed up?", "Words or actions?"),
        ("What’s an underrated green flag in friendship?", "Have you seen it lately?"),
        ("What’s a friendship tradition you’d love to start?", "Monthly or random?"),
        ("What kind of check-in actually feels good to you?", "What misses?"),
        ("What’s a shared memory that still makes you laugh?", "Tell the short version."),
        ("When you miss a friend, do you text, plan, or wait?", "What works better?"),
        ("What’s something a friend taught you without trying?", "Still use it?"),
        ("How do you repair things after a weird misunderstanding?", "What helps first?"),
        ("What’s a compliment from a friend you still keep?", "Want to pass one on tonight?"),
        ("What’s the difference between a fun friend and a steady friend for you?", "Can someone be both?"),
        ("What’s a boundary that made a friendship healthier?", "Hard to say at first?"),
        ("How do you like celebrating friends without a big party?", "Notes, food, presence?"),
        ("What’s a friendship lesson you learned later than you wanted?", "Still practicing?"),
        ("What activity always upgrades a hangout?", "Walk, cook, game?"),
        ("What’s your favorite way to welcome someone into a friend group?", "What helps them settle?"),
        ("What’s a silly inside joke that still works?", "Explain it badly on purpose?"),
        ("How do you know a friendship is getting realer?", "Time, honesty, or ease?"),
        ("What’s something you’d thank a friend for out loud tonight?", "Optional to say it now."),
        ("What’s one friendship habit you want to practice more this month?", "Name it."),
    ]
    stems = [
        "support", "humor", "honesty", "loyalty", "play", "patience", "hype", "listening", "adventure", "comfort",
        "accountability", "random check-ins", "shared playlists", "food runs", "late talks", "road trips",
        "voice notes", "memes", "surprise visits", "quiet company",
    ]
    more = []
    for s in stems:
        more.append((f"How does good friendship look like around {s} for you?", "Who does this well?"))
        more.append((f"What’s a funny or sweet story about friendship and {s}?", "Keep it kind."))
        more.append((f"If you could bottle friendship {s}, when would you open it?", "Who gets a sip?"))
        more.append((f"What do you wish more friends understood about your need for {s}?", "How do you ask?"))
    out = []
    for text, fu in qs + more:
        out.append(
            pack(
                text,
                cat="friendship",
                depth="meaningful",
                sens="medium",
                settings=["two-people", "group"],
                rels=["friend", "friends"],
                close=["getting-closer", "already-close"],
                occ=["casual-catch-up", "late-night-talk", "no-particular-occasion", "celebration", "road-trip"],
                feelings=["closer", "understood", "seen"],
                themes=["friendship"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:100]


def family() -> list[dict]:
    qs = []
    bits = [
        "family meals", "holiday chaos", "road trips home", "old nicknames", "house rules", "sibling jokes",
        "cousin energy", "family recipes", "photo albums", "Sunday routines", "group chats named weirdly",
        "inherited habits", "family catchphrases", "reunion games", "kitchen helpers", "chores wars",
        "birthday songs", "graduation days", "moving days", "guest-room politics",
        "grandma’s stories", "dad jokes", "mom’s playlists", "pet names for relatives", "shared blankets",
        "airport pickups", "school drop-offs", "late-night fridge raids",
    ]
    for b in bits:
        qs.append((f"What’s a funny or sweet memory connected to {b}?", "Who else remembers it?"))
        qs.append((f"What did {b} teach you about family — in a simple way?", "Still true?"))
        qs.append((f"If you could keep one tradition around {b}, what would it be?", "Why that one?"))
        qs.append((f"What’s something about {b} you’d explain to someone new to your family?", "One sentence."))
    out = []
    for text, fu in qs:
        out.append(
            pack(
                text,
                cat="family",
                depth="meaningful",
                sens="medium",
                settings=["two-people", "group"],
                rels=["family"],
                close=["getting-closer", "already-close", "just-met"],
                occ=["celebration", "casual-catch-up", "dinner-or-party", "no-particular-occasion"],
                feelings=["nostalgic", "closer"],
                themes=["family"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:90]


def romance() -> list[dict]:
    light_qs = [
        ("What’s your favorite easy date that still feels special?", "Home or out?"),
        ("What’s a song that reminds you of each other in a fun way?", "Play it later?"),
        ("What’s a snack you two always end up sharing?", "Sweet or salty?"),
        ("What’s a silly competition you keep having?", "Who’s winning?"),
        ("What’s the best compliment you’ve given each other recently?", "Want to add one now?"),
        ("What’s a tiny ritual that makes ordinary days nicer?", "Morning or night?"),
        ("What’s a place nearby that feels like “your” spot?", "Why that one?"),
        ("What’s a show or movie that feels like a date default?", "Rewatch or new?"),
        ("What’s a funny habit of theirs you secretly love?", "Have you told them?"),
        ("What’s a weekend vibe you two do best — cozy or outing?", "Recent example?"),
        ("What’s a photo of you two that always makes you grin?", "Where was it?"),
        ("What’s a playlist era that belongs to this relationship?", "Opening track?"),
        ("What’s the nicest surprise that didn’t cost much?", "Want to recreate it?"),
        ("What’s a food opinion you two will never agree on?", "Keep it cute."),
        ("What’s a pet name or nickname story worth retelling?", "Who started it?"),
        ("What’s a walk route that always helps you reconnect?", "Day or night?"),
        ("What’s a game you two can play in under five minutes?", "Teach it?"),
        ("What’s a shared goal that’s actually fun, not stressful?", "This month?"),
        ("What’s a text style that means “I’m thinking of you”?", "Emoji allowed."),
        ("What’s one light thing you want more of together this week?", "Concrete and easy."),
        ("What’s a café order that feels like “us”?", "Still getting it?"),
        ("What’s a meme or reel you’d send each other today?", "Send it after?"),
    ]
    qs = [
        ("What’s a small thing your partner does that feels like being chosen again?", "Do they know?"),
        ("How do you two reset after a busy week?", "Talk, walk, or snack?"),
        ("What’s an inside joke that still works under stress?", "Origin story?"),
        ("What do you admire in how your partner loves people?", "Friends, family, strangers?"),
        ("What’s a future detail you’re quietly excited about together?", "Trip, home, project?"),
        ("How do you ask for reassurance without making it a speech?", "What lands?"),
        ("What’s a compliment you want to hear more from each other?", "Ask for it?"),
        ("What’s a soft adventure you’d love as a pair soon?", "Near or far?"),
        ("How do you keep flirting fun after you already know each other?", "Ideas?"),
        ("What’s a we decision you’re proud of?", "Big or tiny?"),
        ("What’s a comfort meal that belongs to the two of you?", "Takeout counts."),
        ("How do you apologize in a way that actually lands?", "Different from yours?"),
        ("What’s something your partner taught you about yourself?", "Surprising?"),
        ("How do you protect couple time without disappearing from friends?", "Balance tips?"),
        ("What’s a private phrase only you two use?", "Meaning?"),
        ("How do you stay curious about each other?", "Questions? Dates?"),
        ("What’s one way you want to love them better this week?", "Concrete."),
        ("How do you two handle weekends as a team?", "What helps?"),
        ("What’s a sweet memory about mornings you’d retell gladly?", "Why that one?"),
        ("What would make food feel more connected for both of you?", "One small experiment?"),
    ]
    themes = [
        "weekends", "mornings", "texts", "travel", "friends", "family visits", "work stress",
        "celebrations", "quiet nights", "road trips", "shared hobbies", "surprises", "routines",
        "future plans", "home vibes", "humor", "patience", "teamwork", "rest", "errands",
        "birthdays", "rainy days", "cook nights", "movie picks", "budget talks",
    ]
    more = []
    for t in themes:
        more.append((f"How do you two handle {t} as a team?", "What helps?"))
        more.append((f"What’s a sweet memory about {t} you’d retell gladly?", "Why that one?"))
        more.append((f"What would make {t} feel more connected for both of you?", "One small experiment?"))
        more.append((f"What’s funny about how you each approach {t}?", "Keep it affectionate."))
    out = []
    for text, fu in light_qs:
        out.append(
            pack(
                text,
                cat="romantic-partner",
                depth="light",
                sens="low",
                settings=["two-people"],
                rels=["romantic-partner", "couples"],
                close=["getting-closer", "already-close", "just-met"],
                occ=["date-night", "casual-catch-up", "no-particular-occasion"],
                feelings=["closer", "playful", "seen"],
                themes=["romance", "fun"],
                group_safe=False,
                follow=fu,
            )
        )
    for text, fu in qs + more:
        out.append(
            pack(
                text,
                cat="romantic-partner",
                depth="meaningful",
                sens="medium",
                settings=["two-people"],
                rels=["romantic-partner", "couples"],
                close=["getting-closer", "already-close"],
                occ=["date-night", "late-night-talk", "celebration", "casual-catch-up", "no-particular-occasion"],
                feelings=["closer", "seen", "understood"],
                themes=["romance"],
                group_safe=False,
                follow=fu,
            )
        )
    return out[:100]


def gtk() -> list[dict]:
    qs = [
        ("What’s something fun people usually learn about you later?", "Want to spoil it now?"),
        ("What are you casually curious about lately?", "Any rabbit hole?"),
        ("What’s a kindness you try to practice even on tired days?", "Example?"),
        ("What’s a place that always resets your mood a little?", "Why there?"),
        ("What’s a story that shows your sense of humor best?", "Short version."),
        ("What’s a value you return to when decisions get noisy?", "One word?"),
        ("What’s a change of mind you’re oddly proud of?", "What shifted?"),
        ("What’s a comfort zone you’re stretching on purpose?", "Scary or exciting?"),
        ("What’s something you’re learning to be gentler about with yourself?", "Progress count."),
        ("What’s a question you wish more new people asked?", "Ask it back?"),
        ("What’s your real weekend energy — high, soft, or mixed?", "Best match for plans?"),
        ("What’s a creative thing you enjoy without needing to be great?", "Share an example?"),
        ("What’s a small risk that paid off recently?", "Would you repeat it?"),
        ("What’s a topic you can talk about longer than expected?", "Warning label?"),
        ("What’s a way you recharge that people sometimes misunderstand?", "Need alone time?"),
        ("What’s a goal you’re approaching sideways, not head-on?", "Why sideways?"),
        ("What compliment style actually reaches you?", "Specific or simple?"),
        ("What’s something you hope stays true about you as life changes?", "Why that?"),
        ("What’s a chapter title for your current season?", "Tone?"),
        ("What’s a yes that still feels brave for you?", "What helps you say it?"),
    ]
    traits = [
        "patience", "curiosity", "humor", "loyalty", "ambition", "gentleness", "courage", "play", "focus", "warmth",
        "independence", "honesty", "imagination", "discipline", "empathy", "hope", "rest", "adventure", "steadiness", "wit",
    ]
    more = []
    for t in traits:
        more.append((f"Where does {t} show up in your everyday life?", "Missable details welcome."))
        more.append((f"When has {t} been worth it even if it cost something small?", "What did it protect?"))
        more.append((f"Who in your life models {t} in a way you like?", "What do they do?"))
        more.append((f"If someone wanted to understand your {t}, what should they notice?", "One clue."))
    out = []
    for text, fu in qs + more:
        out.append(
            pack(
                text,
                cat="getting-to-know",
                depth="meaningful",
                sens="low",
                settings=["two-people"],
                rels=["getting-to-know", "friend"],
                close=["just-met", "getting-closer"],
                occ=["first-hangout", "casual-catch-up", "date-night", "no-particular-occasion", "late-night-talk"],
                feelings=["curious", "seen", "closer"],
                themes=["identity"],
                group_safe=False,
                follow=fu,
            )
        )
    return out[:100]


def reunion() -> list[dict]:
    # keep category for distribution but map to catch-up / anytime / late-night
    qs = []
    lenses = [
        "work", "friends", "hobbies", "city life", "home life", "health habits", "humor", "priorities",
        "weekend vibes", "music taste", "food eras", "travel", "family", "confidence", "stress style",
        "hopes", "random obsessions", "comfort shows", "morning routines", "night routines",
    ]
    for x in lenses:
        qs.append((f"What’s changed about your {x} since we last caught up?", "Short update?"))
        qs.append((f"What’s stayed the same about your {x} in a good way?", "Still into it?"))
        qs.append((f"What story about {x} did you want to tell me sooner?", "Tell it now."))
        qs.append((f"What should I know about your {x} to feel caught up?", "One highlight."))
    out = []
    for text, fu in qs:
        out.append(
            pack(
                text,
                cat="reunion-long-distance",
                depth="meaningful",
                sens="medium",
                settings=["two-people", "group"],
                rels=["friend", "friends", "family", "romantic-partner", "getting-to-know"],
                close=["getting-closer", "already-close"],
                occ=["casual-catch-up", "late-night-talk", "no-particular-occasion", "celebration"],
                feelings=["nostalgic", "closer", "seen"],
                themes=["catch-up"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:80]


def group() -> list[dict]:
    qs = [
        ("What’s a tiny win someone here might not have announced?", "Two answers, then next."),
        ("What skill at this table would you love a 5-minute lesson in?", "Who volunteers?"),
        ("What local tip feels secretly good?", "Share one."),
        ("What group tradition could we invent tonight?", "Name it."),
        ("What song would improve this room immediately?", "Genre?"),
        ("What kindness did you see recently that belongs in this chat?", "Pass it on."),
        ("What food opinion should we vote on?", "No wrong answers."),
        ("What compliment would you give the group vibe right now?", "Be specific."),
        ("What game can we play that doesn’t put anyone on the spot?", "Rules in one line."),
        ("What book or show gets your one-sentence pitch?", "No spoilers."),
        ("What childhood snack ranking should we debate?", "Top three."),
        ("What surprising talent might someone here be hiding?", "Optional reveal."),
        ("What weekend plan format does this group do best?", "Why?"),
        ("What gratitude isn’t about work?", "Share one."),
        ("What ridiculous hypothetical should we vote on?", "Options welcome."),
        ("What’s one thing you’re mildly obsessed with lately?", "Pass if you want."),
        ("What’s a recommendation you’d give this table tonight?", "Food, place, or show."),
        ("What’s a toast-worthy ordinary thing from today?", "Ten-second toast."),
        ("What’s a travel story that still gets a reaction?", "Keep it PG."),
        ("What’s a shared goal this table could adopt for fun this month?", "Tiny goals win."),
    ]
    twists = [
        "Keep answers under 20 seconds.",
        "Point kindly to who goes next.",
        "Passing is allowed.",
        "Build on the last answer.",
    ]
    expanded = []
    for q, fu in qs:
        for t in twists:
            expanded.append((f"{q} ({t})", fu))
    out = []
    for text, fu in expanded:
        out.append(
            pack(
                text,
                cat="group-dinner-party",
                depth="light",
                sens="low",
                settings=["group"],
                rels=["friends", "mixed-group", "new-people", "family", "couples"],
                close=["just-met", "getting-closer", "already-close"],
                occ=["dinner-or-party", "celebration", "road-trip", "no-particular-occasion"],
                feelings=["playful", "curious", "closer"],
                themes=["group"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:80]


def celebration() -> list[dict]:
    qs = []
    items = [
        "a quiet win", "a person who helped", "a lesson from this year", "a joy you want more of",
        "a fear you outgrew a little", "a tradition worth starting", "a memory from today",
        "something you’re proud of", "a gift of time that meant a lot", "a hope for next season",
        "a funny mishap in the highlight reel", "a song for this energy", "a toast for someone else",
        "a small luxury that helped", "a plot twist that turned useful", "a community that held you",
        "a skill you leveled up quietly", "a place that deserves credit", "a gentler goal", "a way to keep celebrating",
    ]
    for item in items:
        qs.append((f"What’s {item} worth toasting tonight?", "Who wants to add?"))
        qs.append((f"If we toast to {item}, what words belong in 10 seconds?", "Keep it warm."))
        qs.append((f"How has {item} shaped how you show up tonight?", "One sentence."))
        qs.append((f"Who else here might recognize {item} in their own life?", "Invite them in."))
    out = []
    for text, fu in qs:
        out.append(
            pack(
                text,
                cat="celebration",
                depth="meaningful",
                sens="low",
                settings=["two-people", "group"],
                rels=["friend", "friends", "family", "romantic-partner", "mixed-group", "couples"],
                close=["just-met", "getting-closer", "already-close"],
                occ=["celebration", "dinner-or-party"],
                feelings=["seen", "closer", "playful"],
                themes=["celebration"],
                group_safe=True,
                follow=fu,
            )
        )
    return out[:80]


def meaningful() -> list[dict]:
    qs = [
        ("What’s something about your life right now I wouldn’t know unless I asked?", "Has it changed how you see yourself?"),
        ("What decision are you glad you made slowly?", "What did waiting protect?"),
        ("What value do you practice more than you talk about?", "Where does it show?"),
        ("What season of life would you revisit for the feeling, not the facts?", "What feeling?"),
        ("What are you unlearning with patience?", "What replaces it?"),
        ("What does success mean for you lately?", "Whose definition were you using?"),
        ("How has your relationship with yourself improved this year?", "What helped?"),
        ("What question are you living into instead of answering fast?", "Okay with unknown?"),
        ("What kindness recalibrated your standards?", "Do you pass it on?"),
        ("Where does meaning hide in an ordinary week for you?", "Morning, commute, night?"),
        ("What hope are you holding without forcing a timeline?", "What nurtures it?"),
        ("What regret turned into useful guidance?", "What guidance?"),
        ("What courage looked small from the outside?", "What changed?"),
        ("What story you tell about yourself needs an update?", "New ending?"),
        ("What kind of rest actually restores you?", "Do you schedule it?"),
        ("What responsibility do you carry gladly?", "Why gladly?"),
        ("What curiosity keeps making your life larger?", "Recent example?"),
        ("What goodbye taught you something about staying?", "What lesson?"),
        ("What beginning are you in without announcing it?", "How does it feel?"),
        ("What truth can you say more softly now?", "Who hears it?"),
    ]
    topics = [
        "ambition", "belonging", "time", "home", "work", "art", "joy", "community", "creativity", "rest",
        "courage", "friendship", "family", "health", "money habits", "attention", "play", "service", "learning", "hope",
        "focus", "kindness", "boundaries", "growth", "gratitude",
    ]
    more = []
    for t in topics:
        more.append((f"How is your relationship with {t} evolving?", "What prompted the shift?"))
        more.append((f"What would a wiser week look like around {t}?", "One small change?"))
        more.append((f"What story about {t} are you ready to revise?", "What stays true?"))
    out = []
    for text, fu in qs + more:
        out.append(
            pack(
                text,
                cat="meaningful-reflection",
                depth="meaningful",
                sens="medium",
                settings=["two-people"],
                rels=["friend", "romantic-partner", "family", "getting-to-know"],
                close=["getting-closer", "already-close"],
                occ=["late-night-talk", "casual-catch-up", "date-night", "no-particular-occasion"],
                feelings=["seen", "understood", "curious"],
                themes=["reflection"],
                group_safe=False,
                follow=fu,
            )
        )
    return out[:90]


def deep() -> list[dict]:
    qs = [
        ("What do you want to be known for by people closest to you?", "Are you living toward it?"),
        ("What can you share here because trust already exists?", "What helps after sharing?"),
        ("What need have you been hesitant to name?", "What would support look like?"),
        ("What part of your inner world do you wish someone asked about carefully?", "How should they ask?"),
        ("What kind of love have you had to redefine — romantic or otherwise?", "What did that protect?"),
        ("What loss still shapes how you show up — even quietly?", "What tenderness helps?"),
        ("What hope feels fragile enough for safe people only?", "What would nurture it?"),
        ("What pattern are you interrupting on purpose?", "What support helps?"),
        ("What do you understand about loneliness differently now?", "What connection helps?"),
        ("What forgiveness — given or received — changed your posture?", "Anything unfinished?"),
        ("How do you want to be held emotionally on heavy days?", "Words or presence?"),
        ("What are you grieving that isn’t a death but still counts?", "What helps?"),
        ("What desire are you learning not to apologize for?", "What made that possible?"),
        ("What trust-fall taught you about your own bravery?", "Would you leap again?"),
        ("What conversation do you still wish you’d had — and what would you say now?", "To whom?"),
        ("What softness do you protect because the world can be sharp?", "Who sees it?"),
        ("What commitment are you making to future-you this year?", "Need witnesses?"),
        ("What fear of being misunderstood still visits?", "What soothes it?"),
        ("What intimacy matters to you beyond romance?", "Friendship, creative, spiritual?"),
        ("What heart story would you only tell someone who stays?", "What makes someone a stayer?"),
    ]
    topics = [
        "belonging", "forgiveness", "desire", "fear", "hope", "anger", "tenderness", "self-respect",
        "family loyalty", "friendship grief", "quiet needs", "joy permission", "body trust", "creative courage",
        "time scarcity", "shame soft spots", "repair", "safety", "being known", "being enough",
    ]
    more = []
    for t in topics:
        more.append((f"Where does {t} still ask for compassion in your life?", "What would compassion look like this week?"))
        more.append((f"What true sentence about {t} would you offer someone who’s earned trust?", "What do you need after?"))
        more.append((f"How has {t} shaped the way you let people close?", "What are you practicing now?"))
    out = []
    for text, fu in qs + more:
        out.append(
            pack(
                text,
                cat="deep-intimate",
                depth="deep",
                sens="high",
                settings=["two-people"],
                rels=["romantic-partner", "friend", "family"],
                close=["already-close"],
                occ=["late-night-talk", "date-night"],
                feelings=["understood", "closer", "seen"],
                themes=["intimacy"],
                group_safe=False,
                follow=fu,
            )
        )
    return out[:80]


def main() -> None:
    builders = {
        "light-icebreaker": light,
        "playful-hypothetical": playful,
        "friendship": friendship,
        "family": family,
        "romantic-partner": romance,
        "getting-to-know": gtk,
        "reunion-long-distance": reunion,
        "group-dinner-party": group,
        "celebration": celebration,
        "meaningful-reflection": meaningful,
        "deep-intimate": deep,
    }
    all_q: list[dict] = []
    idx = 1
    global_seen: set[str] = set()
    for cat, need in DIST.items():
        items = builders[cat]()
        unique = []
        local_seen: set[str] = set()
        for q in items:
            key = " ".join(q["question"].lower().split())
            if key in local_seen:
                continue
            # if global collision, lightly uniquify
            final = q["question"]
            if key in global_seen:
                final = q["question"][:-1] + " — with the people here?"
                key2 = " ".join(final.lower().split())
                if key2 in global_seen or key2 in local_seen:
                    continue
                q = {**q, "question": final}
                key = key2
            local_seen.add(key)
            global_seen.add(key)
            unique.append(q)
        # pad if still short
        n = 0
        while len(unique) < need:
            n += 1
            text = f"What’s one simple thing about connection you’d share in a {cat.replace('-', ' ')} chat right now (prompt {n})?"
            key = " ".join(text.lower().split())
            if key in global_seen:
                continue
            global_seen.add(key)
            unique.append(
                pack(
                    text,
                    cat=cat,
                    depth="light" if cat in {"light-icebreaker", "playful-hypothetical", "group-dinner-party"} else ("deep" if cat == "deep-intimate" else "meaningful"),
                    sens="low" if cat in {"light-icebreaker", "playful-hypothetical", "group-dinner-party", "getting-to-know", "celebration"} else ("high" if cat == "deep-intimate" else "medium"),
                    settings=["group"] if cat == "group-dinner-party" else (["two-people"] if cat in {"romantic-partner", "getting-to-know", "deep-intimate", "meaningful-reflection"} else ["two-people", "group"]),
                    rels=["romantic-partner", "couples"] if cat == "romantic-partner" else (["getting-to-know", "friend"] if cat == "getting-to-know" else ["friend", "friends"]),
                    close=["already-close"] if cat == "deep-intimate" else ["just-met", "getting-closer", "already-close"],
                    occ=["date-night", "casual-catch-up"] if cat == "romantic-partner" else ["no-particular-occasion", "casual-catch-up"],
                    feelings=["curious"],
                    themes=[cat],
                    group_safe=cat not in {"romantic-partner", "deep-intimate", "getting-to-know", "meaningful-reflection"},
                    follow="Keep it simple.",
                )
            )
        if len(unique) < need:
            raise RuntimeError(f"{cat}: {len(unique)} < {need}")
        for q in unique[:need]:
            all_q.append(
                {
                    "id": f"q{idx:04d}",
                    **q,
                    "status": "active",
                    "timesShown": 0,
                    "createdAt": NOW,
                    "updatedAt": NOW,
                }
            )
            idx += 1
    assert len(all_q) == 1000
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(all_q, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(all_q)} simple questions to {OUT}")


if __name__ == "__main__":
    main()
