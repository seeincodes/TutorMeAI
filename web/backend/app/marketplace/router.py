from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apps.schema_hash import compute_schema_hash
from app.apps.schemas import ToolSchema
from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import AppRegistration, ToolInvocation, User

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


# ── Schemas ──────────────────────────────────────────────────────────────


class SubmitAppRequest(BaseModel):
    app_id: str
    name: str
    description: str
    iframe_url: str
    tool_schemas: list[ToolSchema]
    developer_name: str
    developer_email: str
    auth_type: str = "none"
    website_url: str | None = None
    privacy_policy_url: str | None = None
    logo_url: str | None = None
    age_rating: str = "all"


class SubmitAppResponse(BaseModel):
    app_id: str
    name: str
    status: str
    trust_tier: str

    model_config = {"from_attributes": True}


class UpdateTrustTierRequest(BaseModel):
    trust_tier: str


class CatalogAppResponse(BaseModel):
    app_id: str
    name: str
    description: str
    status: str
    trust_tier: str
    developer_name: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class AnalyticsResponse(BaseModel):
    app_id: str
    usage_count: int
    unique_users: int
    avg_duration_ms: float | None
    error_rate: float


# ── Endpoints ────────────────────────────────────────────────────────────


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_app(
    body: SubmitAppRequest,
    db: AsyncSession = Depends(get_db),
) -> SubmitAppResponse:
    """Public endpoint for developers to submit apps for review."""
    # Check for duplicate
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == body.app_id)
    )
    if result.scalar_one_or_none():
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
        status="pending_review",
        is_active=False,
        trust_tier="new",
        developer_name=body.developer_name,
        developer_email=body.developer_email,
        website_url=body.website_url,
        privacy_policy_url=body.privacy_policy_url,
        logo_url=body.logo_url,
        age_rating=body.age_rating,
    )
    db.add(app_reg)
    await db.commit()
    await db.refresh(app_reg)
    return SubmitAppResponse(
        app_id=app_reg.app_id,
        name=app_reg.name,
        status=app_reg.status,
        trust_tier=app_reg.trust_tier,
    )


@router.patch("/{app_id}/trust")
async def update_trust_tier(
    app_id: str,
    body: UpdateTrustTierRequest,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin-only: update an app's trust tier."""
    valid_tiers = ("new", "classroom", "school", "district", "verified")
    if body.trust_tier not in valid_tiers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid trust tier. Must be one of: {valid_tiers}",
        )

    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    app_reg.trust_tier = body.trust_tier
    await db.commit()
    return {"app_id": app_id, "trust_tier": body.trust_tier}


@router.get("/{app_id}/analytics")
async def get_analytics(
    app_id: str,
    current_user: User = Depends(require_role("admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsResponse:
    """Usage analytics for a specific app."""
    # Verify app exists
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    # Aggregate from tool_invocations
    stats = await db.execute(
        select(
            func.count(ToolInvocation.id).label("usage_count"),
            func.count(func.distinct(ToolInvocation.conversation_id)).label("unique_users"),
            func.avg(ToolInvocation.duration_ms).label("avg_duration_ms"),
        ).where(ToolInvocation.app_id == app_id)
    )
    row = stats.one()

    # Error rate
    total = row.usage_count or 0
    if total > 0:
        error_count_result = await db.execute(
            select(func.count(ToolInvocation.id)).where(
                ToolInvocation.app_id == app_id,
                ToolInvocation.status == "error",
            )
        )
        error_count = error_count_result.scalar() or 0
        error_rate = error_count / total
    else:
        error_rate = 0.0

    return AnalyticsResponse(
        app_id=app_id,
        usage_count=total,
        unique_users=row.unique_users or 0,
        avg_duration_ms=float(row.avg_duration_ms) if row.avg_duration_ms else None,
        error_rate=error_rate,
    )


@router.get("/catalog")
async def list_catalog(
    current_user: User = Depends(require_role("admin", "district_admin", "teacher")),
    db: AsyncSession = Depends(get_db),
) -> list[CatalogAppResponse]:
    """Browse all apps in the marketplace (including pending_review)."""
    result = await db.execute(select(AppRegistration))
    apps = result.scalars().all()
    return [
        CatalogAppResponse(
            app_id=a.app_id,
            name=a.name,
            description=a.description,
            status=a.status,
            trust_tier=a.trust_tier,
            developer_name=a.developer_name,
            is_active=a.is_active,
        )
        for a in apps
    ]
