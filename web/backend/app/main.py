from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.apps.router import router as apps_router
from app.auth.router import router as auth_router, users_router
from app.config import settings
from app.conversations.router import router as conversations_router
from app.oauth.router import router as oauth_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ChatBridge API",
    version="0.0.1",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


@app.get("/api/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    return {"status": "ok"}
