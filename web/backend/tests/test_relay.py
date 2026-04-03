"""Server-side app relay tests (Phase 4 scaling).

Tests for:
- AppRegistration has server_api_url and signing_secret fields
- HMAC signature generation and verification
- Invoke endpoint relays to app backend when server_api_url is set
- Invoke endpoint falls back to postMessage mode when no server_api_url
- Timeout handling for unresponsive apps
- Relay response logged in tool_invocations
"""

import hashlib
import hmac
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from app.database import get_session_factory


# ── Model Tests ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_app_registration_has_relay_fields():
    """AppRegistration has server_api_url and signing_secret fields."""
    from app.models import AppRegistration

    assert hasattr(AppRegistration, "server_api_url")
    assert hasattr(AppRegistration, "signing_secret")


@pytest.mark.asyncio
async def test_app_registration_relay_fields_nullable():
    """Relay fields default to None (backward compat for postMessage apps)."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="relay_field_test",
            name="Relay Field Test",
            description="Testing relay fields",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            status="active",
            is_active=True,
        )
        s.add(app)
        await s.commit()
        await s.refresh(app)

        assert app.server_api_url is None
        assert app.signing_secret is None

        await s.delete(app)
        await s.commit()


@pytest.mark.asyncio
async def test_app_registration_with_relay_config():
    """An app can be created with server_api_url and signing_secret."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="relay_config_test",
            name="Relay Config Test",
            description="Has relay config",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            server_api_url="https://api.example.com/invoke",
            signing_secret="whsec_test_secret_123",
            status="active",
            is_active=True,
        )
        s.add(app)
        await s.commit()
        await s.refresh(app)

        assert app.server_api_url == "https://api.example.com/invoke"
        assert app.signing_secret == "whsec_test_secret_123"

        await s.delete(app)
        await s.commit()


# ── HMAC Signing Tests ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_compute_relay_signature():
    """compute_relay_signature produces a valid HMAC-SHA256 hex digest."""
    from app.apps.relay import compute_relay_signature

    secret = "whsec_test_secret"
    payload = {"tool": "start_game", "params": {"difficulty": "easy"}}
    timestamp = 1700000000

    sig = compute_relay_signature(secret, payload, timestamp)

    # Verify it's a valid hex string of correct length (SHA256 = 64 hex chars)
    assert len(sig) == 64
    assert all(c in "0123456789abcdef" for c in sig)


@pytest.mark.asyncio
async def test_compute_relay_signature_deterministic():
    """Same inputs produce the same signature."""
    from app.apps.relay import compute_relay_signature

    secret = "whsec_deterministic"
    payload = {"tool": "test", "params": {}}
    ts = 1700000000

    sig1 = compute_relay_signature(secret, payload, ts)
    sig2 = compute_relay_signature(secret, payload, ts)
    assert sig1 == sig2


@pytest.mark.asyncio
async def test_compute_relay_signature_different_secrets():
    """Different secrets produce different signatures."""
    from app.apps.relay import compute_relay_signature

    payload = {"tool": "test", "params": {}}
    ts = 1700000000

    sig1 = compute_relay_signature("secret_a", payload, ts)
    sig2 = compute_relay_signature("secret_b", payload, ts)
    assert sig1 != sig2


@pytest.mark.asyncio
async def test_verify_relay_signature():
    """verify_relay_signature returns True for valid signatures."""
    from app.apps.relay import compute_relay_signature, verify_relay_signature

    secret = "whsec_verify_test"
    payload = {"tool": "test", "params": {}}
    ts = 1700000000

    sig = compute_relay_signature(secret, payload, ts)
    assert verify_relay_signature(secret, payload, ts, sig) is True
    assert verify_relay_signature(secret, payload, ts, "bad_signature") is False


