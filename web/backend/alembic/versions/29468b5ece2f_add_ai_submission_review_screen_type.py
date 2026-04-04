"""add ai_submission_review screen type

Revision ID: 29468b5ece2f
Revises: e748e8170bb2
Create Date: 2026-04-04 11:02:14.116120

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '29468b5ece2f'
down_revision: Union[str, Sequence[str], None] = 'e748e8170bb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE app_content_screens DROP CONSTRAINT IF EXISTS ck_app_content_screens_type"))
    op.execute(sa.text(
        "ALTER TABLE app_content_screens ADD CONSTRAINT ck_app_content_screens_type "
        "CHECK (screen_type IN ('moderation_api', 'screenshot_diff', 'manual_review', 'ai_submission_review'))"
    ))


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE app_content_screens DROP CONSTRAINT IF EXISTS ck_app_content_screens_type"))
    op.execute(sa.text(
        "ALTER TABLE app_content_screens ADD CONSTRAINT ck_app_content_screens_type "
        "CHECK (screen_type IN ('moderation_api', 'screenshot_diff', 'manual_review'))"
    ))
