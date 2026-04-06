"""School model and district-scoping tests."""
import pytest
from sqlalchemy import select
from app.database import get_session_factory


@pytest.mark.asyncio
async def test_school_creation():
    """School can be created within a district."""
    from app.models import School, District

    sf = get_session_factory()
    async with sf() as s:
        d = District(name="Test District", state="CA")
        s.add(d)
        await s.flush()

        school = School(name="Lincoln Elementary", district_id=d.id)
        s.add(school)
        await s.commit()
        await s.refresh(school)

        assert school.name == "Lincoln Elementary"
        assert school.district_id == d.id
        assert school.id is not None

        await s.delete(school)
        await s.delete(d)
        await s.commit()


@pytest.mark.asyncio
async def test_user_can_have_school_id():
    """User model accepts optional school_id."""
    from app.models import School, District, User

    sf = get_session_factory()
    async with sf() as s:
        d = District(name="School Test District", state="NY")
        s.add(d)
        await s.flush()

        school = School(name="PS 101", district_id=d.id)
        s.add(school)
        await s.flush()

        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        teacher.district_id = d.id
        teacher.school_id = school.id
        await s.commit()
        await s.refresh(teacher)

        assert teacher.school_id == school.id

        # Cleanup
        teacher.district_id = None
        teacher.school_id = None
        await s.commit()
        await s.delete(school)
        await s.delete(d)
        await s.commit()


@pytest.mark.asyncio
async def test_classroom_can_have_school_id():
    """Classroom model accepts optional school_id."""
    from app.models import Classroom, School, District, User

    sf = get_session_factory()
    async with sf() as s:
        d = District(name="Classroom School District", state="TX")
        s.add(d)
        await s.flush()

        school = School(name="Austin High", district_id=d.id)
        s.add(school)
        await s.flush()

        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        c = Classroom(name="Biology", teacher_id=teacher.id, school_id=school.id)
        s.add(c)
        await s.commit()
        await s.refresh(c)

        assert c.school_id == school.id

        await s.delete(c)
        await s.delete(school)
        await s.delete(d)
        await s.commit()


@pytest.mark.asyncio
async def test_district_isolation_blocks_cross_district_member(teacher_client):
    """Cannot add a student from a different district to a classroom."""
    from app.models import User, District
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        # Create two districts
        d1 = District(name="District A", state="CA")
        d2 = District(name="District B", state="NY")
        s.add_all([d1, d2])
        await s.flush()

        # Put teacher1 in district A, student2 in district B
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        student2 = (await s.execute(select(User).where(User.username == "student2"))).scalar_one()
        teacher.district_id = d1.id
        student2.district_id = d2.id
        await s.commit()

        student2_id = str(student2.id)

    # Teacher creates classroom
    cr = await teacher_client.post("/api/classrooms", json={"name": "Isolated Class"})
    classroom_id = cr.json()["id"]

    # Try to add cross-district student — should fail
    resp = await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student2_id})
    assert resp.status_code == 403
    assert "different district" in resp.json()["detail"]

    # Cleanup
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        student2 = (await s.execute(select(User).where(User.username == "student2"))).scalar_one()
        teacher.district_id = None
        student2.district_id = None
        await s.commit()


@pytest.mark.asyncio
async def test_same_district_member_allowed(teacher_client):
    """Can add a student from the same district."""
    from app.models import User, District
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        d = District(name="Same District", state="IL")
        s.add(d)
        await s.flush()

        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        student1 = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        teacher.district_id = d.id
        student1.district_id = d.id
        await s.commit()

        student1_id = str(student1.id)

    cr = await teacher_client.post("/api/classrooms", json={"name": "Same District Class"})
    classroom_id = cr.json()["id"]

    resp = await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student1_id})
    assert resp.status_code == 201

    # Cleanup
    async with sf() as s:
        teacher = (await s.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        student1 = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        teacher.district_id = None
        student1.district_id = None
        await s.commit()


@pytest.mark.asyncio
async def test_no_district_users_bypass_check(teacher_client):
    """Users without district_id can still be added (backward compat)."""
    from app.models import User
    from app.database import get_session_factory
    from sqlalchemy import select

    sf = get_session_factory()
    async with sf() as s:
        student1 = (await s.execute(select(User).where(User.username == "student1"))).scalar_one()
        student1_id = str(student1.id)

    cr = await teacher_client.post("/api/classrooms", json={"name": "No District Class"})
    classroom_id = cr.json()["id"]

    # Both teacher and student have no district — should work
    resp = await teacher_client.post(f"/api/classrooms/{classroom_id}/members", json={"student_id": student1_id})
    assert resp.status_code == 201
