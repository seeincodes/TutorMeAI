# ChatBridge — Project Context Skill

## Context

ChatBridge is an AI chat platform for TutorMeAI (K-12) that embeds third-party educational apps inside conversations via sandboxed iframes and a LangGraph-powered tool-calling agent.

## Codebase

- **Target:** Deployed web app (not Electron)
- **Structure:** pnpm workspace — `web/frontend/`, `web/backend/`, `apps/` (7 iframe apps), `src/` (original Electron, untouched)
- **Base repo:** Forked from `chatboxai/chatbox` (GPLv3, 930 commits)

## Stack

- Frontend: React (Vite) + TypeScript + Tailwind CSS
- Backend: Python FastAPI (async)
- AI Agent: LangGraph + OpenAI GPT-4.1-mini
- Database: PostgreSQL on Railway (SQLAlchemy async + Alembic)
- Auth: bcrypt + JWT (httpOnly cookies), role-based (student/teacher/admin)
- OAuth: OAuth2 PKCE via FastAPI (Spotify)
- Real-time: SSE (server→client streaming) + REST (client→server)
- App Sandboxing: Iframes (`sandbox="allow-scripts"`) + postMessage protocol
- Observability: LangSmith
- Rate Limiting: slowapi
- Package Manager: pnpm

## Key Files

- `docs/PRD.md` — Product requirements with [MVP1]–[MVP14] IDs
- `docs/TASK_LIST.md` — Phased task breakdown (3 phases, 14 task groups)
- `docs/TECH_STACK.md` — Architecture diagram, stack decisions, DB schema, API endpoints
- `docs/MEMO.md` — Architecture decisions with rationale and rejected alternatives
- `docs/ERROR_FIX_LOG.md` — Error logging template and tech-specific gotchas
- `docs/USER_FLOW.md` — User journey flows, API request/response examples
- `docs/TESTING_STRATEGY.md` — Testing pyramid, E2E scenarios, requirement coverage matrix
- `CLAUDE.md` — Guardrails: env protection, error logging, tech stack lock, K-12 safety
- `presearch.md` — Original presearch document with full analysis

## Processing Strategy

1. User sends message → REST POST
2. LangGraph intent classification → determines target app
3. Dynamic schema injection → only target app's tool schemas loaded
4. GPT-4.1-mini generates response, may include tool calls
5. Backend validates params → frontend dispatches via postMessage to sandboxed iframe
6. App processes tool, returns result via postMessage with correlation ID
7. Result routed back to LLM → incorporated into streamed response
8. Completion: explicit app signal or LLM polling fallback

## Known Patterns

- Two-phase routing: lightweight intent classification before full schema injection (saves ~40% tokens)
- Hybrid completion signaling: explicit `completion` postMessage + `get_state` polling fallback
- Dual error display: inline iframe banner + chatbot conversational acknowledgment
- K-12 safety: zero PII to apps, `sandbox="allow-scripts"` only (no `allow-same-origin`), all external API calls through backend
- Origin validation on every postMessage, correlation IDs prevent cross-app spoofing
- OAuth via popup window (not iframe — sandbox blocks redirects)
- Seed accounts for demo via Alembic migration
