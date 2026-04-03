import os
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.apps.router import router as apps_router
from app.auth.router import router as auth_router, users_router
from app.auth.tokens import decode_token
from app.config import settings
from app.conversations.router import router as conversations_router
from app.oauth.router import router as oauth_router
from app.teacher.router import router as teacher_router
from app.classroom.router import router as classroom_router
from app.districts.router import router as districts_router
from app.marketplace.router import router as marketplace_router
from app.scaling.router import router as scaling_router
from app.observability.router import router as observability_router
from app.rate_limit import limiter

app = FastAPI(
    title="ChatBridge API",
    version="0.0.1",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class SecurityHeadersMiddleware:
    """Pure ASGI middleware for security headers. Avoids BaseHTTPMiddleware task conflicts."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                if path.startswith("/apps/"):
                    csp = (
                        b"default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                        b"connect-src 'self' https://api.dictionaryapi.dev https://wttr.in; "
                        b"img-src 'self' data:; "
                        b"script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                        b"style-src 'self' 'unsafe-inline'"
                    )
                    headers.append((b"content-security-policy", csp))
                else:
                    headers.append((b"x-frame-options", b"DENY"))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_headers)


class AppAuthMiddleware:
    """ASGI middleware that requires a valid access_token cookie for /apps/* paths."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if not path.startswith("/apps/"):
            await self.app(scope, receive, send)
            return

        # Extract access_token from cookies
        headers = dict(scope.get("headers", []))
        cookie_header = headers.get(b"cookie", b"").decode()
        token = None
        for part in cookie_header.split(";"):
            part = part.strip()
            if part.startswith("access_token="):
                token = part[len("access_token="):]
                break

        if not token:
            await self._send_401(send)
            return

        payload = decode_token(token)
        if payload is None or payload.get("type") != "access":
            await self._send_401(send)
            return

        await self.app(scope, receive, send)

    @staticmethod
    async def _send_401(send):
        await send({
            "type": "http.response.start",
            "status": 401,
            "headers": [(b"content-type", b"application/json")],
        })
        await send({
            "type": "http.response.body",
            "body": b'{"detail":"Not authenticated"}',
        })


class CorrelationIdMiddleware:
    """ASGI middleware that adds X-Correlation-ID to every response.

    If the client sends an X-Correlation-ID header, it is echoed back.
    Otherwise, a new UUID is generated.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract client-provided correlation ID
        headers = dict(scope.get("headers", []))
        client_cid = headers.get(b"x-correlation-id", b"").decode() or None
        correlation_id = client_cid or str(uuid.uuid4())

        async def send_with_cid(message):
            if message["type"] == "http.response.start":
                resp_headers = list(message.get("headers", []))
                resp_headers.append((b"x-correlation-id", correlation_id.encode()))
                message = {**message, "headers": resp_headers}
            await send(message)

        await self.app(scope, receive, send_with_cid)


app.add_middleware(AppAuthMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CorrelationIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(conversations_router)
app.include_router(apps_router)
app.include_router(oauth_router)
app.include_router(teacher_router)
app.include_router(classroom_router)
app.include_router(districts_router)
app.include_router(marketplace_router)
app.include_router(scaling_router)
app.include_router(observability_router)


@app.get("/api/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    return {"status": "ok"}


# Serve frontend static files in production
# In dev, Vite proxy handles this; in production, FastAPI serves the built files
_frontend_dist = Path(__file__).parent.parent.parent.parent / "web" / "frontend" / "dist"
_apps_dirs = {
    "chess": Path(__file__).parent.parent.parent.parent / "apps" / "chess" / "dist",
    "calculator": Path(__file__).parent.parent.parent.parent / "apps" / "calculator" / "dist",
    "dictionary": Path(__file__).parent.parent.parent.parent / "apps" / "dictionary" / "dist",
    "weather": Path(__file__).parent.parent.parent.parent / "apps" / "weather" / "dist",
    "flashcards": Path(__file__).parent.parent.parent.parent / "apps" / "flashcards" / "dist",
    "life-skills": Path(__file__).parent.parent.parent.parent / "apps" / "life-skills" / "dist",
    "google-classroom": Path(__file__).parent.parent.parent.parent / "apps" / "google-classroom" / "dist",
}

# Mount app static dirs
for app_name, app_dir in _apps_dirs.items():
    if app_dir.exists():
        app.mount(f"/apps/{app_name}", StaticFiles(directory=str(app_dir), html=True), name=f"app-{app_name}")

# Mount frontend last (catch-all for SPA routing)
if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="frontend")
