from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.database import get_db
from app.models import ToolInvocation, User

router = APIRouter(prefix="/api/observability", tags=["observability"])


@router.get("/app-health")
async def app_health(
    current_user: User = Depends(require_role("admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Per-app health metrics: invocation counts, success/error/timeout rates, avg duration."""
    result = await db.execute(
        select(
            ToolInvocation.app_id,
            func.count(ToolInvocation.id).label("invocation_count"),
            func.count(ToolInvocation.id).filter(ToolInvocation.status == "success").label("success_count"),
            func.count(ToolInvocation.id).filter(ToolInvocation.status == "error").label("error_count"),
            func.count(ToolInvocation.id).filter(ToolInvocation.status == "timeout").label("timeout_count"),
            func.avg(ToolInvocation.duration_ms).label("avg_duration_ms"),
        ).group_by(ToolInvocation.app_id)
    )

    return [
        {
            "app_id": row.app_id,
            "invocation_count": row.invocation_count,
            "success_count": row.success_count,
            "error_count": row.error_count,
            "timeout_count": row.timeout_count,
            "avg_duration_ms": float(row.avg_duration_ms) if row.avg_duration_ms else None,
        }
        for row in result.all()
    ]


@router.get("/cost-dashboard")
async def cost_dashboard(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Token usage summary: totals and per-app breakdown."""
    # Totals
    totals = await db.execute(
        select(
            func.coalesce(func.sum(ToolInvocation.input_tokens), 0).label("total_input"),
            func.coalesce(func.sum(ToolInvocation.output_tokens), 0).label("total_output"),
        )
    )
    total_row = totals.one()

    # Per-app breakdown
    per_app = await db.execute(
        select(
            ToolInvocation.app_id,
            func.coalesce(func.sum(ToolInvocation.input_tokens), 0).label("input_tokens"),
            func.coalesce(func.sum(ToolInvocation.output_tokens), 0).label("output_tokens"),
            func.count(ToolInvocation.id).label("invocation_count"),
        ).group_by(ToolInvocation.app_id)
    )

    return {
        "total_input_tokens": total_row.total_input,
        "total_output_tokens": total_row.total_output,
        "per_app": [
            {
                "app_id": row.app_id,
                "input_tokens": row.input_tokens,
                "output_tokens": row.output_tokens,
                "invocation_count": row.invocation_count,
            }
            for row in per_app.all()
        ],
    }
