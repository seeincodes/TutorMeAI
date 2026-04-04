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
async def test_submit_app_runs_ai_review(client):
    """Public submission endpoint runs AI review and returns verdict."""
    resp = await client.post("/api/marketplace/submit", json={
        "app_id": "submitted_app_1",
        "name": "Math Practice for Kids",
        "description": "A fun multiplication practice game for elementary students with colorful animations and encouraging feedback. Helps kids learn times tables.",
        "iframe_url": "https://mathpractice.com/embed",
        "tool_schemas": [{"name": "start_quiz", "description": "Start a multiplication quiz", "parameters": []}],
        "developer_name": "EduTech Labs",
        "developer_email": "dev@edutechlabs.com",
        "website_url": "https://edutechlabs.com",
        "privacy_policy_url": "https://edutechlabs.com/privacy",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["app_id"] == "submitted_app_1"
    # AI review should be included in response
    assert "ai_review" in data
    assert data["ai_review"] is not None
    assert data["ai_review"]["decision"] in ("approve", "reject", "human_review")
    assert "reasoning" in data["ai_review"]
    assert "risk_level" in data["ai_review"]
    # Status should reflect AI decision
    assert data["status"] in ("active", "rejected", "pending_review")


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


# ── AI Review Pipeline Tests ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_ai_review_approves_safe_educational_app():
    """AI review does not reject a clearly safe educational app."""
    from app.marketplace.ai_review import review_app_submission

    result = await review_app_submission(
        app_id="safe-app",
        name="Spelling Bee Practice",
        description="A fun spelling practice game for elementary students. Kids see a word, hear it pronounced, and type the spelling. Tracks progress over time.",
        tool_schemas=[
            {"name": "start_game", "description": "Start a spelling quiz", "parameters": [{"name": "grade", "type": "string", "description": "Grade level 1-5"}]},
            {"name": "get_score", "description": "Get current score", "parameters": []},
        ],
        auth_type="none",
        oauth_config=None,
        developer_name="SpellWell Inc",
        developer_email="dev@spellwell.com",
        website_url="https://spellwell.com",
        privacy_policy_url="https://spellwell.com/privacy",
        age_rating="all",
    )
    # Safe app should never be rejected — approve or human_review are both acceptable
    assert result.decision in ("approve", "human_review")
    assert result.decision != "reject"
    assert result.content_safe is True
    assert result.tools_safe is True
    assert result.risk_level in ("low", "medium")


@pytest.mark.asyncio
async def test_ai_review_rejects_dangerous_app():
    """AI review does not approve a dangerous app."""
    from app.marketplace.ai_review import review_app_submission

    result = await review_app_submission(
        app_id="dangerous-app",
        name="System Admin Tool",
        description="Execute commands on the server, read files, and manage system processes.",
        tool_schemas=[
            {"name": "exec", "description": "Execute shell command", "parameters": [{"name": "cmd", "type": "string", "description": "Command to run"}]},
            {"name": "read_file", "description": "Read file contents", "parameters": [{"name": "path", "type": "string", "description": "File path"}]},
        ],
        auth_type="none",
        oauth_config=None,
        developer_name="Anonymous",
        developer_email="anon@temp.com",
        website_url=None,
        privacy_policy_url=None,
        age_rating="all",
    )
    # Dangerous app should never be approved — reject or human_review are both acceptable
    assert result.decision in ("reject", "human_review")
    assert result.decision != "approve"
    assert result.risk_level in ("medium", "high", "critical")
    assert len(result.risk_flags) > 0


@pytest.mark.asyncio
async def test_ai_review_flags_inappropriate_content():
    """AI review rejects or flags apps with inappropriate content."""
    from app.marketplace.ai_review import review_app_submission

    result = await review_app_submission(
        app_id="inappropriate-app",
        name="Adult Content Browser",
        description="Browse and stream mature content. Not suitable for children.",
        tool_schemas=[{"name": "browse", "description": "Browse content", "parameters": []}],
        auth_type="none",
        oauth_config=None,
        developer_name="Dev",
        developer_email="dev@test.com",
        website_url=None,
        privacy_policy_url=None,
        age_rating="mature",
    )
    assert result.decision in ("reject", "human_review")
    assert result.content_safe is False


@pytest.mark.asyncio
async def test_ai_review_returns_valid_structure():
    """AI review always returns all required fields."""
    from app.marketplace.ai_review import review_app_submission

    result = await review_app_submission(
        app_id="structure-test",
        name="Simple App",
        description="A simple app",
        tool_schemas=[],
        auth_type="none",
        oauth_config=None,
        developer_name="Dev",
        developer_email="d@d.com",
        website_url=None,
        privacy_policy_url=None,
        age_rating="all",
    )
    # All fields must be present
    assert result.decision in ("approve", "reject", "human_review")
    assert isinstance(result.approved, bool)
    assert isinstance(result.age_rating, str)
    assert isinstance(result.suggested_min_grade, int)
    assert isinstance(result.suggested_max_grade, int)
    assert result.risk_level in ("low", "medium", "high", "critical")
    assert isinstance(result.risk_flags, list)
    assert isinstance(result.reasoning, str)
    assert len(result.reasoning) > 0
    assert isinstance(result.content_safe, bool)
    assert isinstance(result.tools_safe, bool)
    assert isinstance(result.auth_appropriate, bool)
    assert result.educational_value in ("high", "medium", "low", "none")


# ── Admin Override Tests ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_admin_can_approve_pending_app(client):
    """Admin can manually approve a pending app."""
    # Submit an app
    await client.post("/api/marketplace/submit", json={
        "app_id": "admin_approve_test",
        "name": "Pending App",
        "description": "An app for testing admin approval",
        "iframe_url": "https://test.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    # Login as admin
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    # Approve it
    resp = await client.post("/api/marketplace/admin_approve_test/approve")
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_admin_can_reject_app(client):
    """Admin can manually reject an app."""
    await client.post("/api/marketplace/submit", json={
        "app_id": "admin_reject_test",
        "name": "To Be Rejected",
        "description": "This app will be rejected by admin",
        "iframe_url": "https://test.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.post("/api/marketplace/admin_reject_test/reject")
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_admin_can_view_ai_review(client):
    """Admin can view the AI review for a submitted app."""
    # Submit
    await client.post("/api/marketplace/submit", json={
        "app_id": "review_view_test",
        "name": "Review View Test",
        "description": "Testing that admin can see AI review details",
        "iframe_url": "https://test.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/marketplace/review_view_test/review")
    assert resp.status_code == 200
    data = resp.json()
    assert "details" in data
    assert "decision" in data["details"]
    assert "reasoning" in data["details"]


@pytest.mark.asyncio
async def test_student_cannot_approve_app(client):
    """Students cannot approve apps."""
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.post("/api/marketplace/chess/approve")
    assert resp.status_code == 403
