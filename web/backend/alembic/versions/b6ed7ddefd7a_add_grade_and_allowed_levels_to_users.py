"""add grade and allowed_levels to users

Revision ID: b6ed7ddefd7a
Revises: d8e4c33248ef
Create Date: 2026-04-01 13:32:53.311899
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b6ed7ddefd7a'
down_revision: Union[str, Sequence[str], None] = 'd8e4c33248ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('grade', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('allowed_levels', postgresql.JSONB(), nullable=True))
    # Set defaults: student1 = grade 5, student2 = grade 3
    op.execute(sa.text("UPDATE users SET grade = 5, allowed_levels = '[\"K-2\",\"3-5\"]' WHERE username = 'student1'"))
    op.execute(sa.text("UPDATE users SET grade = 3, allowed_levels = '[\"K-2\",\"3-5\"]' WHERE username = 'student2'"))


def downgrade() -> None:
    op.drop_column('users', 'allowed_levels')
    op.drop_column('users', 'grade')
