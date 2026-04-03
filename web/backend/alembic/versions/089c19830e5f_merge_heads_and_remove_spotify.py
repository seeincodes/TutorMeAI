"""merge heads and remove spotify app

Revision ID: 089c19830e5f
Revises: a1b2c3d4e5f6, c588d10d0816
Create Date: 2026-04-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '089c19830e5f'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'c588d10d0816')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("DELETE FROM app_registrations WHERE app_id = 'spotify'"))


def downgrade() -> None:
    # Re-insert spotify if rolling back
    op.execute(sa.text("""
        INSERT INTO app_registrations (app_id, name, description, auth_type, iframe_url, tool_schemas, status, age_rating, is_active)
        VALUES ('spotify', 'Spotify Playlist',
                'Create playlists, search tracks, and play music via Spotify. Requires Spotify account connection.',
                'oauth2', '/apps/spotify/index.html',
                '[{"name":"create_playlist","description":"Create a new Spotify playlist.","parameters":[{"name":"name","type":"string","description":"Playlist name","required":true},{"name":"description","type":"string","description":"Playlist description","required":false}]},{"name":"search_tracks","description":"Search for tracks on Spotify.","parameters":[{"name":"query","type":"string","description":"Search query","required":true}]},{"name":"get_playlists","description":"Get the user''s Spotify playlists.","parameters":[]}]'::jsonb,
                'active', 'all', true)
    """))
