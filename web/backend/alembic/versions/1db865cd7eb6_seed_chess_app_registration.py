"""seed chess app registration

Revision ID: 1db865cd7eb6
Revises: d1b032b9cb2f
Create Date: 2026-03-31 23:59:04.366021

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1db865cd7eb6'
down_revision: Union[str, Sequence[str], None] = 'd1b032b9cb2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CHESS_TOOL_SCHEMAS = [
    {
        "name": "new_game",
        "description": "Start a new chess game. Returns the initial board state.",
        "parameters": [
            {"name": "color", "type": "string", "description": "Player color: 'white' or 'black'", "required": False}
        ],
    },
    {
        "name": "make_move",
        "description": "Make a chess move. Provide source and destination squares.",
        "parameters": [
            {"name": "from", "type": "string", "description": "Source square (e.g., 'e2')", "required": True},
            {"name": "to", "type": "string", "description": "Destination square (e.g., 'e4')", "required": True},
        ],
    },
    {
        "name": "get_board_state",
        "description": "Get the current board state as a FEN string and game status.",
        "parameters": [],
    },
    {
        "name": "analyze_position",
        "description": "Analyze the current chess position and suggest the best move.",
        "parameters": [
            {"name": "fen", "type": "string", "description": "FEN string of the position to analyze", "required": True}
        ],
    },
]


def upgrade() -> None:
    app_registrations = sa.table(
        "app_registrations",
        sa.column("app_id", sa.Text),
        sa.column("name", sa.Text),
        sa.column("description", sa.Text),
        sa.column("auth_type", sa.Text),
        sa.column("iframe_url", sa.Text),
        sa.column("tool_schemas", sa.Text),
        sa.column("status", sa.Text),
        sa.column("age_rating", sa.Text),
        sa.column("is_active", sa.Boolean),
    )
    op.bulk_insert(app_registrations, [
        {
            "app_id": "chess",
            "name": "Chess",
            "description": "Interactive chess board with AI analysis. Play chess games, make moves, and get position analysis.",
            "auth_type": "none",
            "iframe_url": "/apps/chess/index.html",
            "tool_schemas": json.dumps(CHESS_TOOL_SCHEMAS),
            "status": "active",
            "age_rating": "all",
            "is_active": True,
        }
    ])


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id = 'chess'"))
