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
