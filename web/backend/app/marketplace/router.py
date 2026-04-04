from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import logging

from app.apps.schema_hash import compute_schema_hash
from app.apps.schemas import ToolSchema
from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.marketplace.ai_review import review_app_submission, AIReviewResult
from app.models import AppContentScreen, AppRegistration, ToolInvocation, User

logger = logging.getLogger("chatbridge.marketplace")

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
    ai_review: dict | None = None

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

    # Run AI review before saving
    logger.info(f"Running AI review for app submission: {body.app_id}")
    ai_result: AIReviewResult = await review_app_submission(
        app_id=body.app_id,
        name=body.name,
        description=body.description,
        tool_schemas=schemas_list,
        auth_type=body.auth_type,
        oauth_config=None,
        developer_name=body.developer_name,
        developer_email=body.developer_email,
        website_url=body.website_url,
        privacy_policy_url=body.privacy_policy_url,
        age_rating=body.age_rating,
    )
    logger.info(f"AI review for {body.app_id}: {ai_result.decision} — {ai_result.reasoning}")

    # Set status based on AI decision
    if ai_result.decision == "approve":
        app_status = "active"
        is_active = True
        trust_tier = "classroom"  # Start at classroom tier, admin can upgrade
    elif ai_result.decision == "reject":
        app_status = "rejected"
        is_active = False
        trust_tier = "new"
    else:  # human_review
        app_status = "pending_review"
        is_active = False
        trust_tier = "new"

    app_reg = AppRegistration(
        app_id=body.app_id,
        name=body.name,
        description=body.description,
        auth_type=body.auth_type,
        iframe_url=body.iframe_url,
        tool_schemas=schemas_list,
        schema_hash=schema_hash,
        schema_version=1,
        status=app_status,
        platform_status="allowed" if ai_result.decision == "approve" else "pending_review",
        is_active=is_active,
        trust_tier=trust_tier,
        developer_name=body.developer_name,
        developer_email=body.developer_email,
        website_url=body.website_url,
        privacy_policy_url=body.privacy_policy_url,
        logo_url=body.logo_url,
        age_rating=ai_result.age_rating if ai_result.decision == "approve" else body.age_rating,
    )
    db.add(app_reg)

    # Save the AI review as a content screen record
    screen = AppContentScreen(
        app_id=body.app_id,
        screen_type="ai_submission_review",
        result="pass" if ai_result.decision == "approve" else "fail" if ai_result.decision == "reject" else "review_needed",
        flagged=ai_result.risk_level in ("high", "critical"),
        details={
            "decision": ai_result.decision,
            "risk_level": ai_result.risk_level,
            "risk_flags": ai_result.risk_flags,
            "reasoning": ai_result.reasoning,
            "content_safe": ai_result.content_safe,
            "tools_safe": ai_result.tools_safe,
            "auth_appropriate": ai_result.auth_appropriate,
            "educational_value": ai_result.educational_value,
            "suggested_min_grade": ai_result.suggested_min_grade,
            "suggested_max_grade": ai_result.suggested_max_grade,
        },
    )
    db.add(screen)

    await db.commit()
    await db.refresh(app_reg)

    return SubmitAppResponse(
        app_id=app_reg.app_id,
        name=app_reg.name,
        status=app_reg.status,
        trust_tier=app_reg.trust_tier,
        ai_review={
            "decision": ai_result.decision,
            "reasoning": ai_result.reasoning,
            "risk_level": ai_result.risk_level,
            "risk_flags": ai_result.risk_flags,
            "age_rating": ai_result.age_rating,
            "educational_value": ai_result.educational_value,
        },
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


@router.get("/screening-queue")
async def screening_queue(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """List apps with pending content screens or high flag counts."""
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.flag_count > 0).order_by(AppRegistration.flag_count.desc())
    )
    apps = result.scalars().all()
    return [
        {
            "app_id": a.app_id,
            "name": a.name,
            "flag_count": a.flag_count,
            "auto_suspend_threshold": a.auto_suspend_threshold,
            "is_active": a.is_active,
        }
        for a in apps
    ]


@router.get("/{app_id}/review")
async def get_ai_review(
    app_id: str,
    current_user: User = Depends(require_role("admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get the AI review details for an app."""
    result = await db.execute(
        select(AppContentScreen).where(
            AppContentScreen.app_id == app_id,
            AppContentScreen.screen_type == "ai_submission_review",
        ).order_by(AppContentScreen.created_at.desc())
    )
    screen = result.scalar_one_or_none()
    if not screen:
        raise HTTPException(status_code=404, detail="No AI review found for this app")
    return {
        "app_id": app_id,
        "result": screen.result,
        "flagged": screen.flagged,
        "details": screen.details,
        "reviewed_at": str(screen.created_at),
    }


@router.post("/{app_id}/approve")
async def admin_approve_app(
    app_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin manually approves a pending app (overrides AI decision)."""
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=404, detail="App not found")

    app_reg.status = "active"
    app_reg.platform_status = "allowed"
    app_reg.is_active = True
    app_reg.approved_by = current_user.id
    from datetime import datetime, timezone
    app_reg.approved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"app_id": app_id, "status": "active", "approved_by": str(current_user.id)}


@router.post("/{app_id}/reject")
async def admin_reject_app(
    app_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin manually rejects a pending app."""
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=404, detail="App not found")

    app_reg.status = "rejected"
    app_reg.platform_status = "blocked"
    app_reg.is_active = False
    await db.commit()
    return {"app_id": app_id, "status": "rejected"}


@router.post("/{app_id}/clear-flags")
async def clear_flags(
    app_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Reset an app's flag count and reactivate it."""
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app_reg = result.scalar_one_or_none()
    if not app_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found")

    app_reg.flag_count = 0
    app_reg.is_active = True
    await db.commit()
    return {"app_id": app_id, "flag_count": 0, "is_active": True}
