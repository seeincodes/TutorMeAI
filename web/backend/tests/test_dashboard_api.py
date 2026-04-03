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
