import pytest


@pytest.mark.asyncio
async def test_login_success(client):
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "student123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["username"] == "student1"
    assert data["user"]["role"] == "student"
    assert "access_token" in resp.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    resp = await client.post("/api/auth/login", json={"username": "student1", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    resp = await client.post("/api/auth/login", json={"username": "nobody", "password": "test"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    resp = await client.get("/api/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(student1_client):
    resp = await student1_client.get("/api/users/me")
    assert resp.status_code == 200
    assert resp.json()["user"]["username"] == "student1"


@pytest.mark.asyncio
async def test_logout(student1_client):
    resp = await student1_client.post("/api/auth/logout")
    assert resp.status_code == 200
    # After logout, /me should fail (clear cookies to simulate browser behavior)
    student1_client.cookies.clear()
    resp2 = await student1_client.get("/api/users/me")
    assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_role_guard_student_cannot_access_teacher_dashboard(student1_client):
    resp = await student1_client.get("/api/teacher/dashboard")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_role_guard_teacher_can_access_dashboard(teacher_client):
    resp = await teacher_client.get("/api/teacher/dashboard")
    assert resp.status_code == 200
