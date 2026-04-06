from fastapi import APIRouter, Depends, HTTPException, Request, status
import httpx

from app.auth.dependencies import get_current_user
from app.config import settings
from app.models import User
from app.rate_limit import limiter

router = APIRouter(prefix="/api/nasa", tags=["nasa"])

NASA_APOD_URL = "https://api.nasa.gov/planetary/apod"


@router.get("/apod")
@limiter.limit("30/minute")
async def get_apod(
    request: Request,
    date: str | None = None,
    current_user: User = Depends(get_current_user),
):
    params = {"api_key": settings.nasa_api_key}
    if date:
        params["date"] = date

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(NASA_APOD_URL, params=params)
            resp.raise_for_status()
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="NASA API timed out",
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="NASA API rate limit exceeded. Try again later.",
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"NASA API error: {exc.response.status_code}",
            )

    return resp.json()
