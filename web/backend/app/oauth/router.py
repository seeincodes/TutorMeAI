from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models import OAuthToken, User
from app.oauth.crypto import encrypt_token, decrypt_token
from app.oauth.pkce import generate_pkce_pair

router = APIRouter(prefix="/api/oauth", tags=["oauth"])

# In-memory PKCE state store (keyed by state param). Production: use Redis or DB.
_pkce_states: dict[str, dict] = {}

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_SCOPES = "playlist-modify-public playlist-modify-private playlist-read-private user-read-playback-state"


@router.get("/{app_id}/authorize")
async def authorize(
    app_id: str,
    current_user: User = Depends(get_current_user),
):
    if app_id != "spotify":
        raise HTTPException(status_code=400, detail="OAuth not supported for this app")

    if not settings.spotify_client_id:
        raise HTTPException(status_code=500, detail="Spotify OAuth not configured")

    code_verifier, code_challenge = generate_pkce_pair()

    import secrets
    state = secrets.token_urlsafe(32)
    _pkce_states[state] = {
        "user_id": str(current_user.id),
        "code_verifier": code_verifier,
    }

    params = {
        "client_id": settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri": settings.spotify_redirect_uri,
        "scope": SPOTIFY_SCOPES,
        "state": state,
        "code_challenge_method": "S256",
        "code_challenge": code_challenge,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return {"authorize_url": f"{SPOTIFY_AUTH_URL}?{query}"}


@router.get("/{app_id}/callback")
async def callback(
    app_id: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    if app_id != "spotify":
        raise HTTPException(status_code=400, detail="OAuth not supported for this app")

    pkce_data = _pkce_states.pop(state, None)
    if not pkce_data:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    user_id = pkce_data["user_id"]
    code_verifier = pkce_data["code_verifier"]

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SPOTIFY_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.spotify_redirect_uri,
                "client_id": settings.spotify_client_id,
                "code_verifier": code_verifier,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")

    token_data = resp.json()
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")
    expires_in = token_data.get("expires_in", 3600)

    # Encrypt and store tokens
    result = await db.execute(
        select(OAuthToken).where(OAuthToken.user_id == user_id, OAuthToken.app_id == app_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.access_token = encrypt_token(access_token)
        existing.refresh_token = encrypt_token(refresh_token) if refresh_token else None
        existing.expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    else:
        oauth_token = OAuthToken(
            user_id=user_id,
            app_id=app_id,
            access_token=encrypt_token(access_token),
            refresh_token=encrypt_token(refresh_token) if refresh_token else None,
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
        )
        db.add(oauth_token)

    await db.commit()

    # Return HTML that closes the popup and notifies the parent
    return HTMLResponse("""
    <html><body><script>
        window.opener?.postMessage({type: 'oauth_complete', app_id: 'spotify'}, '*');
        window.close();
    </script><p>Connected! You can close this window.</p></body></html>
    """)


@router.delete("/{app_id}/disconnect")
async def disconnect(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OAuthToken).where(
            OAuthToken.user_id == current_user.id,
            OAuthToken.app_id == app_id,
        )
    )
    token = result.scalar_one_or_none()
    if not token:
        raise HTTPException(status_code=404, detail="No OAuth connection found")

    await db.delete(token)
    await db.commit()
    return {"message": f"Disconnected from {app_id}"}


@router.get("/{app_id}/status")
async def oauth_status(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OAuthToken).where(
            OAuthToken.user_id == current_user.id,
            OAuthToken.app_id == app_id,
        )
    )
    token = result.scalar_one_or_none()
    if not token:
        return {"connected": False}

    expired = token.expires_at and token.expires_at < datetime.now(timezone.utc)
    return {"connected": True, "expired": expired}


async def get_spotify_token(user_id: str, db: AsyncSession) -> str | None:
    """Get a valid Spotify access token for the user, auto-refreshing if expired."""
    result = await db.execute(
        select(OAuthToken).where(OAuthToken.user_id == user_id, OAuthToken.app_id == "spotify")
    )
    token = result.scalar_one_or_none()
    if not token:
        return None

    # Check if expired and refresh
    if token.expires_at and token.expires_at < datetime.now(timezone.utc):
        if not token.refresh_token:
            return None

        refresh = decrypt_token(token.refresh_token)
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                SPOTIFY_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh,
                    "client_id": settings.spotify_client_id,
                },
            )

        if resp.status_code != 200:
            return None

        data = resp.json()
        token.access_token = encrypt_token(data["access_token"])
        if data.get("refresh_token"):
            token.refresh_token = encrypt_token(data["refresh_token"])
        token.expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
        await db.commit()

    return decrypt_token(token.access_token)
