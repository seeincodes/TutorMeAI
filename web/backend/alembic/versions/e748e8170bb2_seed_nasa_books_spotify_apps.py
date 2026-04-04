"""seed nasa books spotify apps

Revision ID: e748e8170bb2
Revises: 42561dac1642
Create Date: 2026-04-04 10:42:12.712656

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e748e8170bb2'
down_revision: Union[str, Sequence[str], None] = '42561dac1642'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLS = "id, app_id, name, description, auth_type, iframe_url, tool_schemas, status, age_rating, is_active, platform_status, requires_admin_approval, schema_version, trust_tier, flag_count, auto_suspend_threshold"

NASA_SCHEMAS = json.dumps([
    {"name": "get_state", "description": "Get the current app state", "parameters": []},
    {"name": "get_apod", "description": "Get NASA Astronomy Picture of the Day", "parameters": [
        {"name": "date", "type": "string", "description": "Date in YYYY-MM-DD format (optional)", "required": False}
    ]},
])

BOOKS_SCHEMAS = json.dumps([
    {"name": "get_state", "description": "Get the current app state", "parameters": []},
    {"name": "search_books", "description": "Search for books by keyword", "parameters": [
        {"name": "query", "type": "string", "description": "Search query", "required": True}
    ]},
])

SPOTIFY_SCHEMAS = json.dumps([
    {"name": "get_state", "description": "Get the current app state", "parameters": []},
    {"name": "play_playlist", "description": "Play a curated study playlist", "parameters": [
        {"name": "playlist_id", "type": "string", "description": "Playlist ID (focus, classical, nature, phonics)", "required": True}
    ]},
    {"name": "get_now_playing", "description": "Get the currently playing track", "parameters": []},
])

SPOTIFY_OAUTH_CONFIG = json.dumps({
    "authorize_url": "https://accounts.spotify.com/authorize",
    "token_url": "https://accounts.spotify.com/api/token",
    "scopes": "user-read-playback-state user-modify-playback-state streaming",
    "client_id_env": "SPOTIFY_CLIENT_ID",
    "client_secret_env": "SPOTIFY_CLIENT_SECRET",
})


def upgrade() -> None:
    # NASA Space Explorer — uses API key (External Public)
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}) "
        f"VALUES (gen_random_uuid(), 'nasa', 'NASA Space Explorer', "
        f"'Explore space with NASA! See the Astronomy Picture of the Day, learn space facts, and discover the universe.', "
        f"'api_key', '/apps/nasa/index.html', '{NASA_SCHEMAS}'::jsonb, 'active', 'all', true, 'allowed', false, 1, 'verified', 0, 10) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'NASA Space Explorer', auth_type = 'api_key'"
    ))

    # Book Explorer — public API (External Public, no auth)
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}) "
        f"VALUES (gen_random_uuid(), 'books', 'Book Explorer', "
        f"'Search and browse books from Open Library! Find your next favorite read and build a reading list.', "
        f"'none', '/apps/books/index.html', '{BOOKS_SCHEMAS}'::jsonb, 'active', 'all', true, 'allowed', false, 1, 'verified', 0, 10) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'Book Explorer'"
    ))

    # Spotify Study Music — OAuth2 (External Authenticated)
    oauth_config = SPOTIFY_OAUTH_CONFIG.replace("'", "''")
    op.execute(sa.text(
        f"INSERT INTO app_registrations ({COLS}, oauth_config) "
        f"VALUES (gen_random_uuid(), 'spotify', 'Study Music', "
        f"'Listen to curated study playlists — focus music, classical, nature sounds, and learning songs. Requires Spotify account.', "
        f"'oauth2', '/apps/spotify/index.html', '{SPOTIFY_SCHEMAS}'::jsonb, 'active', 'teen', true, 'allowed', false, 1, 'verified', 0, 10, "
        f"'{oauth_config}'::jsonb) "
        f"ON CONFLICT (app_id) DO UPDATE SET name = 'Study Music', auth_type = 'oauth2'"
    ))


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id IN ('nasa', 'books', 'spotify')"))
