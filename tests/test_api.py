from __future__ import annotations

import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.main import app  # noqa: E402
from app.store import ensure_store, load_all  # noqa: E402

client = TestClient(app)


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_seed_count():
    ensure_store()
    assert len(load_all()) == 1000


def test_generate_deck_respects_safety():
    payload = {
        "occasion": "first-hangout",
        "setting": "two-people",
        "relationship": "getting-to-know",
        "closeness": "just-met",
        "depth": "light",
        "feelings": ["curious"],
        "count": 10,
        "recentQuestionIds": [],
        "previousDeckIds": [],
    }
    res = client.post("/api/decks/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["returned"] <= 10
    assert data["returned"] >= 1
    for q in data["questions"]:
        assert q["sensitivity"] == "low"


def test_group_only_group_safe():
    payload = {
        "occasion": "dinner-or-party",
        "setting": "group",
        "relationship": "friends",
        "closeness": "just-met",
        "depth": "light",
        "feelings": [],
        "count": 15,
        "recentQuestionIds": [],
        "previousDeckIds": [],
    }
    data = client.post("/api/decks/generate", json=payload).json()
    assert data["returned"] >= 1
    ids = {q["id"] for q in data["questions"]}
    for q in load_all():
        if q["id"] in ids:
            assert q["groupSafe"] is True


def test_admin_rejects_unauthorized_create():
    res = client.post(
        "/api/questions",
        json={
            "question": "Is this unauthorized?",
            "primaryCategory": "light-icebreaker",
            "occasions": ["casual-catch-up"],
            "settings": ["two-people"],
            "relationships": ["friend"],
            "closeness": ["just-met"],
            "depth": "light",
            "sensitivity": "low",
            "groupSafe": True,
        },
    )
    assert res.status_code == 401


def test_admin_crud_flow():
    token = client.post("/api/admin/login", json={"password": "changeme"}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    create = client.post(
        "/api/questions",
        headers=headers,
        json={
            "question": "What tiny detail made today feel kinder than expected?",
            "followUp": "Would you share it with someone?",
            "primaryCategory": "light-icebreaker",
            "occasions": ["casual-catch-up", "no-particular-occasion"],
            "settings": ["two-people", "group"],
            "relationships": ["friend", "friends"],
            "closeness": ["just-met", "getting-closer"],
            "depth": "light",
            "feelings": ["curious"],
            "themes": ["test"],
            "groupSafe": True,
            "sensitivity": "low",
        },
    )
    assert create.status_code == 200, create.text
    qid = create.json()["question"]["id"]
    patched = client.patch(
        f"/api/questions/{qid}",
        headers=headers,
        json={"followUp": "Updated follow-up?"},
    )
    assert patched.status_code == 200
    assert patched.json()["followUp"] == "Updated follow-up?"
    archived = client.post(f"/api/questions/{qid}/archive", headers=headers)
    assert archived.json()["status"] == "archived"
    # archived should not appear in new decks easily — generate and ensure not present
    deck = client.post(
        "/api/decks/generate",
        json={
            "occasion": "casual-catch-up",
            "setting": "two-people",
            "relationship": "friend",
            "closeness": "just-met",
            "depth": "light",
            "feelings": [],
            "count": 30,
            "recentQuestionIds": [],
            "previousDeckIds": [],
        },
    ).json()
    assert qid not in {x["id"] for x in deck["questions"]}
    client.delete(f"/api/questions/{qid}", headers=headers)


def test_new_deck_differs_from_previous():
    payload = {
        "occasion": "casual-catch-up",
        "setting": "two-people",
        "relationship": "friend",
        "closeness": "getting-closer",
        "depth": "meaningful",
        "feelings": ["closer"],
        "count": 8,
        "recentQuestionIds": [],
        "previousDeckIds": [],
    }
    a = client.post("/api/decks/generate", json=payload).json()
    payload["previousDeckIds"] = [q["id"] for q in a["questions"]]
    payload["recentQuestionIds"] = [q["id"] for q in a["questions"]]
    b = client.post("/api/decks/generate", json=payload).json()
    if a["returned"] and b["returned"]:
        assert [q["id"] for q in a["questions"]] != [q["id"] for q in b["questions"]]
