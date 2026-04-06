"""Admin review workflow tests."""
import pytest


@pytest.mark.asyncio
async def test_review_queue_lists_pending_apps(admin_client, client):
    """Review queue shows apps in pending_review status."""
    await client.post("/api/marketplace/submit", json={
        "app_id": "review_queue_test",
        "name": "Review Queue App",
        "description": "Test app for review queue",
        "iframe_url": "https://example.com/app",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await admin_client.get("/api/marketplace/review-queue")
    assert resp.status_code == 200
    app_ids = [a["app_id"] for a in resp.json()]
    assert "review_queue_test" in app_ids


@pytest.mark.asyncio
async def test_admin_approves_app(admin_client, client):
    """Admin can approve a pending app."""
    await client.post("/api/marketplace/submit", json={
        "app_id": "approve_test",
        "name": "Approve Test",
        "description": "Test approval",
        "iframe_url": "https://example.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await admin_client.post("/api/marketplace/approve_test/review", json={
        "action": "approve",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_admin_rejects_app(admin_client, client):
    """Admin can reject a pending app with a note."""
    await client.post("/api/marketplace/submit", json={
        "app_id": "reject_test",
        "name": "Reject Test",
        "description": "Test rejection",
        "iframe_url": "https://example.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await admin_client.post("/api/marketplace/reject_test/review", json={
        "action": "reject",
        "note": "Does not meet safety requirements",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_admin_requests_changes(admin_client, client):
    """Admin can request changes on a pending app."""
    await client.post("/api/marketplace/submit", json={
        "app_id": "changes_test",
        "name": "Changes Test",
        "description": "Test request changes",
        "iframe_url": "https://example.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await admin_client.post("/api/marketplace/changes_test/review", json={
        "action": "request_changes",
        "note": "Please add a privacy policy",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "changes_requested"


@pytest.mark.asyncio
async def test_student_cannot_review(student1_client):
    """Non-admin cannot review apps."""
    resp = await student1_client.post("/api/marketplace/chess/review", json={
        "action": "approve",
    })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_review_nonexistent_app(admin_client):
    resp = await admin_client.post("/api/marketplace/nonexistent/review", json={
        "action": "approve",
    })
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_review_invalid_action(admin_client, client):
    await client.post("/api/marketplace/submit", json={
        "app_id": "invalid_action_test",
        "name": "Invalid Action",
        "description": "Test",
        "iframe_url": "https://example.com",
        "tool_schemas": [{"name": "test", "description": "Test", "parameters": []}],
        "developer_name": "Dev",
        "developer_email": "dev@test.com",
    })

    resp = await admin_client.post("/api/marketplace/invalid_action_test/review", json={
        "action": "destroy",
    })
    assert resp.status_code == 400
