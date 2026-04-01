import pytest


@pytest.mark.asyncio
async def test_teacher_can_view_flags(teacher_client):
    resp = await teacher_client.get("/api/teacher/flags")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_student_can_create_flag(student1_client):
    resp = await student1_client.post("/api/teacher/flags", json={
        "app_id": "dictionary",
        "word": "badword",
        "reason": "blocked_word",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "flagged"


@pytest.mark.asyncio
async def test_student_cannot_view_flags(student1_client):
    resp = await student1_client.get("/api/teacher/flags")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_apps_list_returns_active_apps(student1_client):
    resp = await student1_client.get("/api/apps")
    assert resp.status_code == 200
    apps = resp.json()
    assert len(apps) >= 7
    app_ids = [a["app_id"] for a in apps]
    assert "chess" in app_ids
    assert "calculator" in app_ids
    assert "dictionary" in app_ids
