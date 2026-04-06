"""add schools, classrooms tables and school_id to users

Revision ID: m8h9i0j1k2l3
Revises: 29468b5ece2f
Create Date: 2026-04-05 22:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "m8h9i0j1k2l3"
down_revision: Union[str, Sequence[str], None] = "29468b5ece2f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Create schools table ──────────────────────────────────────────
    op.create_table(
        "schools",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("district_id", UUID(as_uuid=True), sa.ForeignKey("districts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── Create classrooms table ───────────────────────────────────────
    op.create_table(
        "classrooms",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("teacher_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("school_id", UUID(as_uuid=True), sa.ForeignKey("schools.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── Create classroom_memberships table ────────────────────────────
    op.create_table(
        "classroom_memberships",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("classroom_id", UUID(as_uuid=True), sa.ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("classroom_id", "student_id", name="uq_classroom_memberships_classroom_student"),
    )

    # ── Create classroom_app_whitelist table ──────────────────────────
    op.create_table(
        "classroom_app_whitelist",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("classroom_id", UUID(as_uuid=True), sa.ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("app_id", sa.Text(), nullable=False),
        sa.Column("added_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("classroom_id", "app_id", name="uq_classroom_app_whitelist_classroom_app"),
    )

    # ── Add school_id to users ────────────────────────────────────────
    op.add_column("users", sa.Column("school_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_users_school_id", "users", "schools", ["school_id"], ["id"])

    # ── Composite indexes ─────────────────────────────────────────────
    op.create_index("ix_users_district_role", "users", ["district_id", "role"])
    op.create_index("ix_classroom_memberships_student_id", "classroom_memberships", ["student_id"])
    op.create_index("ix_classroom_app_whitelist_app_id", "classroom_app_whitelist", ["app_id"])
    op.create_index("ix_tool_invocations_app_id", "tool_invocations", ["app_id"])


def downgrade() -> None:
    op.drop_index("ix_tool_invocations_app_id")
    op.drop_index("ix_classroom_app_whitelist_app_id")
    op.drop_index("ix_classroom_memberships_student_id")
    op.drop_index("ix_users_district_role")
    op.drop_constraint("fk_users_school_id", "users", type_="foreignkey")
    op.drop_column("users", "school_id")
    op.drop_table("classroom_app_whitelist")
    op.drop_table("classroom_memberships")
    op.drop_table("classrooms")
    op.drop_table("schools")
