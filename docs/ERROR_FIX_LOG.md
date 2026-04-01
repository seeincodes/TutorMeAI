# ChatBridge — Error & Fix Log

## Template

```
### [DATE] — [ERROR_CATEGORY] — Brief description

**Error:** What happened (error message, stack trace excerpt)
**Context:** What you were doing when it occurred
**Root Cause:** Why it happened
**Fix:** What you changed to resolve it
**Prevention:** How to avoid this in the future
```

**Error Categories:**
- `BUILD` — Vite, pnpm, TypeScript compilation
- `DB` — PostgreSQL, Alembic migrations, SQLAlchemy
- `AUTH` — JWT, bcrypt, OAuth2 PKCE, session issues
- `AGENT` — LangGraph, OpenAI API, tool calling, schema injection
- `IFRAME` — Sandbox, postMessage, CSP, app loading
- `API` — FastAPI endpoints, request/response, rate limiting
- `DEPLOY` — Railway, environment variables, production issues
- `DEPS` — Package installation, version conflicts, pnpm workspace

## Log

*No errors logged yet.*

## Common Issues to Watch For

**FastAPI + Async:**
- Forgetting `await` on async SQLAlchemy queries — returns coroutine object instead of result
- Using sync `requests` library inside async endpoints — blocks event loop, use `httpx` instead
- Alembic migrations with async engine require `run_async` wrapper

**LangGraph + OpenAI:**
- Tool schema format mismatch — OpenAI expects `{"type": "function", "function": {...}}`, LangGraph wraps differently
- Dynamic schema injection timing — schemas must be set before the LLM node, not during
- Token counting discrepancies between LangSmith traces and OpenAI billing
- GPT-4.1-mini may hallucinate tool calls for tools not in current context — always validate tool name against injected schemas

**Iframe + PostMessage:**
- `sandbox="allow-scripts"` without `allow-same-origin` means `localStorage` and `sessionStorage` throw in the iframe — apps must be stateless or use postMessage for state
- Origin is `"null"` for sandboxed iframes without `allow-same-origin` — origin validation must account for this
- postMessage `targetOrigin` should be `"*"` when sending TO a sandboxed iframe (no origin to match), but validate source when RECEIVING

**PostgreSQL + Railway:**
- Railway PostgreSQL connection strings use `postgresql://` not `postgres://` — SQLAlchemy 2.0 requires the full prefix
- Connection pool exhaustion under load — set `pool_size` and `max_overflow` explicitly
- Alembic `env.py` needs async engine configuration for `asyncpg`

**React + Vite:**
- Vite proxy config only works in dev — production needs proper CORS or reverse proxy
- Hot module replacement doesn't propagate through iframes — manual reload needed for iframe app changes
- `useEffect` cleanup for SSE `EventSource` connections — must close on unmount to prevent memory leaks

**Auth:**
- `httpOnly` cookies not sent on cross-origin requests without `credentials: 'include'` in fetch
- `SameSite=Strict` blocks cookies on OAuth callback redirects — may need `Lax` for OAuth routes
- bcrypt hash comparison is timing-safe by default, but JWT verification is not — use constant-time comparison for token validation

**pnpm Workspaces:**
- Shared dependencies between `web/frontend` and `apps/*` — hoist to root or use `pnpm` catalog
- `chess.js` and `react-chessboard` version compatibility — pin versions together
