"""add content screening: flag_count, auto_suspend_threshold, app_content_screens table

Revision ID: i4d5e6f7g8h9
Revises: h3c4d5e6f7g8
Create Date: 2026-04-03 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = 'i4d5e6f7g8h9'
down_revision: Union[str, Sequence[str], None] = 'h3c4d5e6f7g8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add flag_count and auto_suspend_threshold to app_registrations
    op.add_column('app_registrations', sa.Column('flag_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('app_registrations', sa.Column('auto_suspend_threshold', sa.Integer(), server_default='10', nullable=False))

    # Create app_content_screens table
    op.create_table(
        'app_content_screens',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('app_id', sa.Text(), nullable=False),
        sa.Column('screen_type', sa.Text(), nullable=False),
        sa.Column('result', sa.Text(), nullable=False),
        sa.Column('flagged', sa.Boolean(), server_default='false'),
        sa.Column('details', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("screen_type IN ('moderation_api', 'screenshot_diff', 'manual_review')", name='ck_app_content_screens_type'),
        sa.CheckConstraint("result IN ('pass', 'fail', 'review_needed')", name='ck_app_content_screens_result'),
    )


def downgrade() -> None:
    op.drop_table('app_content_screens')
    op.drop_column('app_registrations', 'auto_suspend_threshold')
    op.drop_column('app_registrations', 'flag_count')
