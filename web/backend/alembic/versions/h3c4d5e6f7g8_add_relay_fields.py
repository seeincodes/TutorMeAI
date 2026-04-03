"""add server_api_url and signing_secret to app_registrations

Revision ID: h3c4d5e6f7g8
Revises: g2b3c4d5e6f7
Create Date: 2026-04-03 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'h3c4d5e6f7g8'
down_revision: Union[str, Sequence[str], None] = 'g2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('app_registrations', sa.Column('server_api_url', sa.Text(), nullable=True))
    op.add_column('app_registrations', sa.Column('signing_secret', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('app_registrations', 'signing_secret')
    op.drop_column('app_registrations', 'server_api_url')
