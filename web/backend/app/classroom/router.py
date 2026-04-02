import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.oauth.router import get_oauth_token

router = APIRouter(prefix="/api/classroom", tags=["classroom"])

GOOGLE_CLASSROOM_API = "https://classroom.googleapis.com/v1"


async def _get_classroom_token(user: User, db: AsyncSession) -> str:
    token = await get_oauth_token(str(user.id), "google-classroom", db)
    if not token:
        raise HTTPException(status_code=400, detail="Google Classroom not connected. Please connect your account first.")
    return token


def _require_teacher(user: User):
    if user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can access this resource")


def _strip_student_pii(submissions: list[dict]) -> dict:
    total = len(submissions)
    turned_in = sum(1 for s in submissions if s.get("state") == "TURNED_IN")
    late = sum(1 for s in submissions if s.get("late", False))
    missing = total - turned_in
    return {
        "total_students": total,
        "submitted": turned_in,
        "late": late,
        "missing": missing,
    }


@router.get("/courses")
async def list_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token = await _get_classroom_token(current_user, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_CLASSROOM_API}/courses",
            params={"teacherId": "me", "courseStates": "ACTIVE"},
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch courses from Google Classroom")

    courses = resp.json().get("courses", [])
    return [
        {
            "id": c["id"],
            "name": c.get("name", ""),
            "section": c.get("section", ""),
            "description": c.get("descriptionHeading", ""),
            "room": c.get("room", ""),
        }
        for c in courses
    ]


@router.get("/courses/{course_id}/assignments")
async def list_assignments(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token = await _get_classroom_token(current_user, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_CLASSROOM_API}/courses/{course_id}/courseWork",
            params={"orderBy": "dueDate desc"},
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch assignments")

    assignments = resp.json().get("courseWork", [])
    return [
        {
            "id": a["id"],
            "title": a.get("title", ""),
            "description": a.get("description", ""),
            "state": a.get("state", ""),
            "max_points": a.get("maxPoints"),
            "due_date": a.get("dueDate"),
            "due_time": a.get("dueTime"),
            "creation_time": a.get("creationTime"),
        }
        for a in assignments
    ]


@router.get("/courses/{course_id}/assignments/{assignment_id}")
async def get_assignment(
    course_id: str,
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    token = await _get_classroom_token(current_user, db)
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_CLASSROOM_API}/courses/{course_id}/courseWork/{assignment_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch assignment")

    a = resp.json()
    return {
        "id": a["id"],
        "title": a.get("title", ""),
        "description": a.get("description", ""),
        "state": a.get("state", ""),
        "max_points": a.get("maxPoints"),
        "due_date": a.get("dueDate"),
        "due_time": a.get("dueTime"),
        "materials": a.get("materials", []),
        "creation_time": a.get("creationTime"),
    }


@router.get("/courses/{course_id}/assignments/{assignment_id}/submissions")
async def list_submissions(
    course_id: str,
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_teacher(current_user)
    token = await _get_classroom_token(current_user, db)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_CLASSROOM_API}/courses/{course_id}/courseWork/{assignment_id}/studentSubmissions",
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Failed to fetch submissions")

    submissions = resp.json().get("studentSubmissions", [])

    aggregate = _strip_student_pii(submissions)
    return {
        "aggregate": aggregate,
        "submissions": [
            {
                "id": s["id"],
                "state": s.get("state", ""),
                "late": s.get("late", False),
                "assigned_grade": s.get("assignedGrade"),
                "user_id": s.get("userId", ""),
            }
            for s in submissions
        ],
    }


class CreateAssignmentRequest(BaseModel):
    title: str
    description: str
    due_date: str | None = None
    max_points: float | None = None
    confirmed: bool = False


@router.post("/courses/{course_id}/assignments")
async def create_assignment(
    course_id: str,
    body: CreateAssignmentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_teacher(current_user)

    if not body.confirmed:
        return {
            "status": "preview",
            "assignment": {
                "title": body.title,
                "description": body.description,
                "due_date": body.due_date,
                "max_points": body.max_points,
            },
        }

    token = await _get_classroom_token(current_user, db)

    course_work = {
        "title": body.title,
        "description": body.description,
        "workType": "ASSIGNMENT",
        "state": "PUBLISHED",
    }
    if body.max_points is not None:
        course_work["maxPoints"] = body.max_points
    if body.due_date:
        try:
            from datetime import date as date_type
            d = date_type.fromisoformat(body.due_date[:10])
            course_work["dueDate"] = {"year": d.year, "month": d.month, "day": d.day}
            course_work["dueTime"] = {"hours": 23, "minutes": 59}
        except ValueError:
            pass

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GOOGLE_CLASSROOM_API}/courses/{course_id}/courseWork",
            json=course_work,
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail="Failed to create assignment in Google Classroom")

    created = resp.json()
    return {
        "status": "created",
        "assignment": {
            "id": created["id"],
            "title": created.get("title", ""),
            "link": created.get("alternateLink", ""),
        },
    }
