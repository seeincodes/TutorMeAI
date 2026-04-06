# Marketplace, Classrooms & Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add classroom-scoped app whitelisting, a public marketplace browse/detail UI, a developer submission form, and an admin approve/reject review workflow.

**Architecture:** Three new DB models (Classroom, ClassroomMembership, ClassroomAppWhitelist) with a new classroom router. Extend existing marketplace router with browse, detail, and review endpoints. Three new frontend pages (browse, detail, submit) plus enhanced admin review UI. TDD throughout.

**Tech Stack:** Python FastAPI, SQLAlchemy async, Alembic, React + TypeScript + Tailwind, Vitest, pytest

---

### Task 1: Classroom, Membership & Whitelist Models

**Files:**
- Modify: `web/backend/app/models.py`
- Create: `web/backend/alembic/versions/k6f7g8h9i0j1_add_classrooms.py`
- Create: `web/backend/tests/test_classrooms.py`

- [ ] **Step 1: Write failing model tests**

Create `web/backend/tests/test_classrooms.py`:

```python
"""Classroom model tests."""
import pytest
from sqlalchemy import select

from app.database import get_session_factory


@pytest.mark.asyncio
async def test_classroom_creation():
    """Classroom can be created with a name and teacher_id."""
    from app.models import Classroom, User

    sf = get_session_factory()
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        c = Classroom(name="Period 1 Math", teacher_id=teacher.id)
        s.add(c)
        await s.commit()
        await s.refresh(c)

        assert c.name == "Period 1 Math"
        assert c.teacher_id == teacher.id
        assert c.id is not None

        await s.delete(c)
        await s.commit()


@pytest.mark.asyncio
async def test_classroom_membership():
    """Students can be added to a classroom."""
    from app.models import Classroom, ClassroomMembership, User

    sf = get_session_factory()
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        student = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()

        c = Classroom(name="Science", teacher_id=teacher.id)
        s.add(c)
        await s.flush()

        m = ClassroomMembership(classroom_id=c.id, student_id=student.id)
        s.add(m)
        await s.commit()
        await s.refresh(m)

        assert m.classroom_id == c.id
        assert m.student_id == student.id

        await s.delete(m)
        await s.delete(c)
        await s.commit()


@pytest.mark.asyncio
async def test_classroom_membership_unique_constraint():
    """Cannot add same student to same classroom twice."""
    from sqlalchemy.exc import IntegrityError
    from app.models import Classroom, ClassroomMembership, User

    sf = get_session_factory()
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        student = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()

        c = Classroom(name="Art", teacher_id=teacher.id)
        s.add(c)
        await s.flush()

        s.add(ClassroomMembership(classroom_id=c.id, student_id=student.id))
        await s.flush()

        s.add(ClassroomMembership(classroom_id=c.id, student_id=student.id))
        with pytest.raises(IntegrityError):
            await s.flush()

        await s.rollback()


@pytest.mark.asyncio
async def test_classroom_app_whitelist():
    """Apps can be whitelisted for a classroom."""
    from app.models import Classroom, ClassroomAppWhitelist, User

    sf = get_session_factory()
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()

        c = Classroom(name="History", teacher_id=teacher.id)
        s.add(c)
        await s.flush()

        w = ClassroomAppWhitelist(classroom_id=c.id, app_id="chess", added_by=teacher.id)
        s.add(w)
        await s.commit()
        await s.refresh(w)

        assert w.app_id == "chess"
        assert w.classroom_id == c.id

        await s.delete(w)
        await s.delete(c)
        await s.commit()


@pytest.mark.asyncio
async def test_classroom_app_whitelist_unique_constraint():
    """Cannot whitelist same app for same classroom twice."""
    from sqlalchemy.exc import IntegrityError
    from app.models import Classroom, ClassroomAppWhitelist, User

    sf = get_session_factory()
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()

        c = Classroom(name="English", teacher_id=teacher.id)
        s.add(c)
        await s.flush()

        s.add(ClassroomAppWhitelist(classroom_id=c.id, app_id="chess", added_by=teacher.id))
        await s.flush()

        s.add(ClassroomAppWhitelist(classroom_id=c.id, app_id="chess", added_by=teacher.id))
        with pytest.raises(IntegrityError):
            await s.flush()

        await s.rollback()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_classrooms.py -v`
Expected: FAIL with `ImportError: cannot import name 'Classroom'`

- [ ] **Step 3: Add models to models.py**

Add to `web/backend/app/models.py` after the `DistrictAppApproval` class:

```python
class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    teacher: Mapped["User"] = relationship()
    memberships: Mapped[list["ClassroomMembership"]] = relationship(back_populates="classroom", cascade="all, delete-orphan")
    app_whitelist: Mapped[list["ClassroomAppWhitelist"]] = relationship(back_populates="classroom", cascade="all, delete-orphan")


class ClassroomMembership(Base):
    __tablename__ = "classroom_memberships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    classroom: Mapped["Classroom"] = relationship(back_populates="memberships")
    student: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("classroom_id", "student_id", name="uq_classroom_memberships_classroom_student"),
    )


class ClassroomAppWhitelist(Base):
    __tablename__ = "classroom_app_whitelist"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    app_id: Mapped[str] = mapped_column(Text, nullable=False)
    added_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    classroom: Mapped["Classroom"] = relationship(back_populates="app_whitelist")

    __table_args__ = (
        UniqueConstraint("classroom_id", "app_id", name="uq_classroom_app_whitelist_classroom_app"),
    )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_classrooms.py -v`
Expected: All 5 tests PASS

- [ ] **Step 5: Create Alembic migration**

Run: `cd web/backend && .venv/bin/python -m alembic revision --autogenerate -m "add classrooms"`
Then verify the generated migration has the three tables and constraints.

- [ ] **Step 6: Commit**

```bash
git add web/backend/app/models.py web/backend/tests/test_classrooms.py web/backend/alembic/versions/*add_classrooms*
git commit -m "feat: add Classroom, ClassroomMembership, ClassroomAppWhitelist models"
```

