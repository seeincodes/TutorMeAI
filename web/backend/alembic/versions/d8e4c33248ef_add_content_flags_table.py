"""add content_flags table

Revision ID: d8e4c33248ef
Revises: 29be9890ff89
Create Date: 2026-04-01 12:05:02.727825

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd8e4c33248ef'
down_revision: Union[str, Sequence[str], None] = '29be9890ff89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'content_flags',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('app_id', sa.Text(), nullable=False),
        sa.Column('flagged_content', sa.Text(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('conversation_id', sa.Text(), nullable=True),
        sa.Column('reviewed', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )


def downgrade() -> None:
    op.drop_table('content_flags')
