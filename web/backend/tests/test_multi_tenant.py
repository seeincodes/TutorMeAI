"""Multi-tenant isolation tests.

Tests for Phase 2 of the scaling plan:
- District model exists and can be created
- Users belong to a district
- DistrictAppApproval controls which apps a district can see
- list_apps filters by district whitelist
- Teacher dashboard scopes to district
- District admin can approve/reject apps for their district
- Cross-district data isolation
"""

import pytest
from sqlalchemy import select

from app.database import get_session_factory


# ── Model Tests ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_district_model_exists():
    """District model can be imported and has expected columns."""
    from app.models import District

    # Verify model has expected attributes
    assert hasattr(District, "id")
    assert hasattr(District, "name")
    assert hasattr(District, "state")
    assert hasattr(District, "settings")
    assert hasattr(District, "created_at")
    assert District.__tablename__ == "districts"


@pytest.mark.asyncio
async def test_district_can_be_created():
    """A district can be inserted into the database."""
    from app.models import District

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Springfield USD", state="IL")
        s.add(district)
        await s.commit()
        await s.refresh(district)

        assert district.id is not None
        assert district.name == "Springfield USD"
        assert district.state == "IL"

        # Cleanup
        await s.delete(district)
        await s.commit()


@pytest.mark.asyncio
async def test_user_has_district_id():
    """User model has a district_id foreign key."""
    from app.models import User

    assert hasattr(User, "district_id")


@pytest.mark.asyncio
async def test_user_can_be_assigned_to_district():
    """A user can be linked to a district."""
    from app.models import District, User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Test District", state="CA")
        s.add(district)
        await s.flush()

        user = User(
            username="district_test_user",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district.id,
        )
        s.add(user)
        await s.commit()
        await s.refresh(user)

        assert user.district_id == district.id

        # Cleanup
        await s.delete(user)
        await s.delete(district)
        await s.commit()


@pytest.mark.asyncio
async def test_district_app_approval_model_exists():
    """DistrictAppApproval model can be imported and has expected columns."""
    from app.models import DistrictAppApproval

    assert hasattr(DistrictAppApproval, "id")
    assert hasattr(DistrictAppApproval, "district_id")
    assert hasattr(DistrictAppApproval, "app_id")
    assert hasattr(DistrictAppApproval, "approved_by")
    assert hasattr(DistrictAppApproval, "status")
    assert hasattr(DistrictAppApproval, "created_at")
    assert DistrictAppApproval.__tablename__ == "district_app_approvals"


@pytest.mark.asyncio
async def test_district_app_approval_can_be_created():
    """A district app approval can be inserted."""
    from app.models import District, DistrictAppApproval

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Approval Test District", state="TX")
        s.add(district)
        await s.flush()

        approval = DistrictAppApproval(
            district_id=district.id,
            app_id="chess",
            status="approved",
        )
        s.add(approval)
        await s.commit()
        await s.refresh(approval)

        assert approval.district_id == district.id
        assert approval.app_id == "chess"
        assert approval.status == "approved"

        # Cleanup
        await s.delete(approval)
        await s.delete(district)
        await s.commit()


@pytest.mark.asyncio
async def test_district_admin_role_allowed():
    """User model accepts 'district_admin' as a valid role."""
    from app.models import User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        user = User(
            username="da_role_test",
            password_hash=hash_password("test123"),
            role="district_admin",
        )
        s.add(user)
        await s.commit()
        await s.refresh(user)

        assert user.role == "district_admin"

        # Cleanup
        await s.delete(user)
        await s.commit()


# ── API Tests ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_district_admin_can_list_districts(client):
    """District admin endpoint returns districts."""
    from app.models import District
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="API Test District", state="NY")
        s.add(district)
        await s.commit()

    # Login as admin
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/districts")
    assert resp.status_code == 200
    districts = resp.json()
    assert isinstance(districts, list)
    assert any(d["name"] == "API Test District" for d in districts)