---

### Task 2: Classroom CRUD API

**Files:**
- Create: `web/backend/app/classrooms/__init__.py`
- Create: `web/backend/app/classrooms/router.py`
- Modify: `web/backend/app/main.py`
- Modify: `web/backend/tests/test_classrooms.py`

- [ ] **Step 1: Write failing API tests**

Append to `web/backend/tests/test_classrooms.py`:

```python
# ── API Tests: Classroom CRUD ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_teacher_creates_classroom(teacher_client):
    resp = await teacher_client.post("/api/classrooms", json={"name": "Period 2 Math"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Period 2 Math"
    assert "id" in data


@pytest.mark.asyncio
async def test_teacher_lists_own_classrooms(teacher_client):
    await teacher_client.post("/api/classrooms", json={"name": "Room A"})
    await teacher_client.post("/api/classrooms", json={"name": "Room B"})

    resp = await teacher_client.get("/api/classrooms")
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "Room A" in names
    assert "Room B" in names


@pytest.mark.asyncio
async def test_student_cannot_create_classroom(student1_client):
    resp = await student1_client.post("/api/classrooms", json={"name": "Nope"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_add_student_to_classroom(teacher_client):
    from app.models import User
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        student = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        student_id = str(student.id)

    cr = await teacher_client.post("/api/classrooms", json={"name": "Add Test"})
    classroom_id = cr.json()["id"]

    resp = await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student_id})
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_list_classroom_members(teacher_client):
    from app.models import User
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        student = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        student_id = str(student.id)

    cr = await teacher_client.post("/api/classrooms", json={"name": "Members Test"})
    classroom_id = cr.json()["id"]
    await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student_id})

    resp = await teacher_client.get(f"/api/classrooms/{classroom_id}/members")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["username"] == "student1"


@pytest.mark.asyncio
async def test_remove_student_from_classroom(teacher_client):
    from app.models import User
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        student = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        student_id = str(student.id)

    cr = await teacher_client.post("/api/classrooms", json={"name": "Remove Test"})
    classroom_id = cr.json()["id"]
    await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student_id})

    resp = await teacher_client.delete(f"/api/classrooms/{classroom_id}/members/{student_id}")
    assert resp.status_code == 200

    members = await teacher_client.get(f"/api/classrooms/{classroom_id}/members")
    assert len(members.json()) == 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_classrooms.py::test_teacher_creates_classroom -v`
Expected: FAIL with 404 (no route)

- [ ] **Step 3: Implement classroom router**

Create `web/backend/app/classrooms/__init__.py` (empty file).

Create `web/backend/app/classrooms/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import Classroom, ClassroomAppWhitelist, ClassroomMembership, User

router = APIRouter(prefix="/api/classrooms", tags=["classrooms"])


class CreateClassroomRequest(BaseModel):
    name: str


class ClassroomResponse(BaseModel):
    id: str
    name: str
    teacher_id: str
    created_at: str

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    student_id: str


class MemberResponse(BaseModel):
    student_id: str
    username: str
    display_name: str | None

    model_config = {"from_attributes": True}


class AddAppRequest(BaseModel):
    app_id: str


class WhitelistResponse(BaseModel):
    app_id: str
    added_by: str
    added_at: str

    model_config = {"from_attributes": True}


async def _get_owned_classroom(classroom_id: str, teacher: User, db: AsyncSession) -> Classroom:
    """Fetch a classroom owned by the given teacher, or 404."""
    import uuid as _uuid
    try:
        cid = _uuid.UUID(classroom_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    result = await db.execute(
        select(Classroom).where(Classroom.id == cid, Classroom.teacher_id == teacher.id)
    )
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
    return classroom


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_classroom(
    body: CreateClassroomRequest,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    classroom = Classroom(name=body.name, teacher_id=current_user.id)
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return {"id": str(classroom.id), "name": classroom.name, "teacher_id": str(classroom.teacher_id), "created_at": str(classroom.created_at)}


@router.get("")
async def list_classrooms(
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(Classroom).where(Classroom.teacher_id == current_user.id)
    )
    classrooms = result.scalars().all()
    return [{"id": str(c.id), "name": c.name, "teacher_id": str(c.teacher_id), "created_at": str(c.created_at)} for c in classrooms]


@router.post("/{classroom_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    classroom_id: str,
    body: AddMemberRequest,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)
    import uuid as _uuid
    membership = ClassroomMembership(classroom_id=classroom.id, student_id=_uuid.UUID(body.student_id))
    db.add(membership)
    await db.commit()
    return {"classroom_id": str(classroom.id), "student_id": body.student_id}


@router.get("/{classroom_id}/members")
async def list_members(
    classroom_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)
    result = await db.execute(
        select(ClassroomMembership, User).join(User, ClassroomMembership.student_id == User.id).where(
            ClassroomMembership.classroom_id == classroom.id
        )
    )
    rows = result.all()
    return [{"student_id": str(m.student_id), "username": u.username, "display_name": u.display_name} for m, u in rows]


@router.delete("/{classroom_id}/members/{student_id}")
async def remove_member(
    classroom_id: str,
    student_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)
    import uuid as _uuid
    result = await db.execute(
        select(ClassroomMembership).where(
            ClassroomMembership.classroom_id == classroom.id,
            ClassroomMembership.student_id == _uuid.UUID(student_id),
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
    await db.delete(membership)
    await db.commit()
    return {"removed": True}


@router.post("/{classroom_id}/apps", status_code=status.HTTP_201_CREATED)
async def add_app_to_whitelist(
    classroom_id: str,
    body: AddAppRequest,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)
    entry = ClassroomAppWhitelist(classroom_id=classroom.id, app_id=body.app_id, added_by=current_user.id)
    db.add(entry)
    await db.commit()
    return {"classroom_id": str(classroom.id), "app_id": body.app_id}


@router.delete("/{classroom_id}/apps/{app_id}")
async def remove_app_from_whitelist(
    classroom_id: str,
    app_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)
    result = await db.execute(
        select(ClassroomAppWhitelist).where(
            ClassroomAppWhitelist.classroom_id == classroom.id,
            ClassroomAppWhitelist.app_id == app_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not in whitelist")
    await db.delete(entry)
    await db.commit()
    return {"removed": True}


@router.get("/{classroom_id}/apps")
async def list_whitelisted_apps(
    classroom_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)
    result = await db.execute(
        select(ClassroomAppWhitelist).where(ClassroomAppWhitelist.classroom_id == classroom.id)
    )
    entries = result.scalars().all()
    return [{"app_id": e.app_id, "added_by": str(e.added_by), "added_at": str(e.added_at)} for e in entries]
```

