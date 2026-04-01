from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.schemas import (
    AppResponse,
    InvokeToolRequest,
    RegisterAppRequest,
    UpdateAppStatusRequest,
)
from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import AppRegistration, User

router = APIRouter(prefix="/api/apps", tags=["apps"])


@router.get("")
async def list_apps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AppResponse]:
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.is_active == True)  # noqa: E712
    )
    apps = result.scalars().all()
    return [AppResponse.model_validate(a) for a in apps]


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_app(
    body: RegisterAppRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> AppResponse:
    # Check if app_id already exists
    existing = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == body.app_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="App ID already registered")

    app_reg = AppRegistration(
        app_id=body.app_id,
        name=body.name,
        description=body.description,
        auth_type=body.auth_type,
        iframe_url=body.iframe_url,
        tool_schemas=[ts.model_dump() for ts in body.tool_schemas],
        age_rating=body.age_rating,
        status="active",
        is_active=True,
    )
    db.add(app_reg)
    await db.commit()
    await db.refresh(app_reg)
    return AppResponse.model_validate(app_reg)


@router.patch("/{app_id}")
async def update_app_status(
    app_id: str,
    body: UpdateAppStatusRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> AppResponse:
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    if body.is_active is not None:
        app_reg.is_active = body.is_active
    if body.status is not None:
        app_reg.status = body.status

    await db.commit()
    await db.refresh(app_reg)
    return AppResponse.model_validate(app_reg)


@router.post("/{app_id}/invoke")
async def invoke_tool(
    app_id: str,
    body: InvokeToolRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppRegistration).where(
            AppRegistration.app_id == app_id,
            AppRegistration.is_active == True,  # noqa: E712
        )
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found or inactive")

    # Validate tool name exists in registered schemas
    tool_names = [ts["name"] for ts in app_reg.tool_schemas]
    if body.tool not in tool_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tool '{body.tool}' not registered for app '{app_id}'. Available: {tool_names}",
        )

    # Return the validated invocation for the frontend to dispatch via postMessage
    return {
        "app_id": app_id,
        "tool": body.tool,
        "params": body.params,
        "correlation_id": body.correlation_id,
        "iframe_url": app_reg.iframe_url,
    }