@pytest.mark.asyncio
async def test_district_admin_can_approve_app(client):
    """District admin can approve an app for their district."""
    from app.models import District
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Approve App District", state="FL")
        s.add(district)
        await s.commit()
        district_id = str(district.id)

    # Login as admin
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.post(
        f"/api/districts/{district_id}/apps",
        json={"app_id": "chess"},
    )
    assert resp.status_code == 201
    assert resp.json()["app_id"] == "chess"
    assert resp.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_district_admin_can_revoke_app(client):
    """District admin can revoke an app approval."""
    from app.models import District, DistrictAppApproval

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Revoke App District", state="OH")
        s.add(district)
        await s.flush()
        approval = DistrictAppApproval(
            district_id=district.id, app_id="calculator", status="approved"
        )
        s.add(approval)
        await s.commit()
        district_id = str(district.id)

    # Login as admin
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.delete(f"/api/districts/{district_id}/apps/calculator")
    assert resp.status_code == 200
    assert resp.json()["status"] == "revoked"


@pytest.mark.asyncio
async def test_list_apps_filtered_by_district(client):
    """When a user belongs to a district, list_apps only returns district-approved apps."""
    from app.models import District, DistrictAppApproval, User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Filter Test District", state="WA")
        s.add(district)
        await s.flush()

        # Only approve chess and calculator for this district
        for app_id in ["chess", "calculator"]:
            s.add(DistrictAppApproval(
                district_id=district.id, app_id=app_id, status="approved"
            ))

        # Create a student in this district
        user = User(
            username="district_filter_student",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district.id,
            grade=5,
        )
        s.add(user)
        await s.commit()

    # Login as the district student
    resp = await client.post(
        "/api/auth/login",
        json={"username": "district_filter_student", "password": "test123"},
    )
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/apps")
    assert resp.status_code == 200
    app_ids = [a["app_id"] for a in resp.json()]
    assert "chess" in app_ids
    assert "calculator" in app_ids
    # Apps NOT approved for this district should be excluded
    assert "weather" not in app_ids
    assert "dictionary" not in app_ids


@pytest.mark.asyncio
async def test_user_without_district_sees_all_apps(client):
    """Users with no district_id see all active apps (backward compat)."""
    # Login as student1 (seeded without district_id)
    resp = await client.post(
        "/api/auth/login",
        json={"username": "student1", "password": "student123"},
    )
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/apps")
    assert resp.status_code == 200
    app_ids = [a["app_id"] for a in resp.json()]
    # Should see all active apps since no district filter applies
    assert len(app_ids) >= 6


@pytest.mark.asyncio
async def test_teacher_dashboard_scoped_to_district(client):
    """Teacher dashboard only shows students from the same district."""
    from app.models import District, User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        # Create two districts
        district_a = District(name="District A", state="MA")
        district_b = District(name="District B", state="CT")
        s.add_all([district_a, district_b])
        await s.flush()

        # Teacher in district A
        teacher = User(
            username="scoped_teacher",
            password_hash=hash_password("test123"),
            role="teacher",
            district_id=district_a.id,
        )
        # Student in district A
        student_a = User(
            username="student_district_a",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district_a.id,
            grade=3,
        )
        # Student in district B
        student_b = User(
            username="student_district_b",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district_b.id,
            grade=4,
        )
        s.add_all([teacher, student_a, student_b])
        await s.commit()

    # Login as the scoped teacher
    resp = await client.post(
        "/api/auth/login",
        json={"username": "scoped_teacher", "password": "test123"},
    )
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    student_usernames = [s["username"] for s in resp.json()["students"]]
    assert "student_district_a" in student_usernames
    assert "student_district_b" not in student_usernames


@pytest.mark.asyncio
async def test_cross_district_data_isolation(client):
    """A user in district A cannot see conversations from district B."""
    from app.models import District, User
    from app.auth.passwords import hash_password

    sf = get_session_factory()
    async with sf() as s:
        district_a = District(name="Isolation A", state="NV")
        district_b = District(name="Isolation B", state="AZ")
        s.add_all([district_a, district_b])
        await s.flush()

        user_a = User(
            username="iso_student_a",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district_a.id,
            grade=5,
        )
        user_b = User(
            username="iso_student_b",
            password_hash=hash_password("test123"),
            role="student",
            district_id=district_b.id,
            grade=5,
        )
        s.add_all([user_a, user_b])
        await s.commit()

    # User A creates a conversation
    resp = await client.post("/api/auth/login", json={"username": "iso_student_a", "password": "test123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)
    resp = await client.post("/api/conversations", json={"title": "district A convo"})
    assert resp.status_code == 201
    conv_id = resp.json()["id"]

    # User B tries to see it
    resp = await client.post("/api/auth/login", json={"username": "iso_student_b", "password": "test123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)
    resp = await client.get(f"/api/conversations/{conv_id}")
    assert resp.status_code == 404
