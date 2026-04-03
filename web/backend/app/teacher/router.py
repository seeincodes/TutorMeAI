from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import AppRegistration, ContentFlag, Conversation, Message, OAuthToken, ToolInvocation, User


class CreateFlagRequest(BaseModel):
    app_id: str
    word: str
    reason: str = "blocked_word"
    conversation_id: str | None = None
    timestamp: str | None = None


class UpdateStudentRequest(BaseModel):
    grade: int | None = None
    allowed_levels: list[str] | None = None

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


@router.get("/dashboard")
async def dashboard(
    current_user: User = Depends(require_role("teacher", "admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
):
    # Get students — scoped to teacher's district if they belong to one
    student_query = select(User).where(User.role == "student", User.is_active == True)  # noqa: E712
    if current_user.district_id is not None:
        student_query = student_query.where(User.district_id == current_user.district_id)
    students_result = await db.execute(student_query)
    students = students_result.scalars().all()

    # Get conversation counts per student
    conv_counts = await db.execute(
        select(Conversation.user_id, func.count(Conversation.id))
        .group_by(Conversation.user_id)
    )
    conv_map = dict(conv_counts.all())

    # Get app usage stats
    app_usage = await db.execute(
        select(ToolInvocation.app_id, func.count(ToolInvocation.id))
        .group_by(ToolInvocation.app_id)
    )
    app_stats = dict(app_usage.all())

    # Get all apps
    apps_result = await db.execute(select(AppRegistration))
    apps = apps_result.scalars().all()

    # Get OAuth connections
    oauth_result = await db.execute(
        select(OAuthToken.user_id, OAuthToken.app_id)
    )
    oauth_connections = [{"user_id": str(r[0]), "app_id": r[1]} for r in oauth_result.all()]

    # Get teachers for admin/district_admin
    teachers_list = None
    if current_user.role in ("admin", "district_admin"):
        teacher_query = select(User).where(User.role == "teacher", User.is_active == True)  # noqa: E712
        if current_user.district_id is not None:
            teacher_query = teacher_query.where(User.district_id == current_user.district_id)
        teachers_result = await db.execute(teacher_query)
        teachers = teachers_result.scalars().all()
        teachers_list = [
            {
                "id": str(t.id),
                "username": t.username,
                "display_name": t.display_name,
            }
            for t in teachers
        ]

    result = {
        "students": [
            {
                "id": str(s.id),
                "username": s.username,
                "display_name": s.display_name,
                "grade": s.grade,
                "allowed_levels": s.allowed_levels or [],
                "conversations": conv_map.get(s.id, 0),
            }
            for s in students
        ],
        "apps": [
            {
                "app_id": a.app_id,
                "name": a.name,
                "is_active": a.is_active,
                "status": a.status,
                "usage_count": app_stats.get(a.app_id, 0),
                "trust_tier": a.trust_tier,
                "developer_name": a.developer_name,
            }
            for a in apps
        ],
        "oauth_connections": oauth_connections,
    }
    if teachers_list is not None:
        result["teachers"] = teachers_list
    return result


@router.post("/flags")
async def create_flag(
    body: CreateFlagRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    flag = ContentFlag(
        user_id=current_user.id,
        app_id=body.app_id,
        flagged_content=body.word,
        reason=body.reason,
        conversation_id=body.conversation_id,
    )
    db.add(flag)

    # Increment flag_count and auto-suspend if threshold reached
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == body.app_id)
    )
    app_reg = result.scalar_one_or_none()
    if app_reg:
        app_reg.flag_count = (app_reg.flag_count or 0) + 1
        if app_reg.flag_count >= app_reg.auto_suspend_threshold:
            app_reg.is_active = False

    await db.commit()
    return {"status": "flagged"}


@router.get("/flags")
async def get_flags(
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ContentFlag, User.username, User.display_name)
        .join(User, ContentFlag.user_id == User.id)
        .order_by(ContentFlag.created_at.desc())
        .limit(100)
    )
    flags = []
    for flag, username, display_name in result.all():
        flags.append({
            "id": str(flag.id),
            "username": username,
            "display_name": display_name,
            "app_id": flag.app_id,
            "flagged_content": flag.flagged_content,
            "reason": flag.reason,
            "reviewed": flag.reviewed,
            "created_at": flag.created_at.isoformat() if flag.created_at else None,
        })
    return flags


@router.patch("/flags/{flag_id}/review")
async def review_flag(
    flag_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ContentFlag).where(ContentFlag.id == flag_id))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    flag.reviewed = True
    await db.commit()
    return {"status": "reviewed"}


@router.patch("/students/{student_id}")
async def update_student(
    student_id: str,
    body: UpdateStudentRequest,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == student_id, User.role == "student"))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if body.grade is not None:
        student.grade = body.grade
    if body.allowed_levels is not None:
        student.allowed_levels = body.allowed_levels
    await db.commit()
    return {"id": str(student.id), "grade": student.grade, "allowed_levels": student.allowed_levels}


@router.patch("/apps/{app_id}")
async def toggle_app(
    app_id: str,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    app_reg.is_active = not app_reg.is_active
    await db.commit()
    return {"app_id": app_id, "is_active": app_reg.is_active}
