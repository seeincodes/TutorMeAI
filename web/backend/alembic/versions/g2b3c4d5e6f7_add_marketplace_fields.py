"""add marketplace metadata fields and trust_tier to app_registrations

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-04-03 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'g2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('app_registrations', sa.Column('developer_name', sa.Text(), nullable=True))
    op.add_column('app_registrations', sa.Column('developer_email', sa.Text(), nullable=True))
    op.add_column('app_registrations', sa.Column('website_url', sa.Text(), nullable=True))
    op.add_column('app_registrations', sa.Column('privacy_policy_url', sa.Text(), nullable=True))
    op.add_column('app_registrations', sa.Column('logo_url', sa.Text(), nullable=True))
    op.add_column('app_registrations', sa.Column('trust_tier', sa.Text(), server_default='new', nullable=True))

    # Backfill existing rows
    op.execute("UPDATE app_registrations SET trust_tier = 'verified' WHERE trust_tier IS NULL")

    # Now make it non-nullable
    op.alter_column('app_registrations', 'trust_tier', nullable=False, server_default='new')

    op.create_check_constraint(
        'ck_app_registrations_trust_tier', 'app_registrations',
        "trust_tier IN ('new', 'classroom', 'school', 'district', 'verified')"
    )


def downgrade() -> None:
    op.drop_constraint('ck_app_registrations_trust_tier', 'app_registrations')
    op.drop_column('app_registrations', 'trust_tier')
    op.drop_column('app_registrations', 'logo_url')
    op.drop_column('app_registrations', 'privacy_policy_url')
    op.drop_column('app_registrations', 'website_url')
    op.drop_column('app_registrations', 'developer_email')
    op.drop_column('app_registrations', 'developer_name')
