"""Production observability tests (Phase 7).

Tests for:
- Correlation ID middleware (adds X-Correlation-ID to responses)
- Per-app health metrics endpoint
- Cost dashboard endpoint (token usage per district)
"""

import pytest
from sqlalchemy import select

from app.database import get_session_factory


# ── Correlation ID Middleware Tests ──────────────────────────────────────


@pytest.mark.asyncio
async def test_response_has_correlation_id(client):
    """Every response includes an X-Correlation-ID header."""
    resp = await client.get("/api/health")
    assert "x-correlation-id" in resp.headers
    assert len(resp.headers["x-correlation-id"]) > 0


@pytest.mark.asyncio
async def test_correlation_id_is_uuid_format(client):
    """Correlation ID is a valid UUID format."""
    import uuid
    resp = await client.get("/api/health")
    cid = resp.headers["x-correlation-id"]
    # Should not raise
    uuid.UUID(cid)


@pytest.mark.asyncio
async def test_correlation_id_echoed_if_provided(client):
    """If client sends X-Correlation-ID, server echoes it back."""
    custom_id = "custom-corr-id-12345"
    resp = await client.get("/api/health", headers={"X-Correlation-ID": custom_id})
    assert resp.headers["x-correlation-id"] == custom_id


@pytest.mark.asyncio
async def test_each_request_gets_unique_id(client):
    """Different requests get different correlation IDs."""
    resp1 = await client.get("/api/health")
    resp2 = await client.get("/api/health")
    assert resp1.headers["x-correlation-id"] != resp2.headers["x-correlation-id"]


# ── Per-App Health Metrics Tests ────────────────────────────────────────


@pytest.mark.asyncio
async def test_app_health_endpoint_exists(client):
    """App health endpoint returns metrics for all apps."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/observability/app-health")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_app_health_includes_metrics(client):
    """Each app health entry includes success_rate, avg_duration, error_rate."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/observability/app-health")
    assert resp.status_code == 200
    data = resp.json()
    # At least seeded apps should appear
    if len(data) > 0:
        entry = data[0]
        assert "app_id" in entry
        assert "invocation_count" in entry
        assert "success_count" in entry
        assert "error_count" in entry
        assert "timeout_count" in entry
        assert "avg_duration_ms" in entry


# ── Cost Dashboard Tests ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_cost_dashboard_endpoint_exists(client):
    """Cost dashboard returns token usage summary."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/observability/cost-dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_input_tokens" in data
    assert "total_output_tokens" in data
    assert "per_app" in data
    assert isinstance(data["per_app"], list)


@pytest.mark.asyncio
async def test_cost_dashboard_per_app_breakdown(client):
    """Cost dashboard includes per-app token breakdown."""
    from app.models import ToolInvocation, Conversation
    from app.auth.passwords import hash_password

    # Create some invocations with token counts
    sf = get_session_factory()
    async with sf() as s:
        # Need a conversation first
        from app.models import User
        result = await s.execute(select(User).where(User.username == "student1"))
        user = result.scalar_one()

        conv = Conversation(user_id=user.id, title="cost test")
        s.add(conv)
        await s.flush()

        inv = ToolInvocation(
            conversation_id=conv.id,
            app_id="chess",
            tool_name="test",
            input_tokens=100,
            output_tokens=50,
            status="success",
            duration_ms=200,
        )
        s.add(inv)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/observability/cost-dashboard")
    data = resp.json()
    chess_entry = next((e for e in data["per_app"] if e["app_id"] == "chess"), None)
    assert chess_entry is not None
    assert chess_entry["input_tokens"] >= 100
    assert chess_entry["output_tokens"] >= 50


@pytest.mark.asyncio
async def test_cost_dashboard_requires_admin(client):
    """Non-admin users cannot access cost dashboard."""
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/observability/cost-dashboard")
    assert resp.status_code == 403
