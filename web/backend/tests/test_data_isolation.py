import pytest


@pytest.mark.asyncio
async def test_student_cannot_see_other_student_conversations(student1_client, student2_client):
    """student1 creates a conversation; student2 should not see it."""
    # student1 creates a conversation
    resp1 = await student1_client.post("/api/conversations", json={"title": "student1 private chat"})
    assert resp1.status_code == 201
    conv_id = resp1.json()["id"]

    # student2 lists conversations — should not include student1's
    resp2 = await student2_client.get("/api/conversations")
    assert resp2.status_code == 200
    conv_ids = [c["id"] for c in resp2.json()]
    assert conv_id not in conv_ids


@pytest.mark.asyncio
async def test_student_cannot_access_other_student_conversation(student1_client, student2_client):
    """student2 cannot access student1's conversation by ID."""
    # student1 creates a conversation
    resp1 = await student1_client.post("/api/conversations", json={"title": "private"})
    conv_id = resp1.json()["id"]

    # student2 tries to access it directly
    resp2 = await student2_client.get(f"/api/conversations/{conv_id}")
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_student_cannot_read_other_student_messages(student1_client, student2_client):
    """student2 cannot read messages from student1's conversation."""
    resp1 = await student1_client.post("/api/conversations", json={"title": "msg test"})
    conv_id = resp1.json()["id"]

    resp2 = await student2_client.get(f"/api/conversations/{conv_id}/messages")
    assert resp2.status_code == 404
