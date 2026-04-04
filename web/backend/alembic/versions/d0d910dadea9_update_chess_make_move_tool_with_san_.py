"""update chess make_move tool with san param

Revision ID: d0d910dadea9
Revises: j5e6f7g8h9i0
Create Date: 2026-04-03 22:03:58.526438

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd0d910dadea9'
down_revision: Union[str, Sequence[str], None] = 'j5e6f7g8h9i0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UPDATED_CHESS_TOOL_SCHEMAS = [
    {
        "name": "new_game",
        "description": "Start a new chess game. Returns the initial board state.",
        "parameters": [
            {"name": "difficulty", "type": "string", "description": "Difficulty: 'explorer', 'apprentice', 'challenger', or 'expert'", "required": False}
        ],
    },
    {
        "name": "make_move",
        "description": "Make a chess move on the board. The move will be reflected on the visible chess board. Use SAN notation (e.g. e4, Nf3, Bc4) or from/to squares.",
        "parameters": [
            {"name": "san", "type": "string", "description": "Move in Standard Algebraic Notation (e.g. e4, Nf3, Bc4, O-O). Preferred over from/to.", "required": False},
            {"name": "from", "type": "string", "description": "Source square (e.g. e2)", "required": False},
            {"name": "to", "type": "string", "description": "Destination square (e.g. e4)", "required": False},
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
            {"name": "fen", "type": "string", "description": "FEN string of the position to analyze", "required": False}
        ],
    },
]


def upgrade() -> None:
    schemas_json = json.dumps(UPDATED_CHESS_TOOL_SCHEMAS).replace("'", "''")
    op.execute(sa.text(
        f"UPDATE app_registrations SET tool_schemas = '{schemas_json}'::jsonb WHERE app_id = 'chess'"
    ))


def downgrade() -> None:
    original = [
        {"name": "new_game", "description": "Start a new chess game. Returns the initial board state.", "parameters": [{"name": "color", "type": "string", "description": "Player color: 'white' or 'black'", "required": False}]},
        {"name": "make_move", "description": "Make a chess move. Provide source and destination squares.", "parameters": [{"name": "from", "type": "string", "description": "Source square (e.g., 'e2')", "required": True}, {"name": "to", "type": "string", "description": "Destination square (e.g., 'e4')", "required": True}]},
        {"name": "get_board_state", "description": "Get the current board state as a FEN string and game status.", "parameters": []},
        {"name": "analyze_position", "description": "Analyze the current chess position and suggest the best move.", "parameters": [{"name": "fen", "type": "string", "description": "FEN string of the position to analyze", "required": True}]},
    ]
    original_json = json.dumps(original).replace("'", "''")
    op.execute(sa.text(
        f"UPDATE app_registrations SET tool_schemas = '{original_json}'::jsonb WHERE app_id = 'chess'"
    ))
