import pytest


@pytest.mark.asyncio
async def test_courses_requires_auth(client):
    resp = await client.get("/api/classroom/courses")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_courses_no_oauth_token(teacher_client):
    resp = await teacher_client.get("/api/classroom/courses")
    assert resp.status_code == 400
    assert "not connected" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submissions_student_forbidden(student1_client):
    resp = await student1_client.get("/api/classroom/courses/123/assignments/456/submissions")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_assignment_student_forbidden(student1_client):
    resp = await student1_client.post(
        "/api/classroom/courses/123/assignments",
        json={"title": "Test", "description": "Test desc"},
    )
    assert resp.status_code == 403
