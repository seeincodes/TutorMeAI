"""Marketplace browse & detail endpoint tests."""
import pytest
from sqlalchemy import select

from app.database import get_session_factory


@pytest.mark.asyncio
async def test_teacher_browse_sees_all_active_apps(teacher_client):
    """Teachers see all active apps in browse."""
    resp = await teacher_client.get("/api/marketplace/browse")
    assert resp.status_code == 200
    app_ids = [a["app_id"] for a in resp.json()]
    assert "chess" in app_ids
    assert "calculator" in app_ids


@pytest.mark.asyncio
async def test_student_browse_sees_only_whitelisted_apps(teacher_client, student1_client):
    """Students only see apps whitelisted for their classroom."""
    from app.models import User
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        student = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        student_id = str(student.id)

    # Teacher creates classroom, adds student, whitelists chess only
    cr = await teacher_client.post("/api/classrooms", json={"name": "Browse Test"})
    classroom_id = cr.json()["id"]
    await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student_id})
    await teacher_client.post(f"/api/classrooms/{classroom_id}/apps", json={"app_id": "chess"})

    # Student should see only chess
    resp = await student1_client.get("/api/marketplace/browse")
    assert resp.status_code == 200
    app_ids = [a["app_id"] for a in resp.json()]
    assert "chess" in app_ids
    assert "calculator" not in app_ids


@pytest.mark.asyncio
async def test_student_browse_no_classroom_sees_nothing(student2_client):
    """Student not in any classroom sees no apps."""
    resp = await student2_client.get("/api/marketplace/browse")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_app_detail_returns_full_info(teacher_client):
    """Detail endpoint returns full app metadata."""
    resp = await teacher_client.get("/api/marketplace/chess/detail")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app_id"] == "chess"
    assert data["name"] == "Chess"
    assert "description" in data
    assert "tool_schemas" in data
    assert "trust_tier" in data
    assert "age_rating" in data


@pytest.mark.asyncio
async def test_app_detail_nonexistent_returns_404(teacher_client):
    resp = await teacher_client.get("/api/marketplace/nonexistent/detail")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_unauthenticated_browse_returns_401(client):
    resp = await client.get("/api/marketplace/browse")
    assert resp.status_code == 401
