from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.schemas import (
    AppResponse,
    InvokeToolRequest,
    RegisterAppRequest,
    UpdateAppStatusRequest,
)
import time

from app.apps.schema_hash import compute_schema_hash
from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import AppRegistration, AppSchemaAudit, DistrictAppApproval, ToolInvocation, User
from app.rate_limit import limiter

router = APIRouter(prefix="/api/apps", tags=["apps"])


def _per_app_key(request: Request) -> str:
    """Rate limit key combining user IP + app_id for per-app throttling."""
    ip = get_remote_address(request)
    app_id = request.path_params.get("app_id", "unknown")
    return f"{ip}:{app_id}"


@router.get("")
async def list_apps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AppResponse]:
    query = select(AppRegistration).where(AppRegistration.is_active == True)  # noqa: E712

    # If user belongs to a district, filter to only district-approved apps
    if current_user.district_id is not None:
        approved_app_ids = (
            select(DistrictAppApproval.app_id)
            .where(
                DistrictAppApproval.district_id == current_user.district_id,
                DistrictAppApproval.status == "approved",
            )
        )
        query = query.where(AppRegistration.app_id.in_(approved_app_ids))

    result = await db.execute(query)
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

    schemas_list = [ts.model_dump() for ts in body.tool_schemas]
    schema_hash = compute_schema_hash(schemas_list)

    app_reg = AppRegistration(
        app_id=body.app_id,
        name=body.name,
        description=body.description,
        auth_type=body.auth_type,
        iframe_url=body.iframe_url,
        tool_schemas=schemas_list,
        schema_hash=schema_hash,
        schema_version=1,
        age_rating=body.age_rating,
        status="active",
        is_active=True,
    )

    # Create initial audit trail entry
    audit = AppSchemaAudit(
        app_id=body.app_id,
        old_schema=None,
        new_schema=schemas_list,
        old_hash=None,
        new_hash=schema_hash,
        reviewed_by=current_user.id,
        decision="approved",
        reason="Initial registration",
    )
    db.add(audit)
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
@limiter.limit("30/minute", key_func=_per_app_key)
async def invoke_tool(
    request: Request,
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

    # Schema integrity check: recompute hash and auto-suspend on mismatch
    if app_reg.schema_hash:
        current_hash = compute_schema_hash(app_reg.tool_schemas)
        if current_hash != app_reg.schema_hash:
            app_reg.is_active = False
            audit = AppSchemaAudit(
                app_id=app_id,
                old_schema=None,
                new_schema=app_reg.tool_schemas,
                old_hash=app_reg.schema_hash,
                new_hash=current_hash,
                decision="auto_suspended",
                reason="Schema hash mismatch detected at invocation time",
            )
            db.add(audit)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"App '{app_id}' suspended: schema integrity check failed",
            )

    # Validate tool name exists in registered schemas
    tool_names = [ts["name"] for ts in app_reg.tool_schemas]
    if body.tool not in tool_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tool '{body.tool}' not registered for app '{app_id}'. Available: {tool_names}",
        )

    # Log tool invocation (if conversation context is available)
    if body.conversation_id:
        start_time = time.monotonic()
        invocation = ToolInvocation(
            conversation_id=body.conversation_id,
            app_id=app_id,
            tool_name=body.tool,
            params=body.params,
            status="success",
            duration_ms=int((time.monotonic() - start_time) * 1000),
        )
        db.add(invocation)
        await db.commit()

    # Return the validated invocation for the frontend to dispatch via postMessage
    return {
        "app_id": app_id,
        "tool": body.tool,
        "params": body.params,
        "correlation_id": body.correlation_id,
        "iframe_url": app_reg.iframe_url,
    }