- [ ] **Step 4: Register router in main.py**

Add to `web/backend/app/main.py` imports:

```python
from app.classrooms.router import router as classrooms_router
```

Add after the existing `include_router` lines:

```python
app.include_router(classrooms_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_classrooms.py -v`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add web/backend/app/classrooms/ web/backend/app/main.py web/backend/tests/test_classrooms.py
git commit -m "feat: add classroom CRUD API with member and app whitelist management"
```

---

### Task 3: Marketplace Browse & Detail Endpoints

**Files:**
- Modify: `web/backend/app/marketplace/router.py`
- Create: `web/backend/tests/test_marketplace_browse.py`

- [ ] **Step 1: Write failing tests for browse and detail**

Create `web/backend/tests/test_marketplace_browse.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_marketplace_browse.py -v`
Expected: FAIL with 404/405 (routes don't exist yet)

- [ ] **Step 3: Add browse and detail endpoints to marketplace router**

Add to `web/backend/app/marketplace/router.py`:

```python
from app.models import AppContentScreen, AppRegistration, ClassroomAppWhitelist, ClassroomMembership, ToolInvocation, User


class BrowseAppResponse(BaseModel):
    app_id: str
    name: str
    description: str
    trust_tier: str
    age_rating: str
    developer_name: str | None = None
    logo_url: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class DetailAppResponse(BaseModel):
    app_id: str
    name: str
    description: str
    trust_tier: str
    age_rating: str
    auth_type: str
    developer_name: str | None = None
    developer_email: str | None = None
    website_url: str | None = None
    privacy_policy_url: str | None = None
    logo_url: str | None = None
    tool_schemas: list[dict]
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("/browse")
async def browse_marketplace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BrowseAppResponse]:
    """Browse apps visible to the current user."""
    if current_user.role in ("teacher", "admin", "district_admin"):
        # Teachers/admins see all active apps
        result = await db.execute(
            select(AppRegistration).where(
                AppRegistration.status == "active",
                AppRegistration.is_active == True,  # noqa: E712
            )
        )
        apps = result.scalars().all()
    else:
        # Students see only apps whitelisted for their classrooms
        result = await db.execute(
            select(AppRegistration)
            .join(ClassroomAppWhitelist, ClassroomAppWhitelist.app_id == AppRegistration.app_id)
            .join(ClassroomMembership, ClassroomMembership.classroom_id == ClassroomAppWhitelist.classroom_id)
            .where(
                ClassroomMembership.student_id == current_user.id,
                AppRegistration.status == "active",
                AppRegistration.is_active == True,  # noqa: E712
            )
        )
        apps = result.scalars().unique().all()

    return [
        BrowseAppResponse(
            app_id=a.app_id, name=a.name, description=a.description,
            trust_tier=a.trust_tier, age_rating=a.age_rating,
            developer_name=a.developer_name, logo_url=a.logo_url, is_active=a.is_active,
        )
        for a in apps
    ]


