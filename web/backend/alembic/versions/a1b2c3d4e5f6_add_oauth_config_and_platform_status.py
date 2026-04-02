"""add oauth_config and platform_status to app_registrations

Revision ID: a1b2c3d4e5f6
Revises: 29be9890ff89
Create Date: 2026-04-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '29be9890ff89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

GOOGLE_CLASSROOM_TOOLS = [
    {
        "name": "list_courses",
        "description": "List the teacher's Google Classroom courses",
        "parameters": [],
    },
    {
        "name": "list_assignments",
        "description": "List assignments for a specific course",
        "parameters": [
            {"name": "course_id", "type": "string", "description": "The course ID", "required": True},
        ],
    },
    {
        "name": "get_assignment",
        "description": "Get details for a specific assignment",
        "parameters": [
            {"name": "course_id", "type": "string", "description": "The course ID", "required": True},
            {"name": "assignment_id", "type": "string", "description": "The assignment ID", "required": True},
        ],
    },
    {
        "name": "list_submissions",
        "description": "List student submissions for an assignment (teacher only)",
        "parameters": [
            {"name": "course_id", "type": "string", "description": "The course ID", "required": True},
            {"name": "assignment_id", "type": "string", "description": "The assignment ID", "required": True},
        ],
    },
    {
        "name": "create_assignment",
        "description": "Draft a new assignment for teacher review before creation",
        "parameters": [
            {"name": "course_id", "type": "string", "description": "The course ID", "required": True},
            {"name": "title", "type": "string", "description": "Assignment title", "required": True},
            {"name": "description", "type": "string", "description": "Assignment description/instructions", "required": True},
            {"name": "due_date", "type": "string", "description": "Due date in ISO 8601 format", "required": False},
            {"name": "max_points", "type": "number", "description": "Maximum points for the assignment", "required": False},
        ],
    },
]

GOOGLE_CLASSROOM_OAUTH_CONFIG = {
    "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
    "token_url": "https://oauth2.googleapis.com/token",
    "scopes": [
        "https://www.googleapis.com/auth/classroom.courses.readonly",
        "https://www.googleapis.com/auth/classroom.coursework.me",
        "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
    ],
    "client_id_env_var": "GOOGLE_CLASSROOM_CLIENT_ID",
    "client_secret_env_var": "GOOGLE_CLASSROOM_CLIENT_SECRET",
    "redirect_uri_env_var": "GOOGLE_CLASSROOM_REDIRECT_URI",
}


def upgrade() -> None:
    op.add_column("app_registrations", sa.Column("oauth_config", postgresql.JSONB, nullable=True))
    op.add_column("app_registrations", sa.Column("platform_status", sa.Text(), nullable=True, server_default="allowed"))
    op.add_column("app_registrations", sa.Column("requires_admin_approval", sa.Boolean(), nullable=True, server_default="false"))

    op.execute(sa.text("UPDATE app_registrations SET platform_status = 'allowed' WHERE platform_status IS NULL"))
    op.execute(sa.text("UPDATE app_registrations SET requires_admin_approval = false WHERE requires_admin_approval IS NULL"))

    op.create_check_constraint("ck_app_registrations_platform_status", "app_registrations", "platform_status IN ('allowed', 'blocked', 'pending_review')")

    op.execute(sa.text("UPDATE app_registrations SET platform_status = 'blocked', is_active = false WHERE app_id = 'spotify'"))

    app_registrations = sa.table(
        "app_registrations",
        sa.column("app_id", sa.Text), sa.column("name", sa.Text),
        sa.column("description", sa.Text), sa.column("auth_type", sa.Text),
        sa.column("iframe_url", sa.Text), sa.column("tool_schemas", postgresql.JSONB),
        sa.column("oauth_config", postgresql.JSONB),
        sa.column("platform_status", sa.Text),
        sa.column("requires_admin_approval", sa.Boolean),
        sa.column("status", sa.Text), sa.column("age_rating", sa.Text),
        sa.column("is_active", sa.Boolean),
    )
    op.bulk_insert(app_registrations, [{
        "app_id": "google-classroom",
        "name": "Google Classroom",
        "description": "Access courses, assignments, submissions, and create assignments via Google Classroom. Requires teacher Google account connection.",
        "auth_type": "oauth2",
        "iframe_url": "/apps/google-classroom/index.html",
        "tool_schemas": GOOGLE_CLASSROOM_TOOLS,
        "oauth_config": GOOGLE_CLASSROOM_OAUTH_CONFIG,
        "platform_status": "allowed",
        "requires_admin_approval": True,
        "status": "active",
        "age_rating": "all",
        "is_active": True,
    }])


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id = 'google-classroom'"))
    op.execute(sa.text("UPDATE app_registrations SET platform_status = 'active', is_active = true WHERE app_id = 'spotify'"))
    op.drop_constraint("ck_app_registrations_platform_status", "app_registrations", type_="check")
    op.drop_column("app_registrations", "requires_admin_approval")
    op.drop_column("app_registrations", "platform_status")
    op.drop_column("app_registrations", "oauth_config")
