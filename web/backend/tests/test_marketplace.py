"""App Marketplace tests (Phase 3 scaling).

Tests for:
- Self-service app submission (public endpoint, creates pending_review)
- Marketplace metadata fields on AppRegistration
- Tiered trust levels
- Developer analytics endpoint
- Submission validation and safety checks
"""

import pytest
from sqlalchemy import select

from app.database import get_session_factory


# ── Model Tests ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_app_registration_has_marketplace_fields():
    """AppRegistration has developer metadata fields for marketplace."""
    from app.models import AppRegistration

    assert hasattr(AppRegistration, "developer_name")
    assert hasattr(AppRegistration, "developer_email")
    assert hasattr(AppRegistration, "website_url")
    assert hasattr(AppRegistration, "privacy_policy_url")
    assert hasattr(AppRegistration, "logo_url")
    assert hasattr(AppRegistration, "trust_tier")


@pytest.mark.asyncio
async def test_app_registration_trust_tier_default():
    """New AppRegistration defaults to 'new' trust tier."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="marketplace_test_app",
            name="Test Marketplace App",
            description="A test app",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            developer_name="Test Developer",
            developer_email="dev@example.com",
        )
        s.add(app)
        await s.commit()
        await s.refresh(app)

        assert app.trust_tier == "new"

        # Cleanup
        await s.delete(app)
        await s.commit()


@pytest.mark.asyncio
async def test_app_registration_marketplace_fields_persist():
    """Marketplace metadata fields can be saved and retrieved."""
    from app.models import AppRegistration
    from app.apps.schema_hash import compute_schema_hash

    sf = get_session_factory()
    async with sf() as s:
        schemas = [{"name": "test", "description": "Test", "parameters": []}]
        app = AppRegistration(
            app_id="metadata_test_app",
            name="Metadata Test",
            description="Testing metadata",
            auth_type="none",
            iframe_url="https://example.com/app",
            tool_schemas=schemas,
            schema_hash=compute_schema_hash(schemas),
            developer_name="Jane Dev",
            developer_email="jane@example.com",
            website_url="https://jane.dev",
            privacy_policy_url="https://jane.dev/privacy",
            logo_url="https://jane.dev/logo.png",
        )
        s.add(app)
        await s.commit()
        await s.refresh(app)

        assert app.developer_name == "Jane Dev"
        assert app.developer_email == "jane@example.com"
        assert app.website_url == "https://jane.dev"
        assert app.privacy_policy_url == "https://jane.dev/privacy"
        assert app.logo_url == "https://jane.dev/logo.png"

        # Cleanup
        await s.delete(app)
        await s.commit()


# ── API Tests: Self-Service Submission ───────────────────────────────────


@pytest.mark.asyncio
async def test_submit_app_creates_pending_review(client):
    """Public submission endpoint creates an app in pending_review status."""
    resp = await client.post("/api/marketplace/submit", json={
        "app_id": "submitted_app_1",
        "name": "My Cool App",
        "description": "An educational game",
        "iframe_url": "https://coolapp.com/embed",
        "tool_schemas": [{"name": "start_game", "description": "Start the game", "parameters": []}],
        "developer_name": "Cool Dev",
        "developer_email": "dev@coolapp.com",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["app_id"] == "submitted_app_1"
    assert data["status"] == "pending_review"
    assert data["trust_tier"] == "new"


@pytest.mark.asyncio
async def test_submit_app_duplicate_rejected(client):
    """Submitting an app with an existing app_id is rejected."""
    # Submit first
    await client.post("/api/marketplace/submit", json={
        "app_id": "duplicate_test",
        "name": "First App",
        "description": "First",
        "iframe_url": "https://first.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@first.com",
    })

    # Submit duplicate
    resp = await client.post("/api/marketplace/submit", json={
        "app_id": "duplicate_test",
        "name": "Duplicate App",
        "description": "Duplicate",
        "iframe_url": "https://duplicate.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@dup.com",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_submit_app_requires_fields(client):
    """Submission without required fields fails validation."""
    resp = await client.post("/api/marketplace/submit", json={
        "app_id": "incomplete",
        # Missing name, description, iframe_url, tool_schemas, developer fields
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_submitted_app_not_visible_to_students(client):
    """Apps in pending_review should not appear in list_apps for students."""
    # Submit an app
    await client.post("/api/marketplace/submit", json={
        "app_id": "invisible_pending",
        "name": "Pending App",
        "description": "Should not be visible",
        "iframe_url": "https://pending.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@pending.com",
    })

    # Login as student
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/apps")
    app_ids = [a["app_id"] for a in resp.json()]
    assert "invisible_pending" not in app_ids


# ── API Tests: Trust Tier Management ────────────────────────────────────


@pytest.mark.asyncio
async def test_admin_can_set_trust_tier(client):
    """Admin can update an app's trust tier."""
    # Login as admin
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    # Submit an app first
    await client.post("/api/marketplace/submit", json={
        "app_id": "tier_test_app",
        "name": "Tier Test",
        "description": "Test trust tiers",
        "iframe_url": "https://tier.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@tier.com",
    })

    # Promote to verified
    resp = await client.patch("/api/marketplace/tier_test_app/trust", json={"trust_tier": "verified"})
    assert resp.status_code == 200
    assert resp.json()["trust_tier"] == "verified"


@pytest.mark.asyncio
async def test_student_cannot_set_trust_tier(client):
    """Non-admin users cannot change trust tiers."""
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.patch("/api/marketplace/chess/trust", json={"trust_tier": "verified"})
    assert resp.status_code == 403


# ── API Tests: Developer Analytics ──────────────────────────────────────


@pytest.mark.asyncio
async def test_developer_analytics_returns_usage(client):
    """Analytics endpoint returns usage stats for an app."""
    # Login as admin
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/marketplace/chess/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert "usage_count" in data
    assert "unique_users" in data
    assert "avg_duration_ms" in data
    assert "error_rate" in data


@pytest.mark.asyncio
async def test_developer_analytics_unknown_app(client):
    """Analytics for a nonexistent app returns 404."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/marketplace/nonexistent_app/analytics")
    assert resp.status_code == 404


# ── API Tests: Marketplace Listing ──────────────────────────────────────


@pytest.mark.asyncio
async def test_marketplace_catalog_lists_all_apps(client):
    """Marketplace catalog returns all apps regardless of status (for admin/browse)."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/marketplace/catalog")
    assert resp.status_code == 200
    apps = resp.json()
    assert isinstance(apps, list)
    # Should include active apps at minimum
    app_ids = [a["app_id"] for a in apps]
    assert "chess" in app_ids


@pytest.mark.asyncio
async def test_marketplace_catalog_includes_trust_tier(client):
    """Catalog entries include trust_tier field."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/marketplace/catalog")
    assert resp.status_code == 200
    apps = resp.json()
    assert len(apps) > 0
    assert "trust_tier" in apps[0]
