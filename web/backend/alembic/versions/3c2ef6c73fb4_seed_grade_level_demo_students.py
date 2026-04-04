"""seed grade-level demo students

Revision ID: 3c2ef6c73fb4
Revises: d0d910dadea9
Create Date: 2026-04-03 23:56:20.995340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c2ef6c73fb4'
down_revision: Union[str, Sequence[str], None] = 'd0d910dadea9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Demo students at different grade levels to showcase grade-based app filtering.
# All passwords are "demo123".
# Grade-based app visibility:
#   K-2 (grade 0-2): Chess, Math Helper, Reading & Vocabulary, Level Up Life (4 apps)
#   3-5 (grade 3-5): + Flashcards, Weather (all 6 apps)
#   6+             : all 6 apps
DEMO_STUDENTS = [
    {
        "username": "emma_k",
        "password_hash": "$2b$12$aVFzR20a4QTsdr03.eycxuUvdvtaUkeDNxnMkyFhTYU6hmAXocWEm",
        "display_name": "Emma",
        "role": "student",
        "grade": 0,
    },
    {
        "username": "liam_3",
        "password_hash": "$2b$12$pa.Dm3jnt2rCvtouUEA69OFftyBxeEwjoxvy7rIAMXNMICZu9ZFVi",
        "display_name": "Liam",
        "role": "student",
        "grade": 3,
    },
    {
        "username": "sofia_6",
        "password_hash": "$2b$12$HRx1MUpusL86VIQJjFiT8uAe2aJ2I9WZ4vz8zB2XFBcYNo4MjjSO6",
        "display_name": "Sofia",
        "role": "student",
        "grade": 6,
    },
    {
        "username": "noah_9",
        "password_hash": "$2b$12$7bj0ksP.F6glft7Xci000OL.7ZorO9Fe2diW7q1nl.QVK5WTazXnu",
        "display_name": "Noah",
        "role": "student",
        "grade": 9,
    },
]


def upgrade() -> None:
    for s in DEMO_STUDENTS:
        # Escape single quotes in values
        u = s["username"]
        ph = s["password_hash"].replace("'", "''")
        dn = s["display_name"].replace("'", "''")
        r = s["role"]
        g = s["grade"]
        op.execute(sa.text(
            f"INSERT INTO users (id, username, password_hash, display_name, role, grade, is_active) "
            f"VALUES (gen_random_uuid(), '{u}', '{ph}', '{dn}', '{r}', {g}, true) "
            f"ON CONFLICT (username) DO UPDATE SET grade = {g}, display_name = '{dn}'"
        ))


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM users WHERE username IN ('emma_k', 'liam_3', 'sofia_6', 'noah_9')")
    )
