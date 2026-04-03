import os

os.environ["DATABASE_URL"] = "postgresql+asyncpg://xian@localhost:5432/chatbridge_test"
os.environ["TESTING"] = "1"

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.apps.schema_hash import compute_schema_hash  # noqa: E402
from app.database import Base, get_engine, get_session_factory, reset_engine  # noqa: E402

_initialized = False


@pytest.fixture(autouse=True)
async def _setup():
    global _initialized
    reset_engine()

    if not _initialized:
        from sqlalchemy import select, text
        from app.auth.passwords import hash_password
        from app.models import User, AppRegistration

        engine = get_engine()

        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        sf = get_session_factory()
        # Check if already seeded
        async with sf() as check:
            result = await check.execute(select(User).limit(1))
            already_seeded = result.scalar_one_or_none() is not None

        if not already_seeded:
            async with sf() as s:
                for u, p, r, d in [("admin","admin123","admin","Admin"),("teacher1","teacher123","teacher","Teacher One"),("student1","student123","student","Student One"),("student2","student234","student","Student Two")]:
                    s.add(User(username=u, password_hash=hash_password(p), display_name=d, role=r, grade=5 if r=="student" else None, allowed_levels=["K-2","3-5"] if r=="student" else None))
                for aid, n in [("chess","Chess"),("calculator","Math Calculator"),("dictionary","Dictionary"),("weather","Weather"),("flashcards","Flashcard Quiz"),("life-skills","Life Skills")]:
                    schemas = [{"name":"test","description":"Test","parameters":[]}]
                    s.add(AppRegistration(app_id=aid, name=n, description=f"{n} app", auth_type="none", iframe_url=f"/apps/{aid}/index.html", tool_schemas=schemas, schema_hash=compute_schema_hash(schemas), schema_version=1, status="active", is_active=True))
                gc_schemas = [{"name":"test","description":"Test","parameters":[]}]
                s.add(AppRegistration(
                    app_id="google-classroom", name="Google Classroom",
                    description="Google Classroom integration", auth_type="oauth2",
                    iframe_url="/apps/google-classroom/index.html",
                    tool_schemas=gc_schemas, schema_hash=compute_schema_hash(gc_schemas), schema_version=1,
                    oauth_config={
                        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
                        "token_url": "https://oauth2.googleapis.com/token",
                        "client_id_env_var": "GOOGLE_CLIENT_ID",
                        "client_secret_env_var": "GOOGLE_CLIENT_SECRET",
                        "redirect_uri_env_var": "GOOGLE_REDIRECT_URI",
                        "scopes": ["https://www.googleapis.com/auth/classroom.courses.readonly"],
                    },
                    status="active", is_active=True, platform_status="allowed",
                ))
                await s.commit()

        _initialized = True

    yield
    engine = get_engine()
    await engine.dispose()
    reset_engine()


@pytest.fixture
async def client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def student1_client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={}) as ac:
        resp = await ac.post("/api/auth/login", json={"username":"student1","password":"student123"})
        # Manually set cookies from response
        for k, v in resp.cookies.items():
            ac.cookies.set(k, v)
        yield ac

@pytest.fixture
async def student2_client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={}) as ac:
        resp = await ac.post("/api/auth/login", json={"username":"student2","password":"student234"})
        for k, v in resp.cookies.items():
            ac.cookies.set(k, v)
        yield ac

@pytest.fixture
async def admin_client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={}) as ac:
        resp = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        for k, v in resp.cookies.items():
            ac.cookies.set(k, v)
        yield ac

@pytest.fixture
async def teacher_client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={}) as ac:
        resp = await ac.post("/api/auth/login", json={"username":"teacher1","password":"teacher123"})
        for k, v in resp.cookies.items():
            ac.cookies.set(k, v)
        yield ac
