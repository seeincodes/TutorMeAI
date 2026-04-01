from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.database import get_db
from app.models import AppRegistration, Conversation, Message, OAuthToken, ToolInvocation, User

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


@router.get("/dashboard")
async def dashboard(
    current_user: User = Depends(require_role("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    # Get all students
    students_result = await db.execute(
        select(User).where(User.role == "student", User.is_active == True)  # noqa: E712
    )
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

    return {
        "students": [
            {
                "id": str(s.id),
                "username": s.username,
                "display_name": s.display_name,
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
            }
            for a in apps
        ],
        "oauth_connections": oauth_connections,
    }


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
