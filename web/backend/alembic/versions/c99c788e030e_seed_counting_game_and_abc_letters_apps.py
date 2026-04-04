"""seed counting game and abc letters apps

Revision ID: c99c788e030e
Revises: 3c2ef6c73fb4
Create Date: 2026-04-04 01:43:58.274638

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c99c788e030e'
down_revision: Union[str, Sequence[str], None] = '3c2ef6c73fb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COUNTING_SCHEMAS = json.dumps([
    {"name": "get_state", "description": "Get the current game state", "parameters": []},
])

ABC_SCHEMAS = json.dumps([
    {"name": "get_state", "description": "Get the current game state", "parameters": []},
])


COLS = "id, app_id, name, description, auth_type, iframe_url, tool_schemas, status, age_rating, is_active, platform_status, requires_admin_approval, schema_version, trust_tier, flag_count, auto_suspend_threshold"

def upgrade() -> None:
    # Counting Game
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}) "
        f"VALUES (gen_random_uuid(), 'counting-game', 'Counting Game', "
        f"'Count objects, compare groups, and add numbers together! All button-based — perfect for kids learning to count.', "
        f"'none', '/apps/counting-game/index.html', '{COUNTING_SCHEMAS}'::jsonb, 'active', 'all', true, 'allowed', false, 1, 'verified', 0, 10) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'Counting Game', description = 'Count objects, compare groups, and add numbers together! All button-based — perfect for kids learning to count.'"
    ))

    # ABC Letters
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}) "
        f"VALUES (gen_random_uuid(), 'abc-letters', 'ABC Letters', "
        f"'Learn letters, match pictures to letters, and practice uppercase and lowercase! All button-based — no typing needed.', "
        f"'none', '/apps/abc-letters/index.html', '{ABC_SCHEMAS}'::jsonb, 'active', 'all', true, 'allowed', false, 1, 'verified', 0, 10) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'ABC Letters', description = 'Learn letters, match pictures to letters, and practice uppercase and lowercase! All button-based — no typing needed.'"
    ))


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id IN ('counting-game', 'abc-letters')"))
