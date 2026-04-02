import os
import secrets
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import AppRegistration, OAuthToken, User
from app.oauth.crypto import encrypt_token, decrypt_token
from app.oauth.pkce import generate_pkce_pair

router = APIRouter(prefix="/api/oauth", tags=["oauth"])

_pkce_states: dict[str, dict] = {}


async def _get_oauth_app(app_id: str, db: AsyncSession) -> AppRegistration:
    result = await db.execute(
        select(AppRegistration).where(AppRegistration.app_id == app_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=400, detail=f"App '{app_id}' not found")
    if app.auth_type != "oauth2" or not app.oauth_config:
        raise HTTPException(status_code=400, detail=f"OAuth not supported for '{app_id}'")
    if app.platform_status == "blocked":
        raise HTTPException(status_code=403, detail=f"App '{app_id}' is blocked by platform policy")
    return app


def _get_env(var_name: str) -> str:
    value = os.environ.get(var_name, "")
    if not value:
        raise HTTPException(status_code=500, detail=f"OAuth not configured (missing {var_name})")
    return value


@router.get("/{app_id}/authorize")
async def authorize(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app = await _get_oauth_app(app_id, db)
    config = app.oauth_config

    client_id = _get_env(config["client_id_env_var"])
    redirect_uri = _get_env(config["redirect_uri_env_var"])

    code_verifier, code_challenge = generate_pkce_pair()

    state = secrets.token_urlsafe(32)
    _pkce_states[state] = {
        "user_id": str(current_user.id),
        "app_id": app_id,
        "code_verifier": code_verifier,
    }

    scopes = " ".join(config.get("scopes", []))
    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": scopes,
        "state": state,
        "code_challenge_method": "S256",
        "code_challenge": code_challenge,
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return {"authorize_url": f"{config['authorize_url']}?{query}"}


@router.get("/{app_id}/callback")
async def callback(
    app_id: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    pkce_data = _pkce_states.pop(state, None)
    if not pkce_data:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    if pkce_data["app_id"] != app_id:
        raise HTTPException(status_code=400, detail="App ID mismatch in callback")

    user_id = pkce_data["user_id"]
    code_verifier = pkce_data["code_verifier"]

    app = await _get_oauth_app(app_id, db)
    config = app.oauth_config

    client_id = _get_env(config["client_id_env_var"])
    client_secret = _get_env(config["client_secret_env_var"])
    redirect_uri = _get_env(config["redirect_uri_env_var"])

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            config["token_url"],
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": client_id,
                "client_secret": client_secret,
                "code_verifier": code_verifier,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")

    token_data = resp.json()
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")
    expires_in = token_data.get("expires_in", 3600)

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

    return HTMLResponse(f"""
    <html><body><script>
        window.opener?.postMessage({{type: 'oauth_complete', app_id: '{app_id}'}}, '*');
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


async def get_oauth_token(user_id: str, app_id: str, db: AsyncSession) -> str | None:
    result = await db.execute(
        select(OAuthToken).where(OAuthToken.user_id == user_id, OAuthToken.app_id == app_id)
    )
    token = result.scalar_one_or_none()
    if not token:
        return None

    if token.expires_at and token.expires_at < datetime.now(timezone.utc):
        if not token.refresh_token:
            return None

        app_result = await db.execute(
            select(AppRegistration).where(AppRegistration.app_id == app_id)
        )
        app = app_result.scalar_one_or_none()
        if not app or not app.oauth_config:
            return None

        config = app.oauth_config
        client_id = os.environ.get(config["client_id_env_var"], "")
        client_secret = os.environ.get(config["client_secret_env_var"], "")

        refresh = decrypt_token(token.refresh_token)
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                config["token_url"],
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh,
                    "client_id": client_id,
                    "client_secret": client_secret,
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
