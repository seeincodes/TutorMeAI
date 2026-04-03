"""Backend tests for unified dashboard API changes.

Tests for:
- Teacher dashboard apps response includes trust_tier and developer_name
- district_admin role can access teacher dashboard
"""

import pytest


@pytest.mark.asyncio
async def test_dashboard_apps_include_trust_tier(client):
    """Teacher dashboard apps response includes trust_tier field."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    apps = resp.json()["apps"]
    assert len(apps) > 0
    assert "trust_tier" in apps[0]


@pytest.mark.asyncio
async def test_dashboard_apps_include_developer_name(client):
    """Teacher dashboard apps response includes developer_name field."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    apps = resp.json()["apps"]
    assert len(apps) > 0
    assert "developer_name" in apps[0]


@pytest.mark.asyncio
async def test_district_admin_can_access_dashboard(client):
    """district_admin role can access the teacher dashboard."""
    from app.models import User
    from app.auth.passwords import hash_password
    from app.database import get_session_factory

    sf = get_session_factory()
    async with sf() as s:
        user = User(
            username="da_dashboard_test",
            password_hash=hash_password("test123"),
            role="district_admin",
        )
        s.add(user)
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "da_dashboard_test", "password": "test123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    assert "students" in resp.json()


@pytest.mark.asyncio
async def test_admin_dashboard_includes_teachers(client):
    """Admin dashboard response includes a teachers list."""
    resp = await client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "teachers" in data
    teachers = data["teachers"]
    assert isinstance(teachers, list)
    # teacher1 is seeded
    assert any(t["username"] == "teacher1" for t in teachers)


@pytest.mark.asyncio
async def test_teacher_dashboard_does_not_include_teachers(client):
    """Teacher role dashboard does NOT include the teachers list."""
    resp = await client.post("/api/auth/login", json={"username": "teacher1", "password": "teacher123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "teachers" not in data


@pytest.mark.asyncio
async def test_district_admin_sees_teachers_in_their_district(client):
    """District admin sees only teachers from their own district."""
    from app.models import District, User
    from app.auth.passwords import hash_password
    from app.database import get_session_factory

    sf = get_session_factory()
    async with sf() as s:
        district = District(name="Teacher Visibility Test", state="PA")
        s.add(district)
        await s.flush()

        da = User(
            username="da_teacher_vis",
            password_hash=hash_password("test123"),
            role="district_admin",
            district_id=district.id,
        )
        teacher_in = User(
            username="teacher_in_district",
            password_hash=hash_password("test123"),
            role="teacher",
            district_id=district.id,
        )
        teacher_out = User(
            username="teacher_outside_district",
            password_hash=hash_password("test123"),
            role="teacher",
        )
        s.add_all([da, teacher_in, teacher_out])
        await s.commit()

    resp = await client.post("/api/auth/login", json={"username": "da_teacher_vis", "password": "test123"})
    for k, v in resp.cookies.items():
        client.cookies.set(k, v)

    resp = await client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
    teachers = resp.json()["teachers"]
    usernames = [t["username"] for t in teachers]
    assert "teacher_in_district" in usernames
    assert "teacher_outside_district" not in usernames
