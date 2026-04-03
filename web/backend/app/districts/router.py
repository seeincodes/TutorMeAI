from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models import District, DistrictAppApproval, User

router = APIRouter(prefix="/api/districts", tags=["districts"])


class DistrictResponse(BaseModel):
    id: str
    name: str
    state: str | None = None

    model_config = {"from_attributes": True}


class ApproveAppRequest(BaseModel):
    app_id: str


class DistrictAppApprovalResponse(BaseModel):
    app_id: str
    status: str


@router.get("")
async def list_districts(
    current_user: User = Depends(require_role("admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
) -> list[DistrictResponse]:
    result = await db.execute(select(District))
    districts = result.scalars().all()
    return [DistrictResponse(id=str(d.id), name=d.name, state=d.state) for d in districts]


@router.post("/{district_id}/apps", status_code=status.HTTP_201_CREATED)
async def approve_app_for_district(
    district_id: str,
    body: ApproveAppRequest,
    current_user: User = Depends(require_role("admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
) -> DistrictAppApprovalResponse:
    # Verify district exists
    result = await db.execute(select(District).where(District.id == district_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="District not found")

    # Check for existing approval
    result = await db.execute(
        select(DistrictAppApproval).where(
            DistrictAppApproval.district_id == district_id,
            DistrictAppApproval.app_id == body.app_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.status = "approved"
        await db.commit()
        return DistrictAppApprovalResponse(app_id=body.app_id, status="approved")

    approval = DistrictAppApproval(
        district_id=district_id,
        app_id=body.app_id,
        approved_by=current_user.id,
        status="approved",
    )
    db.add(approval)
    await db.commit()
    return DistrictAppApprovalResponse(app_id=body.app_id, status="approved")


@router.delete("/{district_id}/apps/{app_id}")
async def revoke_app_for_district(
    district_id: str,
    app_id: str,
    current_user: User = Depends(require_role("admin", "district_admin")),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(DistrictAppApproval).where(
            DistrictAppApproval.district_id == district_id,
            DistrictAppApproval.app_id == app_id,
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="App approval not found")

    approval.status = "revoked"
    await db.commit()
    return {"status": "revoked"}
