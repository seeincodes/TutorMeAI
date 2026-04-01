# ChatBridge — Claude Code Guardrails

## Project Structure

- `web/frontend/` — React Vite + TypeScript + Tailwind (chat UI, iframe container)
- `web/backend/` — Python FastAPI (auth, agent, app registry, OAuth)
- `apps/` — 7 iframe apps (chess, spotify, weather, flashcards, dictionary, calculator, life-skills)
- `docs/` — Project documentation (PRD, task list, tech stack, architecture memo, etc.)
- `src/` — Original Electron chatbox code (DO NOT MODIFY)

## Environment Protection

- Never modify `.env` without user confirmation
- Never commit `.env` files
- Never display API key values or hardcode secrets in source code
- All secrets must be accessed via environment variables

## Error Logging

- Log build failures, runtime errors, API errors, DB errors, deployment errors, and anything >5 min to diagnose to `docs/ERROR_FIX_LOG.md`
- Do NOT log: typos, linter warnings, expected test failures

## Tech Stack Lock

The following technology decisions are locked. Do not switch any without explicit user approval:

- **Frontend:** React (Vite) + TypeScript — do not switch to Next.js, Remix, or Angular
- **Styling:** Tailwind CSS — do not switch to styled-components, CSS modules, or MUI
- **Backend:** Python FastAPI — do not switch to Django, Flask, or Express
- **AI Agent:** LangGraph + OpenAI GPT-4.1-mini — do not switch to raw OpenAI, CrewAI, or AutoGen
- **Database:** PostgreSQL (Railway) — do not switch to MongoDB, SQLite, or Supabase
- **ORM:** SQLAlchemy (async) + Alembic — do not switch to Prisma, Drizzle, or raw SQL
- **Auth:** bcrypt + JWT (native FastAPI) — do not switch to Auth0, Clerk, or Supabase Auth
- **Real-time:** SSE via sse-starlette — do not switch to WebSockets or Socket.IO
- **App Sandboxing:** Iframes with `sandbox="allow-scripts"` — do not add `allow-same-origin`
- **Package Manager:** pnpm — do not switch to npm or yarn
- **Observability:** LangSmith — do not switch to Weights & Biases or custom logging
- **Rate Limiting:** slowapi — do not switch to custom middleware
- New dependencies require justification

## K-12 Safety Rules

- Never send student PII (name, email, school) to iframe apps
- Use `sandbox="allow-scripts allow-same-origin"` for first-party apps (React needs same-origin for event handling)
- For any future third-party apps, use `sandbox="allow-scripts"` WITHOUT `allow-same-origin`
- All external API calls must go through the FastAPI backend, never directly from iframes
- Content moderation: OpenAI filters + system prompt + tool result delimiters
- OAuth tokens stored server-side only, encrypted, never exposed to client

## Code Conventions

- Backend: Python async/await throughout, Pydantic models for all request/response schemas
- Frontend: TypeScript strict mode, functional React components with hooks
- Do not modify anything in `src/` (original Electron codebase)
