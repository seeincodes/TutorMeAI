"""Pagination tests."""
import pytest


@pytest.mark.asyncio
async def test_marketplace_browse_pagination(teacher_client):
    """Browse endpoint respects limit and offset."""
    # Default returns apps
    resp = await teacher_client.get("/api/marketplace/browse")
    assert resp.status_code == 200
    all_apps = resp.json()

    # Limit to 2
    resp = await teacher_client.get("/api/marketplace/browse?limit=2")
    assert resp.status_code == 200
    assert len(resp.json()) <= 2

    # Offset past all
    resp = await teacher_client.get(f"/api/marketplace/browse?offset={len(all_apps) + 10}")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_classrooms_pagination(teacher_client):
    """Classrooms endpoint respects limit."""
    # Create a few classrooms
    for i in range(3):
        await teacher_client.post("/api/classrooms", json={"name": f"Paginate {i}"})

    resp = await teacher_client.get("/api/classrooms?limit=2")
    assert resp.status_code == 200
    assert len(resp.json()) <= 2


@pytest.mark.asyncio
async def test_pagination_invalid_limit(teacher_client):
    """Limit must be >= 1."""
    resp = await teacher_client.get("/api/marketplace/browse?limit=0")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_pagination_max_limit(teacher_client):
    """Limit cannot exceed 200."""
    resp = await teacher_client.get("/api/marketplace/browse?limit=500")
    assert resp.status_code == 422
