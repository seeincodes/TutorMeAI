"""seed spotify app registration

Revision ID: 29be9890ff89
Revises: 331d4b60059d
Create Date: 2026-04-01 00:30:47.232720

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '29be9890ff89'
down_revision: Union[str, Sequence[str], None] = '331d4b60059d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SPOTIFY_TOOLS = [
    {"name": "create_playlist", "description": "Create a new Spotify playlist.", "parameters": [
        {"name": "name", "type": "string", "description": "Playlist name", "required": True},
        {"name": "description", "type": "string", "description": "Playlist description", "required": False},
    ]},
    {"name": "search_tracks", "description": "Search for tracks on Spotify.", "parameters": [
        {"name": "query", "type": "string", "description": "Search query", "required": True},
    ]},
    {"name": "get_playlists", "description": "Get the user's Spotify playlists.", "parameters": []},
]


def upgrade() -> None:
    app_registrations = sa.table(
        "app_registrations",
        sa.column("app_id", sa.Text), sa.column("name", sa.Text),
        sa.column("description", sa.Text), sa.column("auth_type", sa.Text),
        sa.column("iframe_url", sa.Text), sa.column("tool_schemas", sa.Text),
        sa.column("status", sa.Text), sa.column("age_rating", sa.Text),
        sa.column("is_active", sa.Boolean),
    )
    op.bulk_insert(app_registrations, [{
        "app_id": "spotify",
        "name": "Spotify Playlist",
        "description": "Create playlists, search tracks, and play music via Spotify. Requires Spotify account connection.",
        "auth_type": "oauth2",
        "iframe_url": "/apps/spotify/index.html",
        "tool_schemas": json.dumps(SPOTIFY_TOOLS),
        "status": "active",
        "age_rating": "all",
        "is_active": True,
    }])


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id = 'spotify'"))