# ── Relay Forwarding Tests ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_invoke_relays_to_server_api_url(client):
    """When app has server_api_url, invoke forwards to the app's backend."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    # Create an app with server_api_url
    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "start_game", "description": "Start", "parameters": []}]
        app = AppRegistration(
            app_id="relay_forward_test",
            name="Relay Forward Test",
            description="Test relay",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            server_api_url="https://api.example.com/invoke",
            signing_secret="whsec_forward_test",
            status="active",
            is_active=True,
        )
        s.add(app)
        await s.commit()

    # Login
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    # Mock httpx to capture the relay request
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"result": "game_started", "state": {"board": "ready"}}

    with patch("app.apps.relay.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock_client_instance

        resp = await client.post("/api/apps/relay_forward_test/invoke", json={
            "tool": "start_game",
            "params": {"difficulty": "easy"},
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["relay"] is True
    assert data["result"] == {"result": "game_started", "state": {"board": "ready"}}


@pytest.mark.asyncio
async def test_invoke_falls_back_to_postmessage(client):
    """When app has no server_api_url, invoke returns params for postMessage dispatch."""
    # Login
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    # chess is a seeded app with no server_api_url
    resp = await client.post("/api/apps/chess/invoke", json={
        "tool": "test",
        "params": {},
    })
    assert resp.status_code == 200
    data = resp.json()
    # Should NOT have relay=True, should return iframe_url for postMessage
    assert data.get("relay") is not True
    assert "iframe_url" in data


@pytest.mark.asyncio
async def test_relay_sends_hmac_signature(client):
    """Relay request includes X-ChatBridge-Signature and X-ChatBridge-Timestamp headers."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "do_thing", "description": "Do", "parameters": []}]
        app = AppRegistration(
            app_id="hmac_header_test",
            name="HMAC Header Test",
            description="Test HMAC",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            server_api_url="https://api.example.com/invoke",
            signing_secret="whsec_hmac_header_test",
            status="active",
            is_active=True,
        )
        s.add(app)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"ok": True}

    with patch("app.apps.relay.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock_client_instance

        await client.post("/api/apps/hmac_header_test/invoke", json={
            "tool": "do_thing",
            "params": {},
        })

        # Verify the relay call included signature headers
        call_kwargs = mock_client_instance.post.call_args
        headers = call_kwargs.kwargs.get("headers", {})
        assert "X-ChatBridge-Signature" in headers
        assert "X-ChatBridge-Timestamp" in headers
        assert len(headers["X-ChatBridge-Signature"]) == 64


@pytest.mark.asyncio
async def test_relay_timeout_returns_504(client):
    """When the app backend times out, invoke returns 504."""
    import httpx as httpx_lib
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "slow_tool", "description": "Slow", "parameters": []}]
        app = AppRegistration(
            app_id="timeout_test",
            name="Timeout Test",
            description="Test timeout",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            server_api_url="https://api.slow-example.com/invoke",
            signing_secret="whsec_timeout",
            status="active",
            is_active=True,
        )
        s.add(app)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    with patch("app.apps.relay.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.post.side_effect = httpx_lib.TimeoutException("Connection timed out")
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock_client_instance

        resp = await client.post("/api/apps/timeout_test/invoke", json={
            "tool": "slow_tool",
            "params": {},
        })

    assert resp.status_code == 504


@pytest.mark.asyncio
async def test_relay_logs_invocation_with_duration(client):
    """Relay invocations are logged in tool_invocations with duration_ms and status."""
    from app.models import AppRegistration, ToolInvocation, Conversation
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "log_tool", "description": "Log", "parameters": []}]
        app = AppRegistration(
            app_id="relay_log_test",
            name="Relay Log Test",
            description="Test logging",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            server_api_url="https://api.example.com/invoke",
            signing_secret="whsec_log_test",
            status="active",
            is_active=True,
        )
        s.add(app)
        await s.commit()

    # Login and create a conversation for context
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    conv_resp = await client.post("/api/conversations", json={"title": "relay log test"})
    conv_id = conv_resp.json()["id"]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"logged": True}

    with patch("app.apps.relay.httpx.AsyncClient") as MockClient:
        mock_client_instance = AsyncMock()
        mock_client_instance.post.return_value = mock_response
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = mock_client_instance

        await client.post("/api/apps/relay_log_test/invoke", json={
            "tool": "log_tool",
            "params": {},
            "conversation_id": conv_id,
        })

    # Verify invocation was logged
    async with sf() as s:
        result = await s.execute(
            select(ToolInvocation).where(
                ToolInvocation.app_id == "relay_log_test",
                ToolInvocation.conversation_id == conv_id,
            )
        )
        inv = result.scalar_one_or_none()
        assert inv is not None
        assert inv.tool_name == "log_tool"
        assert inv.status == "success"
        assert inv.duration_ms is not None
        assert inv.duration_ms >= 0
