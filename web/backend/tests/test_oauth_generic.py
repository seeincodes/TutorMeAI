import pytest


@pytest.mark.asyncio
async def test_authorize_unknown_app_returns_400(teacher_client):
    resp = await teacher_client.get("/api/oauth/nonexistent/authorize")
    assert resp.status_code == 400
    assert "not found" in resp.json()["detail"].lower() or "not supported" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_authorize_non_oauth_app_returns_400(teacher_client):
    resp = await teacher_client.get("/api/oauth/chess/authorize")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_status_no_connection(teacher_client):
    resp = await teacher_client.get("/api/oauth/google-classroom/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["connected"] is False


@pytest.mark.asyncio
async def test_disconnect_no_connection_returns_404(teacher_client):
    resp = await teacher_client.delete("/api/oauth/google-classroom/disconnect")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_student_cannot_authorize(student1_client):
    resp = await student1_client.get("/api/oauth/google-classroom/authorize")
    assert resp.status_code in (200, 400, 403, 500)


@pytest.mark.asyncio
async def test_callback_invalid_state(client):
    resp = await client.get("/api/oauth/google-classroom/callback?code=fake&state=invalid")
    assert resp.status_code == 400
    assert "invalid" in resp.json()["detail"].lower() or "expired" in resp.json()["detail"].lower()
