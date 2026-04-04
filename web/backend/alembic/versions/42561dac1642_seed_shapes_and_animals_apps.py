"""seed shapes and animals apps

Revision ID: 42561dac1642
Revises: c99c788e030e
Create Date: 2026-04-04 01:52:44.223567

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '42561dac1642'
down_revision: Union[str, Sequence[str], None] = 'c99c788e030e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHEMAS = json.dumps([{"name": "get_state", "description": "Get the current game state", "parameters": []}])
COLS = "id, app_id, name, description, auth_type, iframe_url, tool_schemas, status, age_rating, is_active, platform_status, requires_admin_approval, schema_version, trust_tier, flag_count, auto_suspend_threshold"


def upgrade() -> None:
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}) "
        f"VALUES (gen_random_uuid(), 'shapes', 'Shapes & Colors', "
        f"'Learn shapes, colors, and count sides! All button-based — tap to answer.', "
        f"'none', '/apps/shapes/index.html', '{SCHEMAS}'::jsonb, 'active', 'all', true, 'allowed', false, 1, 'verified', 0, 10) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'Shapes & Colors'"
    ))
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}) "
        f"VALUES (gen_random_uuid(), 'animals', 'Animal Friends', "
        f"'Learn animal sounds, habitats, and baby names! All button-based — tap to answer.', "
        f"'none', '/apps/animals/index.html', '{SCHEMAS}'::jsonb, 'active', 'all', true, 'allowed', false, 1, 'verified', 0, 10) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'Animal Friends'"
    ))


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id IN ('shapes', 'animals')"))
