"""Horizontal scaling infrastructure tests (Phase 6).

Tests for:
- District token budget model and enforcement
- Multi-key LLM API routing
- SSE message bus abstraction (in-process fallback)
"""

import pytest
from sqlalchemy import select

from app.database import get_session_factory


# ── District Token Budget Model Tests ────────────────────────────────────


@pytest.mark.asyncio
async def test_district_has_token_budget_fields():
    """District model has token budget fields."""
    from app.models import District

    assert hasattr(District, "daily_token_budget")
    assert hasattr(District, "tokens_used_today")


@pytest.mark.asyncio
async def test_district_token_budget_defaults():
    """Token budget defaults to a reasonable value, tokens_used starts at 0."""
    from app.models import District

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Budget Test", state="CO")
        s.add(district)
        await s.commit()
        await s.refresh(district)

        assert district.daily_token_budget > 0
        assert district.tokens_used_today == 0

        await s.delete(district)
        await s.commit()


# ── Multi-Key LLM Routing Tests ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_key_pool_round_robin():
    """KeyPool cycles through keys in round-robin order."""
    from app.scaling.key_pool import KeyPool

    pool = KeyPool(["key_a", "key_b", "key_c"])
    assert pool.next() == "key_a"
    assert pool.next() == "key_b"
    assert pool.next() == "key_c"
    assert pool.next() == "key_a"  # wraps around


@pytest.mark.asyncio
async def test_key_pool_single_key():
    """KeyPool with a single key always returns it."""
    from app.scaling.key_pool import KeyPool

    pool = KeyPool(["only_key"])
    assert pool.next() == "only_key"
    assert pool.next() == "only_key"


@pytest.mark.asyncio
async def test_key_pool_empty_raises():
    """KeyPool with no keys raises ValueError."""
    from app.scaling.key_pool import KeyPool

    with pytest.raises(ValueError):
        KeyPool([])


@pytest.mark.asyncio
async def test_key_pool_mark_rate_limited():
    """Marking a key as rate-limited skips it."""
    from app.scaling.key_pool import KeyPool

    pool = KeyPool(["key_a", "key_b", "key_c"])
    pool.mark_rate_limited("key_a", cooldown_seconds=60)

    # Should skip key_a
    assert pool.next() == "key_b"
    assert pool.next() == "key_c"
    assert pool.next() == "key_b"  # skips key_a again


@pytest.mark.asyncio
async def test_key_pool_all_rate_limited_returns_any():
    """When all keys are rate-limited, returns the least recently limited one."""
    from app.scaling.key_pool import KeyPool

    pool = KeyPool(["key_a", "key_b"])
    pool.mark_rate_limited("key_a", cooldown_seconds=60)
    pool.mark_rate_limited("key_b", cooldown_seconds=60)

    # Should still return something (oldest limited key)
    result = pool.next()
    assert result in ("key_a", "key_b")


# ── SSE Message Bus Tests ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_message_bus_subscribe_and_publish():
    """In-process message bus delivers messages to subscribers."""
    from app.scaling.message_bus import MessageBus

    bus = MessageBus()
    received = []

    async def handler(msg):
        received.append(msg)

    bus.subscribe("user_123", handler)
    await bus.publish("user_123", {"type": "token", "data": "hello"})

    assert len(received) == 1
    assert received[0]["data"] == "hello"


@pytest.mark.asyncio
async def test_message_bus_no_cross_channel():
    """Messages on one channel don't leak to another."""
    from app.scaling.message_bus import MessageBus

    bus = MessageBus()
    received_a = []
    received_b = []

    async def handler_a(msg):
        received_a.append(msg)

    async def handler_b(msg):
        received_b.append(msg)

    bus.subscribe("user_a", handler_a)
    bus.subscribe("user_b", handler_b)
    await bus.publish("user_a", {"data": "for_a"})

    assert len(received_a) == 1
    assert len(received_b) == 0


@pytest.mark.asyncio
async def test_message_bus_unsubscribe():
    """Unsubscribed handlers don't receive messages."""
    from app.scaling.message_bus import MessageBus

    bus = MessageBus()
    received = []

    async def handler(msg):
        received.append(msg)

    bus.subscribe("user_x", handler)
    bus.unsubscribe("user_x", handler)
    await bus.publish("user_x", {"data": "missed"})

    assert len(received) == 0


@pytest.mark.asyncio
async def test_message_bus_multiple_subscribers():
    """Multiple handlers on the same channel all receive the message."""
    from app.scaling.message_bus import MessageBus

    bus = MessageBus()
    received_1 = []
    received_2 = []

    async def handler_1(msg):
        received_1.append(msg)

    async def handler_2(msg):
        received_2.append(msg)

    bus.subscribe("shared", handler_1)
    bus.subscribe("shared", handler_2)
    await bus.publish("shared", {"data": "broadcast"})

    assert len(received_1) == 1
    assert len(received_2) == 1


# ── Token Budget Enforcement API Tests ──────────────────────────────────


@pytest.mark.asyncio
async def test_check_token_budget_under_limit(client):
    """Budget check returns allowed when under limit."""
    from app.models import District, User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Budget API Test", state="OR", daily_token_budget=100000, tokens_used_today=500)
        s.add(district)
        await s.flush()
        user = User(
            username="budget_student",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district.id,
            grade=5,
        )
        s.add(user)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "budget_student", "password": "test123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/scaling/token-budget")
    assert resp.status_code == 200
    data = resp.json()
    assert data["allowed"] is True
    assert data["remaining"] == 99500


@pytest.mark.asyncio
async def test_check_token_budget_over_limit(client):
    """Budget check returns denied when over limit."""
    from app.models import District, User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Over Budget Test", state="NE", daily_token_budget=1000, tokens_used_today=1000)
        s.add(district)
        await s.flush()
        user = User(
            username="over_budget_student",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district.id,
            grade=5,
        )
        s.add(user)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "over_budget_student", "password": "test123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/scaling/token-budget")
    assert resp.status_code == 200
    data = resp.json()
    assert data["allowed"] is False
    assert data["remaining"] == 0
