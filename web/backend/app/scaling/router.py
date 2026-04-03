from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import District, User

router = APIRouter(prefix="/api/scaling", tags=["scaling"])


@router.get("/token-budget")
async def check_token_budget(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Check the current user's district token budget."""
    if current_user.district_id is None:
        return {"allowed": True, "remaining": None, "message": "No district budget applies"}

    result = await db.execute(
        select(District).where(District.id == current_user.district_id)
    )
    district = result.scalar_one_or_none()
    if not district:
        return {"allowed": True, "remaining": None, "message": "District not found"}

    remaining = max(0, district.daily_token_budget - district.tokens_used_today)
    return {
        "allowed": remaining > 0,
        "remaining": remaining,
        "daily_budget": district.daily_token_budget,
        "used_today": district.tokens_used_today,
    }
