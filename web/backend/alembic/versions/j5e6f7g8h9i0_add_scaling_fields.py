"""add token budget fields to districts

Revision ID: j5e6f7g8h9i0
Revises: i4d5e6f7g8h9
Create Date: 2026-04-03 04:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'j5e6f7g8h9i0'
down_revision: Union[str, Sequence[str], None] = 'i4d5e6f7g8h9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('districts', sa.Column('daily_token_budget', sa.Integer(), server_default='100000', nullable=False))
    op.add_column('districts', sa.Column('tokens_used_today', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('districts', 'tokens_used_today')
    op.drop_column('districts', 'daily_token_budget')
