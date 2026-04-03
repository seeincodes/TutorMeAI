"""Automated content screening tests (Phase 5 scaling).

Tests for:
- AppContentScreen model (periodic screening results)
- Tool result moderation filter
- Auto-suspend logic (flag threshold triggers suspension)
- Admin screening review queue
"""

import pytest
from sqlalchemy import select

from app.database import get_session_factory


# ── Model Tests ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_app_content_screen_model_exists():
    """AppContentScreen model can be imported and has expected columns."""
    from app.models import AppContentScreen

    assert hasattr(AppContentScreen, "id")
    assert hasattr(AppContentScreen, "app_id")
    assert hasattr(AppContentScreen, "screen_type")
    assert hasattr(AppContentScreen, "result")
    assert hasattr(AppContentScreen, "flagged")
    assert hasattr(AppContentScreen, "details")
    assert hasattr(AppContentScreen, "created_at")
    assert AppContentScreen.__tablename__ == "app_content_screens"


@pytest.mark.asyncio
async def test_app_content_screen_can_be_created():
    """A content screen record can be inserted."""
    from app.models import AppContentScreen

    sf = get_session_factory()
    async with sf() as s:
        screen = AppContentScreen(
            app_id="chess",
            screen_type="moderation_api",
            result="pass",
            flagged=False,
            details={"categories": {}, "flagged": False},
        )
        s.add(screen)
        await s.commit()
        await s.refresh(screen)

        assert screen.id is not None
        assert screen.app_id == "chess"
        assert screen.flagged is False

        await s.delete(screen)
        await s.commit()


@pytest.mark.asyncio
async def test_app_has_flag_count_and_suspension_threshold():
    """AppRegistration has flag_count and auto_suspend_threshold fields."""
    from app.models import AppRegistration

    assert hasattr(AppRegistration, "flag_count")
    assert hasattr(AppRegistration, "auto_suspend_threshold")


# ── Moderation Filter Tests ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_moderate_tool_result_clean():
    """Clean text passes moderation."""
    from app.apps.moderation import moderate_tool_result

    result = moderate_tool_result("The answer is 42.")
    assert result["flagged"] is False
    assert result["safe_text"] == "The answer is 42."


@pytest.mark.asyncio
async def test_moderate_tool_result_flags_harmful():
    """Harmful content is flagged and replaced."""
    from app.apps.moderation import moderate_tool_result

    result = moderate_tool_result("I hate you, you stupid kid")
    assert result["flagged"] is True
    assert result["safe_text"] != "I hate you, you stupid kid"


@pytest.mark.asyncio
async def test_moderate_tool_result_flags_violence():
    """Violent content is flagged."""
    from app.apps.moderation import moderate_tool_result

    result = moderate_tool_result("Let's kill all the enemies and watch them bleed")
    assert result["flagged"] is True


@pytest.mark.asyncio
async def test_moderate_tool_result_allows_educational():
    """Educational content about sensitive topics is allowed."""
    from app.apps.moderation import moderate_tool_result

    result = moderate_tool_result("The Civil War was fought between 1861 and 1865.")
    assert result["flagged"] is False


# ── Auto-Suspend Tests ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_auto_suspend_increments_flag_count(client):
    """Flagging content increments the app's flag_count."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="flag_count_test",
            name="Flag Count Test",
            description="Test flagging",
            auth_type="none",
            iframe_url="https://example.com",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            status="active",
            is_active=True,
            flag_count=0,
            auto_suspend_threshold=5,
        )
        s.add(app)
        await s.commit()

    # Login as student and flag content
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.post("/api/teacher/flags", json={
        "app_id": "flag_count_test",
        "word": "bad content",
        "reason": "inappropriate",
    })
    assert resp.status_code == 200

    # Verify flag_count incremented
    async with sf() as s:
        result = await s.execute(
            select(AppRegistration).where(AppRegistration.app_id == "flag_count_test")
        )
        app = result.scalar_one()
        assert app.flag_count == 1
        assert app.is_active is True  # Not yet at threshold


@pytest.mark.asyncio
async def test_auto_suspend_triggers_at_threshold(client):
    """App is auto-suspended when flag_count reaches threshold."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="threshold_test",
            name="Threshold Test",
            description="Test auto-suspend",
            auth_type="none",
            iframe_url="https://example.com",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            status="active",
            is_active=True,
            flag_count=4,  # One away from threshold
            auto_suspend_threshold=5,
        )
        s.add(app)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.post("/api/teacher/flags", json={
        "app_id": "threshold_test",
        "word": "final straw",
        "reason": "inappropriate",
    })
    assert resp.status_code == 200

    # Verify app was suspended
    async with sf() as s:
        result = await s.execute(
            select(AppRegistration).where(AppRegistration.app_id == "threshold_test")
        )
        app = result.scalar_one()
        assert app.flag_count == 5
        assert app.is_active is False


# ── Admin Review Queue Tests ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_admin_screening_queue(client):
    """Admin can view the content screening queue."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/marketplace/screening-queue")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_admin_can_clear_flags(client):
    """Admin can reset an app's flag count."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="clear_flags_test",
            name="Clear Flags Test",
            description="Test clearing flags",
            auth_type="none",
            iframe_url="https://example.com",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            status="active",
            is_active=False,
            flag_count=10,
            auto_suspend_threshold=5,
        )
        s.add(app)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.post("/api/marketplace/clear_flags_test/clear-flags")
    assert resp.status_code == 200
    assert resp.json()["flag_count"] == 0
    assert resp.json()["is_active"] is True
