import pytest
from httpx import ASGITransport, AsyncClient

from app.middleware.security import SecurityHeadersMiddleware, derive_user_tier


# ---------------------------------------------------------------------------
# Minimal ASGI app for header tests (no DB needed)
# ---------------------------------------------------------------------------

async def _plain_app(scope, receive, send):
    """Tiny ASGI app that returns 200 with an empty body."""
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [(b"content-type", b"text/plain")],
    })
    await send({"type": "http.response.body", "body": b"ok"})


_wrapped_app = SecurityHeadersMiddleware(_plain_app)


@pytest.fixture
async def header_client():
    async with AsyncClient(
        transport=ASGITransport(app=_wrapped_app), base_url="http://test"
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Header tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_csp_header_present(header_client):
    resp = await header_client.get("/any-path")
    assert resp.status_code == 200
    csp = resp.headers.get("content-security-policy")
    assert csp is not None
    assert "script-src 'self' 'unsafe-inline'" in csp
    assert "frame-ancestors 'self'" in csp


@pytest.mark.asyncio
async def test_x_content_type_options(header_client):
    resp = await header_client.get("/any-path")
    assert resp.headers.get("x-content-type-options") == "nosniff"


@pytest.mark.asyncio
async def test_x_frame_options(header_client):
    resp = await header_client.get("/any-path")
    assert resp.headers.get("x-frame-options") == "SAMEORIGIN"


@pytest.mark.asyncio
async def test_referrer_policy(header_client):
    resp = await header_client.get("/any-path")
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


# ---------------------------------------------------------------------------
# derive_user_tier tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tier_grade_0():
    assert derive_user_tier(user_grade=0) == 1


@pytest.mark.asyncio
async def test_tier_grade_1():
    assert derive_user_tier(user_grade=1) == 1


@pytest.mark.asyncio
async def test_tier_grade_2():
    assert derive_user_tier(user_grade=2) == 2


@pytest.mark.asyncio
async def test_tier_grade_4():
    assert derive_user_tier(user_grade=4) == 2


@pytest.mark.asyncio
async def test_tier_grade_5():
    assert derive_user_tier(user_grade=5) == 3


@pytest.mark.asyncio
async def test_tier_grade_6():
    assert derive_user_tier(user_grade=6) == 3


@pytest.mark.asyncio
async def test_tier_grade_7():
    assert derive_user_tier(user_grade=7) == 4


@pytest.mark.asyncio
async def test_tier_grade_12():
    assert derive_user_tier(user_grade=12) == 4


@pytest.mark.asyncio
async def test_tier_none_grade():
    assert derive_user_tier(user_grade=None) == 2


@pytest.mark.asyncio
async def test_tier_default():
    assert derive_user_tier() == 2


@pytest.mark.asyncio
async def test_tier_capability_override():
    assert derive_user_tier(user_grade=1, capability_override=4) == 4


@pytest.mark.asyncio
async def test_tier_capability_override_no_grade():
    assert derive_user_tier(user_grade=None, capability_override=3) == 3
