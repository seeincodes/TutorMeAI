# ChatBridge — Technology Stack

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React Vite + TypeScript)                              │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Chat UI      │  │  Iframe Container                       │ │
│  │  - Messages   │  │  sandbox="allow-scripts"                │ │
│  │  - Streaming  │  │  ┌────────┐ ┌────────┐ ┌────────┐      │ │
│  │  - Input      │  │  │ Chess  │ │Spotify │ │Weather │ ...  │ │
│  │               │  │  └───┬────┘ └───┬────┘ └───┬────┘      │ │
│  └──────┬───────┘  └──────┼──────────┼──────────┼────────────┘ │
│         │    postMessage   │          │          │               │
│         │  ◄──────────────►──────────►──────────►               │
└─────────┼───────────────────────────────────────────────────────┘
          │ SSE (streaming) ↓  REST (messages) ↕
┌─────────┼───────────────────────────────────────────────────────┐
│  FastAPI Backend                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Auth (JWT)   │  │  App Registry │  │  OAuth2 PKCE       │    │
│  │  bcrypt       │  │  Pydantic     │  │  (Spotify)         │    │
│  │  Role-based   │  │  Tool schemas │  │  Server-side tokens│    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LangGraph Agent                                         │   │
│  │  Intent classification → Dynamic schema injection        │   │
│  │  OpenAI GPT-4.1-mini  → Tool calling → Result routing    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  slowapi       │  │  LangSmith    │  │  Alembic           │    │
│  │  Rate limiting │  │  Observability│  │  Migrations        │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PostgreSQL        │
                    │  (Railway)         │
                    │  users, messages,  │
                    │  conversations,    │
                    │  app_registrations,│
                    │  tool_invocations, │
                    │  oauth_tokens      │
                    └───────────────────┘
```

## Stack Decisions

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend | React (Vite) + TypeScript | React 18, Vite 5 | No SSR needed. Vite dev proxy eliminates CORS. Lighter than Next.js. |
| Styling | Tailwind CSS | 3.x | Already in base repo. Utility-first, fast iteration. |
| Backend | Python FastAPI | 0.110+ | Async-native, Pydantic validation, LangChain/LangGraph integration, native SSE. |
| AI Agent | LangGraph + OpenAI GPT-4.1-mini | LangGraph 0.2+, GPT-4.1-mini | Graph-based agent. $0.40/$1.60 per 1M tokens. 1M context. Strong function calling. Built-in K-12 content moderation. |
| Real-time | SSE (server→client) + REST (client→server) | — | SSE for streaming responses. REST POST for user messages. Simpler than WebSockets for unidirectional streaming. |
| Database | PostgreSQL | 15+ | Full relational power. Alembic migrations from day 1. Hosted on Railway. |
| ORM/Migrations | SQLAlchemy + Alembic | SQLAlchemy 2.0+ | Async support, declarative models, versioned migrations. |
| Auth | bcrypt + JWT (httpOnly cookies) | — | Admin creates accounts. No social login, no self-registration. Role-based (student/teacher/admin). |
| OAuth (3rd party) | OAuth2 PKCE via FastAPI | — | Spotify flow. Popup window. Tokens encrypted server-side. |
| App Sandboxing | Iframes (`sandbox="allow-scripts"`) + postMessage | — | Browser-enforced isolation. No `allow-same-origin` — non-negotiable in K-12. |
| Rate Limiting | slowapi | — | Per-IP and per-user rate limiting middleware. |
| Observability | LangSmith | — | Traces every tool call, routing decision, and token usage. |
| Deployment | Railway | — | PostgreSQL + FastAPI hosting. Simple deploy from Git. |
| Package Manager | pnpm | 8+ | Workspace support. Already used in base repo. |

## Key Dependencies

**Backend (Python):**
- `fastapi` — web framework
- `uvicorn` — ASGI server
- `sqlalchemy[asyncio]` — async ORM
- `alembic` — database migrations
- `asyncpg` — PostgreSQL async driver
- `pydantic` — schema validation (built into FastAPI)
- `python-jose[cryptography]` — JWT encoding/decoding
- `passlib[bcrypt]` — password hashing
- `langgraph` — agent orchestration
- `langchain-openai` — OpenAI integration
- `langsmith` — observability/tracing
- `slowapi` — rate limiting
- `httpx` — async HTTP client (external API calls)
- `sse-starlette` — Server-Sent Events support
- `cryptography` — OAuth token encryption

**Frontend (TypeScript/React):**
- `react` + `react-dom` — UI framework
- `vite` — build tool and dev server
- `tailwindcss` — utility-first CSS
- `chess.js` — chess logic engine
- `react-chessboard` — chess board UI component
- `math.js` — safe math expression evaluation
- `react-router-dom` — client-side routing

**App-specific:**
- `chess.js` + `react-chessboard` — Chess app
- `math.js` — Math Calculator app
- Free Dictionary API (external, no package) — Dictionary app
- OpenWeatherMap API (external, no package) — Weather app
- Spotify Web API + Web Playback SDK — Spotify app

## Environment Variables

```env
# Database
DATABASE_URL=

# Auth
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI / LangGraph
OPENAI_API_KEY=

# LangSmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=chatbridge

# External APIs
OPENWEATHERMAP_API_KEY=

# Spotify OAuth
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=

# OAuth Token Encryption
OAUTH_ENCRYPTION_KEY=

# Server
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:5173

# Railway
RAILWAY_ENVIRONMENT=
```

## Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    active_app_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
    content TEXT,
    tool_call_id TEXT,
    tool_name TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'api_key', 'oauth2')),
    iframe_url TEXT NOT NULL,
    tool_schemas JSONB NOT NULL,
    status TEXT DEFAULT 'pending_review',
    age_rating TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tool_invocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    app_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    params JSONB,
    result JSONB,
    duration_ms INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    status TEXT CHECK (status IN ('success', 'error', 'timeout')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, app_id)
);
```

## API Endpoints Summary

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/login` | Authenticate user, return JWT | Public |
| POST | `/api/auth/refresh` | Refresh access token | Refresh token |
| POST | `/api/auth/logout` | Invalidate session | JWT |
| GET | `/api/users/me` | Get current user profile | JWT |
| GET | `/api/conversations` | List user's conversations | JWT |
| POST | `/api/conversations` | Create new conversation | JWT |
| GET | `/api/conversations/{id}/messages` | Get conversation messages | JWT (owner) |
| POST | `/api/conversations/{id}/messages` | Send message, get SSE stream | JWT (owner) |
| GET | `/api/apps` | List available apps | JWT |
| POST | `/api/apps/register` | Register new app (admin) | JWT (admin) |
| PATCH | `/api/apps/{app_id}` | Update app status (admin) | JWT (admin) |
| POST | `/api/apps/{app_id}/invoke` | Invoke app tool | JWT |
| GET | `/api/oauth/{app_id}/authorize` | Start OAuth flow | JWT |
| GET | `/api/oauth/{app_id}/callback` | OAuth callback | Public |
| DELETE | `/api/oauth/{app_id}/disconnect` | Remove OAuth connection | JWT |
| GET | `/api/teacher/dashboard` | Teacher dashboard data | JWT (teacher) |
| PATCH | `/api/teacher/apps/{app_id}` | Toggle app for classroom | JWT (teacher) |
