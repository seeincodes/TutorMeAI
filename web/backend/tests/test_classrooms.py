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
