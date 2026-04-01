from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.apps.router import router as apps_router
from app.auth.router import router as auth_router, users_router
from app.config import settings
from app.conversations.router import router as conversations_router
from app.oauth.router import router as oauth_router

app = FastAPI(
    title="ChatBridge API",
    version="0.0.1",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

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
async def health_check():
    return {"status": "ok"}
