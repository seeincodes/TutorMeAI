"""Classroom CRUD API router."""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import Classroom, ClassroomMembership, ClassroomAppWhitelist, User

router = APIRouter(prefix="/api/classrooms", tags=["classrooms"])


# ── Schemas ──────────────────────────────────────────────────────────────


class ClassroomCreate(BaseModel):
    name: str


class ClassroomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    teacher_id: str


class MemberAdd(BaseModel):
    student_id: str


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    display_name: str | None


class AppAdd(BaseModel):
    app_id: str


class AppOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    app_id: str


# ── Helpers ──────────────────────────────────────────────────────────────


async def _get_owned_classroom(
    classroom_id: str,
    current_user: User,
    db: AsyncSession,
) -> Classroom:
    """Return the classroom if it exists and belongs to the current teacher/admin."""
    try:
        cid = uuid.UUID(classroom_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    result = await db.execute(select(Classroom).where(Classroom.id == cid))
    classroom = result.scalar_one_or_none()
    if classroom is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    # Admins can access any classroom; teachers only their own
    if current_user.role != "admin" and classroom.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your classroom")

    return classroom


# ── Classroom endpoints ───────────────────────────────────────────────────


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ClassroomOut)
async def create_classroom(
    body: ClassroomCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> ClassroomOut:
    classroom = Classroom(name=body.name, teacher_id=current_user.id)
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return ClassroomOut(
        id=str(classroom.id),
        name=classroom.name,
        teacher_id=str(classroom.teacher_id),
    )


@router.get("", response_model=List[ClassroomOut])
async def list_classrooms(
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> List[ClassroomOut]:
    if current_user.role == "admin":
        result = await db.execute(select(Classroom))
    else:
        result = await db.execute(
            select(Classroom).where(Classroom.teacher_id == current_user.id)
        )
    classrooms = result.scalars().all()
    return [
        ClassroomOut(id=str(c.id), name=c.name, teacher_id=str(c.teacher_id))
        for c in classrooms
    ]


# ── Member endpoints ──────────────────────────────────────────────────────


@router.post("/{classroom_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    classroom_id: str,
    body: MemberAdd,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    classroom = await _get_owned_classroom(classroom_id, current_user, db)

    try:
        student_uuid = uuid.UUID(body.student_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Verify student exists
    student_result = await db.execute(select(User).where(User.id == student_uuid))
    student = student_result.scalar_one_or_none()
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    membership = ClassroomMembership(classroom_id=classroom.id, student_id=student_uuid)
    db.add(membership)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student already in classroom",
        )

    return {"detail": "Student added"}


@router.get("/{classroom_id}/members", response_model=List[MemberOut])
async def list_members(
    classroom_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> List[MemberOut]:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)

    result = await db.execute(
        select(User)
        .join(ClassroomMembership, ClassroomMembership.student_id == User.id)
        .where(ClassroomMembership.classroom_id == classroom.id)
    )
    students = result.scalars().all()
    return [
        MemberOut(id=str(s.id), username=s.username, display_name=s.display_name)
        for s in students
    ]


@router.delete("/{classroom_id}/members/{student_id}")
async def remove_member(
    classroom_id: str,
    student_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    classroom = await _get_owned_classroom(classroom_id, current_user, db)

    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    await db.execute(
        delete(ClassroomMembership).where(
            ClassroomMembership.classroom_id == classroom.id,
            ClassroomMembership.student_id == student_uuid,
        )
    )
    await db.commit()
    return {"detail": "Student removed"}


# ── App whitelist endpoints ───────────────────────────────────────────────


@router.post("/{classroom_id}/apps", status_code=status.HTTP_201_CREATED)
async def whitelist_app(
    classroom_id: str,
    body: AppAdd,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    classroom = await _get_owned_classroom(classroom_id, current_user, db)

    entry = ClassroomAppWhitelist(
        classroom_id=classroom.id,
        app_id=body.app_id,
        added_by=current_user.id,
    )
    db.add(entry)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="App already whitelisted",
        )
    return {"detail": "App whitelisted"}


@router.delete("/{classroom_id}/apps/{app_id}")
async def remove_app(
    classroom_id: str,
    app_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    classroom = await _get_owned_classroom(classroom_id, current_user, db)

    await db.execute(
        delete(ClassroomAppWhitelist).where(
            ClassroomAppWhitelist.classroom_id == classroom.id,
            ClassroomAppWhitelist.app_id == app_id,
        )
    )
    await db.commit()
    return {"detail": "App removed"}


@router.get("/{classroom_id}/apps", response_model=List[AppOut])
async def list_apps(
    classroom_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
) -> List[AppOut]:
    classroom = await _get_owned_classroom(classroom_id, current_user, db)

    result = await db.execute(
        select(ClassroomAppWhitelist).where(
            ClassroomAppWhitelist.classroom_id == classroom.id
        )
    )
    entries = result.scalars().all()
    return [AppOut(app_id=e.app_id) for e in entries]
