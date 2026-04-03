"""add multi-tenant isolation: districts, district_app_approvals, user.district_id

Revision ID: f1a2b3c4d5e6
Revises: ee1afb832e12
Create Date: 2026-04-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'ee1afb832e12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create districts table
    op.create_table(
        'districts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('state', sa.Text(), nullable=True),
        sa.Column('settings', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create district_app_approvals table
    op.create_table(
        'district_app_approvals',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('district_id', UUID(as_uuid=True), sa.ForeignKey('districts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('app_id', sa.Text(), nullable=False),
        sa.Column('approved_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('status', sa.Text(), server_default='approved'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('district_id', 'app_id', name='uq_district_app_approvals_district_app'),
        sa.CheckConstraint("status IN ('approved', 'revoked', 'pending')", name='ck_district_app_approvals_status'),
    )

    # Add district_id to users
    op.add_column('users', sa.Column('district_id', UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_users_district_id', 'users', 'districts', ['district_id'], ['id'])

    # Update role check constraint to include district_admin
    op.drop_constraint('ck_users_role', 'users')
    op.create_check_constraint(
        'ck_users_role', 'users',
        "role IN ('student', 'teacher', 'admin', 'district_admin')"
    )


def downgrade() -> None:
    # Revert role check constraint
    op.drop_constraint('ck_users_role', 'users')
    op.create_check_constraint(
        'ck_users_role', 'users',
        "role IN ('student', 'teacher', 'admin')"
    )

    # Remove district_id from users
    op.drop_constraint('fk_users_district_id', 'users', type_='foreignkey')
    op.drop_column('users', 'district_id')

    # Drop tables
    op.drop_table('district_app_approvals')
    op.drop_table('districts')