@router.get("/{app_id}/detail")
async def app_detail(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DetailAppResponse:
    """Full detail for a single app."""
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    return DetailAppResponse(
        app_id=app_reg.app_id, name=app_reg.name, description=app_reg.description,
        trust_tier=app_reg.trust_tier, age_rating=app_reg.age_rating, auth_type=app_reg.auth_type,
        developer_name=app_reg.developer_name, developer_email=app_reg.developer_email,
        website_url=app_reg.website_url, privacy_policy_url=app_reg.privacy_policy_url,
        logo_url=app_reg.logo_url, tool_schemas=app_reg.tool_schemas, is_active=app_reg.is_active,
    )
```

Update the import at the top of `web/backend/app/marketplace/router.py` to include the new models:

```python
from app.models import AppContentScreen, AppRegistration, ClassroomAppWhitelist, ClassroomMembership, ToolInvocation, User
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_marketplace_browse.py -v`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add web/backend/app/marketplace/router.py web/backend/tests/test_marketplace_browse.py
git commit -m "feat: add marketplace browse and detail endpoints with classroom-scoped visibility"
```

---

### Task 4: Admin Review Workflow Endpoint

**Files:**
- Modify: `web/backend/app/marketplace/router.py`
- Create: `web/backend/tests/test_marketplace_review.py`

- [ ] **Step 1: Write failing tests**

Create `web/backend/tests/test_marketplace_review.py`:

```python
"""Admin review workflow tests."""
import pytest


@pytest.mark.asyncio
async def test_review_queue_lists_pending_apps(admin_client, client):
    """Review queue shows apps in pending_review status."""
    # Submit an app
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_marketplace_review.py -v`
Expected: FAIL with 404/405

- [ ] **Step 3: Add review-queue and review endpoints**

Add to `web/backend/app/marketplace/router.py`:

```python
from sqlalchemy.sql import func as sqlfunc


class ReviewQueueResponse(BaseModel):
    app_id: str
    name: str
    description: str
    developer_name: str | None = None
    developer_email: str | None = None
    status: str
    trust_tier: str
    tool_count: int
    created_at: str
    screening_results: list[dict]

    model_config = {"from_attributes": True}


class ReviewActionRequest(BaseModel):
    action: str  # "approve", "reject", "request_changes"
    note: str | None = None


@router.get("/review-queue")
async def review_queue_endpoint(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[ReviewQueueResponse]:
    """List apps pending manual review."""
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.status == "pending_review")
    )
    apps = result.scalars().all()

    response = []
    for app_reg in apps:
        # Fetch screening results
        screens_result = await db.execute(
            select(AppContentScreen).where(AppContentScreen.app_id == app_reg.app_id)
        )
        screens = screens_result.scalars().all()
        screening_results = [
            {"screen_type": sc.screen_type, "result": sc.result, "flagged": sc.flagged}
            for sc in screens
        ]

        response.append(ReviewQueueResponse(
            app_id=app_reg.app_id,
            name=app_reg.name,
            description=app_reg.description,
            developer_name=app_reg.developer_name,
            developer_email=app_reg.developer_email,
            status=app_reg.status,
            trust_tier=app_reg.trust_tier,
            tool_count=len(app_reg.tool_schemas) if app_reg.tool_schemas else 0,
            created_at=str(app_reg.created_at),
            screening_results=screening_results,
        ))
    return response


@router.post("/{app_id}/review")
async def review_app(
    app_id: str,
    body: ReviewActionRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin approves, rejects, or requests changes on an app."""
    valid_actions = ("approve", "reject", "request_changes")
    if body.action not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action. Must be one of: {valid_actions}",
        )

    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    if body.action == "approve":
        app_reg.status = "active"
        app_reg.is_active = True
        app_reg.approved_at = func.now()
        app_reg.approved_by = current_user.id
    elif body.action == "reject":
        app_reg.status = "rejected"
        app_reg.is_active = False
    elif body.action == "request_changes":
        app_reg.status = "changes_requested"
        app_reg.is_active = False

    await db.commit()
    await db.refresh(app_reg)

    return {
        "app_id": app_reg.app_id,
        "status": app_reg.status,
        "is_active": app_reg.is_active,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_marketplace_review.py -v`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add web/backend/app/marketplace/router.py web/backend/tests/test_marketplace_review.py
git commit -m "feat: add admin review workflow with approve/reject/request_changes"
```

---

### Task 5: Frontend API Client Extensions

**Files:**
- Modify: `web/frontend/src/lib/api.ts`
- Modify: `web/frontend/src/lib/__tests__/dashboard-api.test.ts`

- [ ] **Step 1: Write failing API client tests**

Append to `web/frontend/src/lib/__tests__/dashboard-api.test.ts`:

```typescript
  it('browseMarketplace calls GET /api/marketplace/browse', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ app_id: 'chess', name: 'Chess' }]))

    const result = await api.browseMarketplace()

    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/browse', expect.anything())
    expect(result[0].app_id).toBe('chess')
  })

  it('fetchAppDetail calls GET /api/marketplace/:appId/detail', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'chess', name: 'Chess', tool_schemas: [] }))

    const result = await api.fetchAppDetail('chess')

    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/chess/detail', expect.anything())
    expect(result.app_id).toBe('chess')
  })

  it('submitApp calls POST /api/marketplace/submit', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'new-app', status: 'pending_review' }, 201))

    const result = await api.submitApp({
      app_id: 'new-app', name: 'New App', description: 'Test',
      iframe_url: 'https://example.com', tool_schemas: [],
      developer_name: 'Dev', developer_email: 'dev@test.com',
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/submit', expect.objectContaining({ method: 'POST' }))
    expect(result.status).toBe('pending_review')
  })

  it('reviewApp calls POST /api/marketplace/:appId/review', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ app_id: 'chess', status: 'active' }))

    const result = await api.reviewApp('chess', 'approve')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/marketplace/chess/review',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'approve' }) })
    )
    expect(result.status).toBe('active')
  })

  it('listClassrooms calls GET /api/classrooms', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ id: '1', name: 'Math' }]))

    const result = await api.listClassrooms()

    expect(mockFetch).toHaveBeenCalledWith('/api/classrooms', expect.anything())
    expect(result[0].name).toBe('Math')
  })

  it('addAppToClassroom calls POST /api/classrooms/:id/apps', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ classroom_id: '1', app_id: 'chess' }, 201))

    const result = await api.addAppToClassroom('1', 'chess')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/classrooms/1/apps',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ app_id: 'chess' }) })
    )
    expect(result.app_id).toBe('chess')
  })

  it('fetchReviewQueue calls GET /api/marketplace/review-queue', async () => {
    const { api } = await import('@/lib/api')
    mockFetch.mockResolvedValueOnce(mockJsonResponse([{ app_id: 'test', status: 'pending_review' }]))

    const result = await api.fetchReviewQueue()

    expect(mockFetch).toHaveBeenCalledWith('/api/marketplace/review-queue', expect.anything())
    expect(result[0].status).toBe('pending_review')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web/frontend && pnpm vitest run src/lib/__tests__/dashboard-api.test.ts`
Expected: FAIL — `api.browseMarketplace is not a function`

- [ ] **Step 3: Add types and API methods**

Add to `web/frontend/src/lib/api.ts` interfaces section:

```typescript
export interface BrowseApp {
  app_id: string
  name: string
  description: string
  trust_tier: string
  age_rating: string
  developer_name: string | null
  logo_url: string | null
  is_active: boolean
}

export interface AppDetail {
  app_id: string
  name: string
  description: string
  trust_tier: string
  age_rating: string
  auth_type: string
  developer_name: string | null
  developer_email: string | null
  website_url: string | null
  privacy_policy_url: string | null
  logo_url: string | null
  tool_schemas: { name: string; description: string; parameters: unknown[] }[]
  is_active: boolean
}

export interface SubmitAppPayload {
  app_id: string
  name: string
  description: string
  iframe_url: string
  tool_schemas: { name: string; description: string; parameters: unknown[] }[]
  developer_name: string
  developer_email: string
  website_url?: string
  privacy_policy_url?: string
  logo_url?: string
  age_rating?: string
}

export interface ClassroomInfo {
  id: string
  name: string
  teacher_id: string
  created_at: string
}

export interface ReviewQueueApp {
  app_id: string
  name: string
  description: string
  developer_name: string | null
  developer_email: string | null
  status: string
  trust_tier: string
  tool_count: number
  created_at: string
  screening_results: { screen_type: string; result: string; flagged: boolean }[]
}
```

Add to the `api` object:

```typescript
  browseMarketplace: () => request<BrowseApp[]>('/marketplace/browse'),

  fetchAppDetail: (appId: string) => request<AppDetail>(`/marketplace/${appId}/detail`),

  submitApp: (payload: SubmitAppPayload) =>
    request<{ app_id: string; name: string; status: string; trust_tier: string }>('/marketplace/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewApp: (appId: string, action: string, note?: string) =>
    request<{ app_id: string; status: string; is_active: boolean }>(`/marketplace/${appId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(note ? { note } : {}) }),
    }),

  listClassrooms: () => request<ClassroomInfo[]>('/classrooms'),

  createClassroom: (name: string) =>
    request<ClassroomInfo>('/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  addAppToClassroom: (classroomId: string, appId: string) =>
    request<{ classroom_id: string; app_id: string }>(`/classrooms/${classroomId}/apps`, {
      method: 'POST',
      body: JSON.stringify({ app_id: appId }),
    }),

  removeAppFromClassroom: (classroomId: string, appId: string) =>
    request<{ removed: boolean }>(`/classrooms/${classroomId}/apps/${appId}`, {
      method: 'DELETE',
    }),

  fetchReviewQueue: () => request<ReviewQueueApp[]>('/marketplace/review-queue'),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web/frontend && pnpm vitest run src/lib/__tests__/dashboard-api.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add web/frontend/src/lib/api.ts web/frontend/src/lib/__tests__/dashboard-api.test.ts
git commit -m "feat: add marketplace browse, detail, review, and classroom API client methods"
```

---

### Task 6: Marketplace Browse Page

**Files:**
- Create: `web/frontend/src/pages/marketplace/MarketplaceBrowsePage.tsx`
- Modify: `web/frontend/src/App.tsx`

- [ ] **Step 1: Create the browse page component**

Create `web/frontend/src/pages/marketplace/MarketplaceBrowsePage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { api, type BrowseApp, type ClassroomInfo } from '@/lib/api'

const TRUST_COLORS: Record<string, string> = {
  verified: 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand',
  district: 'bg-blue-900/20 text-blue-400',
  school: 'bg-cyan-900/20 text-cyan-400',
  classroom: 'bg-teal-900/20 text-teal-400',
  new: 'bg-chatbox-background-secondary text-chatbox-tint-tertiary',
}

export default function MarketplaceBrowsePage() {
  const { user } = useAuth()
  const [apps, setApps] = useState<BrowseApp[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'district_admin'

  useEffect(() => {
    const promises: Promise<unknown>[] = [api.browseMarketplace().then(setApps)]
    if (isTeacher) {
      promises.push(api.listClassrooms().then(setClassrooms))
    }
    Promise.all(promises)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isTeacher])

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddToClassroom(appId: string, classroomId: string) {
    await api.addAppToClassroom(classroomId, appId)
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-chatbox-tint-tertiary">Loading marketplace...</div>

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-chatbox-tint-primary">Marketplace</h1>
          <p className="text-sm text-chatbox-tint-tertiary">Discover educational apps</p>
        </div>
        <Link to="/" className="text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors">
          ← Back to Chat
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search apps..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-6 w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-4 py-2.5 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(app => (
          <div key={app.app_id} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary p-4 transition-colors hover:border-chatbox-tint-brand/30">
            <Link to={`/marketplace/${app.app_id}`} className="block">
              <div className="mb-2 flex items-center gap-3">
                {app.logo_url ? (
                  <img src={app.logo_url} alt="" className="h-10 w-10 rounded-lg" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chatbox-background-secondary text-lg">
                    {app.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-chatbox-tint-primary">{app.name}</h3>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${TRUST_COLORS[app.trust_tier] || TRUST_COLORS.new}`}>
                    {app.trust_tier}
                  </span>
                </div>
              </div>
              <p className="text-xs text-chatbox-tint-tertiary line-clamp-2">{app.description}</p>
            </Link>

            {isTeacher && classrooms.length > 0 && (
              <div className="mt-3 border-t border-chatbox-border-primary pt-3">
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleAddToClassroom(app.app_id, e.target.value); e.target.value = '' }}
                  className="w-full rounded border border-chatbox-border-primary bg-chatbox-background-secondary px-2 py-1.5 text-xs text-chatbox-tint-secondary"
                >
                  <option value="" disabled>+ Add to Classroom...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-chatbox-tint-tertiary">
          {apps.length === 0 ? 'No apps available yet.' : 'No apps match your search.'}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

Add import in `web/frontend/src/App.tsx`:

```typescript
import MarketplaceBrowsePage from '@/pages/marketplace/MarketplaceBrowsePage'
import MarketplaceDetailPage from '@/pages/marketplace/MarketplaceDetailPage'
import MarketplaceSubmitPage from '@/pages/marketplace/MarketplaceSubmitPage'
```

Add routes inside `<Routes>`, after the dashboard routes:

```tsx
<Route
  path="/marketplace"
  element={
    <RequireAuth>
      <MarketplaceBrowsePage />
    </RequireAuth>
  }
/>
<Route
  path="/marketplace/submit"
  element={<MarketplaceSubmitPage />}
/>
<Route
  path="/marketplace/:appId"
  element={
    <RequireAuth>
      <MarketplaceDetailPage />
    </RequireAuth>
  }
/>
```

Note: `/marketplace/submit` has no auth guard (public endpoint for developers).

- [ ] **Step 3: Commit**

```bash
git add web/frontend/src/pages/marketplace/ web/frontend/src/App.tsx
git commit -m "feat: add marketplace browse page with search and classroom picker"
```

---

### Task 7: App Detail Page

**Files:**
- Create: `web/frontend/src/pages/marketplace/MarketplaceDetailPage.tsx`

- [ ] **Step 1: Create the detail page component**

Create `web/frontend/src/pages/marketplace/MarketplaceDetailPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { api, type AppDetail, type ClassroomInfo } from '@/lib/api'

const TRUST_COLORS: Record<string, string> = {
  verified: 'bg-chatbox-background-brand-secondary text-chatbox-tint-brand',
  district: 'bg-blue-900/20 text-blue-400',
  school: 'bg-cyan-900/20 text-cyan-400',
  classroom: 'bg-teal-900/20 text-teal-400',
  new: 'bg-chatbox-background-secondary text-chatbox-tint-tertiary',
}

export default function MarketplaceDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const { user } = useAuth()
  const [app, setApp] = useState<AppDetail | null>(null)
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'district_admin'

  useEffect(() => {
    if (!appId) return
    const promises: Promise<unknown>[] = [
      api.fetchAppDetail(appId).then(setApp).catch(() => setError('App not found')),
    ]
    if (isTeacher) {
      promises.push(api.listClassrooms().then(setClassrooms).catch(() => {}))
    }
    Promise.all(promises).finally(() => setLoading(false))
  }, [appId, isTeacher])

  async function handleAddToClassroom(classroomId: string) {
    if (!appId) return
    await api.addAppToClassroom(classroomId, appId)
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-chatbox-tint-tertiary">Loading...</div>
  if (error || !app) return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link to="/marketplace" className="text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary">← Back to Marketplace</Link>
      <p className="mt-4 text-chatbox-tint-error">{error || 'App not found'}</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/marketplace" className="mb-6 inline-block text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors">
        ← Back to Marketplace
      </Link>

      <div className="flex gap-8">
        {/* Left column: app info */}
        <div className="flex-[2]">
          <div className="mb-4 flex items-center gap-4">
            {app.logo_url ? (
              <img src={app.logo_url} alt="" className="h-16 w-16 rounded-xl" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-chatbox-background-secondary text-2xl font-bold text-chatbox-tint-tertiary">
                {app.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-chatbox-tint-primary">{app.name}</h1>
              <span className={`rounded px-2 py-0.5 text-xs ${TRUST_COLORS[app.trust_tier] || TRUST_COLORS.new}`}>
                {app.trust_tier}
              </span>
            </div>
          </div>

          <p className="mb-6 text-sm text-chatbox-tint-secondary leading-relaxed">{app.description}</p>

          <h2 className="mb-3 text-sm font-semibold text-chatbox-tint-primary">Available Tools</h2>
          <div className="space-y-2">
            {app.tool_schemas.map(tool => (
              <div key={tool.name} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-4 py-3">
                <code className="text-xs font-medium text-chatbox-tint-brand">{tool.name}</code>
                <p className="mt-1 text-xs text-chatbox-tint-tertiary">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: metadata sidebar */}
        <div className="flex-1">
          <div className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Details</h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-chatbox-tint-tertiary">Age Rating</span>
                <p className="font-medium text-chatbox-tint-primary">{app.age_rating}</p>
              </div>
              <div>
                <span className="text-chatbox-tint-tertiary">Auth Type</span>
                <p className="font-medium text-chatbox-tint-primary">{app.auth_type}</p>
              </div>
              {app.developer_name && (
                <div>
                  <span className="text-chatbox-tint-tertiary">Developer</span>
                  <p className="font-medium text-chatbox-tint-primary">{app.developer_name}</p>
                </div>
              )}
              {app.privacy_policy_url && (
                <a href={app.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="block text-chatbox-tint-brand hover:underline">
                  Privacy Policy ↗
                </a>
              )}
              {app.website_url && (
                <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="block text-chatbox-tint-brand hover:underline">
                  Website ↗
                </a>
              )}
            </div>

            {isTeacher && classrooms.length > 0 && (
              <div className="mt-4 border-t border-chatbox-border-primary pt-4">
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleAddToClassroom(e.target.value); e.target.value = '' }}
                  className="w-full rounded border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-2 text-xs text-chatbox-tint-secondary"
                >
                  <option value="" disabled>+ Add to Classroom...</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/pages/marketplace/MarketplaceDetailPage.tsx
git commit -m "feat: add marketplace app detail page with two-column layout"
```

---

### Task 8: Developer Submission Form

**Files:**
- Create: `web/frontend/src/pages/marketplace/MarketplaceSubmitPage.tsx`

- [ ] **Step 1: Create the submission page**

Create `web/frontend/src/pages/marketplace/MarketplaceSubmitPage.tsx`:

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export default function MarketplaceSubmitPage() {
  const [form, setForm] = useState({
    app_id: '',
    name: '',
    description: '',
    iframe_url: '',
    tool_schemas_json: '',
    developer_name: '',
    developer_email: '',
    website_url: '',
    privacy_policy_url: '',
    logo_url: '',
    age_rating: 'all',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let tool_schemas: { name: string; description: string; parameters: unknown[] }[]
    try {
      tool_schemas = JSON.parse(form.tool_schemas_json)
      if (!Array.isArray(tool_schemas)) throw new Error('Must be an array')
    } catch {
      setError('Tool schemas must be valid JSON array')
      return
    }

    setSubmitting(true)
    try {
      const result = await api.submitApp({
        app_id: form.app_id,
        name: form.name,
        description: form.description,
        iframe_url: form.iframe_url,
        tool_schemas,
        developer_name: form.developer_name,
        developer_email: form.developer_email,
        website_url: form.website_url || undefined,
        privacy_policy_url: form.privacy_policy_url || undefined,
        logo_url: form.logo_url || undefined,
        age_rating: form.age_rating,
      })
      setSuccess(result.app_id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mb-4 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-bold text-chatbox-tint-primary">App Submitted for Review</h1>
        <p className="mb-6 text-sm text-chatbox-tint-tertiary">
          Your app <code className="rounded bg-chatbox-background-secondary px-2 py-0.5 text-chatbox-tint-brand">{success}</code> is now pending review.
        </p>
        <Link to="/marketplace" className="text-sm text-chatbox-tint-brand hover:underline">← Back to Marketplace</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link to="/marketplace" className="mb-6 inline-block text-sm text-chatbox-tint-tertiary hover:text-chatbox-tint-primary transition-colors">
        ← Back to Marketplace
      </Link>

      <h1 className="mb-1 text-xl font-bold text-chatbox-tint-primary">Submit Your App</h1>
      <p className="mb-6 text-sm text-chatbox-tint-tertiary">Apps are reviewed before appearing in the marketplace.</p>

      {error && <p className="mb-4 rounded bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="App ID *" value={form.app_id} onChange={v => updateField('app_id', v)} placeholder="my-cool-app" />
          <Field label="App Name *" value={form.name} onChange={v => updateField('name', v)} placeholder="My Cool App" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">Description *</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Describe what your app does..."
            rows={3}
            required
            className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
          />
        </div>

        <Field label="Iframe URL *" value={form.iframe_url} onChange={v => updateField('iframe_url', v)} placeholder="https://myapp.com/embed" />

        <div>
          <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">Tool Schemas (JSON) *</label>
          <textarea
            value={form.tool_schemas_json}
            onChange={e => updateField('tool_schemas_json', e.target.value)}
            placeholder='[{"name": "start_game", "description": "Start the game", "parameters": []}]'
            rows={4}
            required
            className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 font-mono text-xs text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
          />
        </div>

        <div className="border-t border-chatbox-border-primary pt-4">
          <h2 className="mb-3 text-sm font-semibold text-chatbox-tint-primary">Developer Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *" value={form.developer_name} onChange={v => updateField('developer_name', v)} placeholder="Jane Dev" />
            <Field label="Email *" value={form.developer_email} onChange={v => updateField('developer_email', v)} placeholder="jane@example.com" type="email" />
            <Field label="Website" value={form.website_url} onChange={v => updateField('website_url', v)} placeholder="https://jane.dev" required={false} />
            <Field label="Privacy Policy URL" value={form.privacy_policy_url} onChange={v => updateField('privacy_policy_url', v)} placeholder="https://jane.dev/privacy" required={false} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">Age Rating</label>
            <select
              value={form.age_rating}
              onChange={e => updateField('age_rating', e.target.value)}
              className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary outline-none"
            >
              <option value="all">All Ages</option>
              <option value="K-2">K-2</option>
              <option value="3-5">3-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
            </select>
          </div>
          <Field label="Logo URL" value={form.logo_url} onChange={v => updateField('logo_url', v)} placeholder="https://..." required={false} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-chatbox-background-brand-primary px-4 py-2.5 text-sm font-medium text-chatbox-tint-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = true }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-chatbox-tint-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-2 text-sm text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none focus:border-chatbox-tint-brand"
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/pages/marketplace/MarketplaceSubmitPage.tsx
git commit -m "feat: add developer app submission form page"
```

---

### Task 9: Enhanced Admin Review UI

**Files:**
- Modify: `web/frontend/src/pages/dashboard/MarketplaceSection.tsx`

- [ ] **Step 1: Replace MarketplaceSection with review workflow**

Rewrite `web/frontend/src/pages/dashboard/MarketplaceSection.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { api, type CatalogApp, type ScreeningQueueEntry, type ReviewQueueApp } from '@/lib/api'

const TRUST_TIERS = ['new', 'classroom', 'school', 'district', 'verified'] as const

type Tab = 'catalog' | 'review' | 'screening'

export default function MarketplaceSection() {
  const [tab, setTab] = useState<Tab>('catalog')
  const [apps, setApps] = useState<CatalogApp[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueApp[]>([])
  const [screeningQueue, setScreeningQueue] = useState<ScreeningQueueEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.fetchMarketplaceCatalog(),
      api.fetchReviewQueue(),
      api.fetchScreeningQueue(),
    ])
      .then(([catalog, review, screening]) => {
        setApps(catalog)
        setReviewQueue(review)
        setScreeningQueue(screening)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleTrustChange(appId: string, tier: string) {
    await api.updateTrustTier(appId, tier)
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, trust_tier: tier } : a))
  }

  async function handleReview(appId: string, action: string, note?: string) {
    const result = await api.reviewApp(appId, action, note)
    setReviewQueue(prev => prev.filter(a => a.app_id !== appId))
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, status: result.status, is_active: result.is_active } : a))
  }

  async function handleClearFlags(appId: string) {
    const result = await api.clearAppFlags(appId)
    setScreeningQueue(prev => prev.filter(q => q.app_id !== appId))
    setApps(prev => prev.map(a => a.app_id === appId ? { ...a, is_active: result.is_active } : a))
  }

  if (loading) return <p className="text-chatbox-tint-tertiary">Loading marketplace...</p>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-chatbox-tint-primary">Marketplace</h2>
          <p className="text-sm text-chatbox-tint-tertiary">Manage apps, review submissions, handle flags</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {([
          ['catalog', 'All Apps', apps.length],
          ['review', 'Review Queue', reviewQueue.length],
          ['screening', 'Screening Queue', screeningQueue.length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? 'border-chatbox-tint-brand bg-chatbox-background-brand-secondary text-chatbox-tint-brand'
                : 'border-chatbox-border-primary text-chatbox-tint-secondary hover:bg-chatbox-background-secondary'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Pipeline indicator */}
      {tab === 'review' && (
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="rounded bg-green-900/20 px-2 py-1 text-green-400">1. Submitted</span>
          <span className="text-chatbox-tint-tertiary">→</span>
          <span className="rounded bg-green-900/20 px-2 py-1 text-green-400">2. Auto-screened</span>
          <span className="text-chatbox-tint-tertiary">→</span>
          <span className="rounded bg-yellow-900/20 px-2 py-1 text-yellow-400 font-semibold">3. Manual Review</span>
          <span className="text-chatbox-tint-tertiary">→</span>
          <span className="rounded bg-chatbox-background-secondary px-2 py-1 text-chatbox-tint-tertiary">4. Active</span>
        </div>
      )}

      {tab === 'catalog' && <CatalogTable apps={apps} onTrustChange={handleTrustChange} />}
      {tab === 'review' && <ReviewQueue queue={reviewQueue} onReview={handleReview} />}
      {tab === 'screening' && <ScreeningTable queue={screeningQueue} onClearFlags={handleClearFlags} />}
    </div>
  )
}

function CatalogTable({ apps, onTrustChange }: { apps: CatalogApp[]; onTrustChange: (id: string, tier: string) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
      <table className="w-full text-sm">
        <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Developer</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Trust Tier</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chatbox-border-primary">
          {apps.map(app => (
            <tr key={app.app_id}>
              <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{app.name}</td>
              <td className="px-4 py-2.5 text-xs text-chatbox-tint-tertiary">{app.developer_name || 'Internal'}</td>
              <td className="px-4 py-2.5"><StatusBadge status={app.status} active={app.is_active} /></td>
              <td className="px-4 py-2.5">
                <select
                  value={app.trust_tier}
                  onChange={e => onTrustChange(app.app_id, e.target.value)}
                  className="rounded border border-chatbox-border-primary bg-chatbox-background-primary px-2 py-1 text-xs text-chatbox-tint-primary"
                >
                  {TRUST_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReviewQueue({ queue, onReview }: { queue: ReviewQueueApp[]; onReview: (id: string, action: string, note?: string) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({})

  if (queue.length === 0) return <p className="text-sm text-chatbox-tint-tertiary">No apps pending review.</p>

  return (
    <div className="space-y-4">
      {queue.map(app => (
        <div key={app.app_id} className="rounded-lg border border-chatbox-border-primary bg-chatbox-background-primary p-4 border-l-4 border-l-yellow-500">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="font-medium text-chatbox-tint-primary">{app.name}</h3>
              <p className="text-xs text-chatbox-tint-tertiary">by {app.developer_name || 'Unknown'} · {app.developer_email} · {app.tool_count} tools</p>
            </div>
            <span className="rounded bg-yellow-900/20 px-2 py-0.5 text-xs text-yellow-400">{app.status}</span>
          </div>
          <p className="mb-3 text-xs text-chatbox-tint-secondary">{app.description}</p>

          {app.screening_results.length > 0 && (
            <div className="mb-3 flex gap-2">
              {app.screening_results.map((sr, i) => (
                <span key={i} className={`rounded px-2 py-0.5 text-xs ${sr.flagged ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                  {sr.flagged ? '✗' : '✓'} {sr.screen_type}
                </span>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Review note (optional)"
            value={notes[app.app_id] || ''}
            onChange={e => setNotes(prev => ({ ...prev, [app.app_id]: e.target.value }))}
            className="mb-3 w-full rounded border border-chatbox-border-primary bg-chatbox-background-secondary px-3 py-1.5 text-xs text-chatbox-tint-primary placeholder-chatbox-tint-tertiary outline-none"
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => onReview(app.app_id, 'reject', notes[app.app_id])} className="rounded bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors">Reject</button>
            <button onClick={() => onReview(app.app_id, 'request_changes', notes[app.app_id])} className="rounded bg-yellow-900/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-900/30 transition-colors">Request Changes</button>
            <button onClick={() => onReview(app.app_id, 'approve')} className="rounded bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900/30 transition-colors">Approve</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScreeningTable({ queue, onClearFlags }: { queue: ScreeningQueueEntry[]; onClearFlags: (id: string) => void }) {
  if (queue.length === 0) return <p className="text-sm text-chatbox-tint-tertiary">No flagged apps.</p>

  return (
    <div className="overflow-hidden rounded-lg border border-chatbox-border-primary">
      <table className="w-full text-sm">
        <thead className="border-b border-chatbox-border-primary bg-chatbox-background-secondary">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">App</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Flags</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Status</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-chatbox-tint-tertiary">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chatbox-border-primary">
          {queue.map(q => (
            <tr key={q.app_id}>
              <td className="px-4 py-2.5 font-medium text-chatbox-tint-primary">{q.name}</td>
              <td className="px-4 py-2.5 text-xs text-red-400">{q.flag_count} / {q.auto_suspend_threshold}</td>
              <td className="px-4 py-2.5">
                <span className={`rounded px-2 py-0.5 text-xs ${q.is_active ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {q.is_active ? 'active' : 'suspended'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <button onClick={() => onClearFlags(q.app_id)} className="rounded bg-chatbox-background-secondary px-2 py-1 text-xs font-medium text-chatbox-tint-secondary hover:bg-chatbox-background-secondary-hover transition-colors">
                  Clear flags
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) return <span className="rounded bg-red-900/20 px-2 py-0.5 text-xs text-red-400">suspended</span>
  const colors: Record<string, string> = {
    active: 'bg-green-900/20 text-green-400',
    pending_review: 'bg-yellow-900/20 text-yellow-400',
    rejected: 'bg-red-900/20 text-red-400',
    changes_requested: 'bg-orange-900/20 text-orange-400',
  }
  return <span className={`rounded px-2 py-0.5 text-xs ${colors[status] || 'bg-chatbox-background-secondary text-chatbox-tint-tertiary'}`}>{status}</span>
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/pages/dashboard/MarketplaceSection.tsx
git commit -m "feat: enhance admin marketplace section with review queue and screening tabs"
```

---

### Task 10: Run All Tests & Final Commit

- [ ] **Step 1: Run backend tests**

Run: `cd web/backend && .venv/bin/python -m pytest tests/test_classrooms.py tests/test_marketplace_browse.py tests/test_marketplace_review.py tests/test_marketplace.py -v`
Expected: All tests PASS

- [ ] **Step 2: Run frontend tests**

Run: `cd web/frontend && pnpm vitest run`
Expected: All tests PASS

- [ ] **Step 3: Run full test suite**

Run: `cd web/backend && .venv/bin/python -m pytest -v && cd ../frontend && pnpm vitest run`
Expected: All tests PASS with no regressions

- [ ] **Step 4: Final commit if any remaining changes**

```bash
git add -A
git status
# Only commit if there are unstaged changes
```
