"""seed demo accounts

Revision ID: d1b032b9cb2f
Revises: 6fda64570ff0
Create Date: 2026-03-31 22:17:10.535457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1b032b9cb2f'
down_revision: Union[str, Sequence[str], None] = '6fda64570ff0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Pre-computed bcrypt hashes for demo passwords.
# These are generated at migration-creation time so the migration is
# reproducible without needing bcrypt at runtime.
SEED_ACCOUNTS = [
    {
        "username": "admin",
        "password_hash": "$2b$12$YQNz0QQCaCMEVSvZ.sqo9uoO1CmB4qxEnEGvJf8u/Xh2orzOsxBXm",
        "display_name": "Admin",
        "role": "admin",
    },
    {
        "username": "teacher1",
        "password_hash": "$2b$12$iuJcCYOv4lnSY5jskzvjbueStlb3h4FwbZo.N/Fbua6ZYyGuSX3OG",
        "display_name": "Teacher One",
        "role": "teacher",
    },
    {
        "username": "student1",
        "password_hash": "$2b$12$1aoTra9ylNqbij.b9xNnvOTz0QYqbu3KesRqnsERTGxGa57xhf8ny",
        "display_name": "Student One",
        "role": "student",
    },
    {
        "username": "student2",
        "password_hash": "$2b$12$qFStU.9mgQ9xQ/siu3PfNu4bjMuRQH8lXnrKTyMAfCbDGF/sLMUJC",
        "display_name": "Student Two",
        "role": "student",
    },
]


def upgrade() -> None:
    users_table = sa.table(
        "users",
        sa.column("username", sa.Text),
        sa.column("password_hash", sa.Text),
        sa.column("display_name", sa.Text),
        sa.column("role", sa.Text),
    )
    op.bulk_insert(users_table, SEED_ACCOUNTS)


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM users WHERE username IN ('admin', 'teacher1', 'student1', 'student2')")
    )
