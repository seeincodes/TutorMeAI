import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def student1_client():
    """Client logged in as student1."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/auth/login", json={"username": "student1", "password": "student123"})
        assert resp.status_code == 200
        yield ac


@pytest.fixture
async def student2_client():
    """Separate client logged in as student2."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/auth/login", json={"username": "student2", "password": "student234"})
        assert resp.status_code == 200
        yield ac


@pytest.fixture
async def teacher_client():
    """Client logged in as teacher1."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/auth/login", json={"username": "teacher1", "password": "teacher123"})
        assert resp.status_code == 200
        yield ac
