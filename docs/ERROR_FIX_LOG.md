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

### 2026-03-31 — DB — JSONB column type mismatch in seed migrations

**Error:** `asyncpg.exceptions.DatatypeMismatchError: column "tool_schemas" is of type jsonb but expression is of type character varying`
**Context:** Running `alembic upgrade head` for the first time with seed data for app registrations.
**Root Cause:** Seed migrations used `sa.column("tool_schemas", sa.Text)` and `json.dumps()` which produced a string, but the column type is JSONB. asyncpg strictly enforces types.
**Fix:** Changed column type to `postgresql.JSONB` in seed migrations and passed Python dicts directly instead of `json.dumps()`.
**Prevention:** Always match `sa.column()` type to the actual database column type in migrations. Use JSONB type for JSONB columns.

---

### 2026-03-31 — DB — Pydantic UUID serialization error

**Error:** `pydantic_core._pydantic_core.ValidationError: Input should be a valid string, input_value=UUID('...')`
**Context:** Login endpoint returning `UserResponse.model_validate(user)` — UUID from SQLAlchemy not accepted by `str` type field.
**Root Cause:** Pydantic response schemas (`UserResponse`, `ConversationResponse`, `MessageResponse`, `AppResponse`) declared `id: str` but SQLAlchemy returns `uuid.UUID` objects.
**Fix:** Changed `id: str` to `id: uuid.UUID` in all response schemas.
**Prevention:** Use `uuid.UUID` type in Pydantic schemas when the database column is UUID.

---

### 2026-03-31 — DB — SSE generator stale session

**Error:** No `done` event sent after streaming — assistant messages not persisted.
**Context:** The SSE generator used the request-scoped SQLAlchemy session to save the assistant message after streaming completed, but the session was stale/closed inside the async generator.
**Root Cause:** FastAPI dependency-injected sessions are scoped to the request lifecycle, but the SSE generator outlives the request handler.
**Fix:** Created a fresh session via `get_session_factory()` inside the generator for saving the assistant message.
**Prevention:** Always use fresh sessions for DB operations inside SSE/streaming generators.

---

### 2026-04-01 — IFRAME — React events blocked in sandboxed iframes

**Error:** Buttons, inputs, forms inside iframe apps don't respond to clicks or typing.
**Context:** Iframe apps built with React, loaded with `sandbox="allow-scripts"` only (no `allow-same-origin`).
**Root Cause:** React's event delegation system requires `allow-same-origin` to properly attach event listeners to the document. Without it, React's synthetic event system silently fails.
**Fix:** Changed to `sandbox="allow-scripts allow-same-origin"` for first-party apps. Added CSP headers as defense-in-depth for iframe isolation.
**Prevention:** For first-party React apps, `allow-same-origin` is necessary. Use CSP headers + subdomain isolation for security instead of relying solely on sandbox attributes.

---

### 2026-04-01 — BUILD — Vite IIFE build vs module build confusion

**Error:** Apps showing old "Ask the chatbot" placeholder instead of new interactive UI.
**Context:** Dictionary app rebuilt with Vocabulary Builder UI but dist files still served old IIFE-format JS.
**Root Cause:** Vite configs had been set to IIFE output format (for the `allow-scripts`-only sandbox workaround). After switching to `allow-same-origin`, configs were reset but old dist files persisted. The hashed filenames masked whether the build was fresh.
**Fix:** Deleted all `dist/` directories and rebuilt from clean state. Reverted all vite.config.ts to standard module format.
**Prevention:** Always `rm -rf dist/` before rebuilding after changing vite config. Verify dist content matches source changes.

---

### 2026-04-01 — AGENT — LLM tool dispatch was fake (placeholder lambda)

**Error:** LLM described tool invocations in text but never actually called tools on iframes.
**Context:** The `build_tools_from_schemas` function used `func=lambda **kwargs: kwargs` as a placeholder. The system prompt said "describe what you would do with the tools."
**Root Cause:** The initial architecture used text-described tools rather than OpenAI's structured function calling. `.bind_tools()` was never called on the LLM instance.
**Fix:** Rewrote `graph.py` to use `llm.bind_tools()` with proper OpenAI function definitions. Added SSE `tool_call` events, frontend `invokeTool` dispatch, and POST `/tool-result` callback endpoint with `asyncio.Event` for async result waiting.
**Prevention:** Always wire end-to-end tool execution, not just tool description. Test the full loop: LLM call → SSE → iframe → result → LLM follow-up.

---

### 2026-04-01 — API — BaseHTTPMiddleware breaks asyncpg in tests

**Error:** `RuntimeError: Task got Future attached to a different loop`
**Context:** Running pytest with ASGI test client against FastAPI app using `@app.middleware("http")`.
**Root Cause:** `BaseHTTPMiddleware` (used by `@app.middleware("http")`) runs the endpoint in a separate task, which conflicts with asyncpg's single-connection-per-task model.
**Fix:** Replaced `@app.middleware("http")` with a pure ASGI middleware class (`SecurityHeadersMiddleware`) that doesn't create separate tasks.
**Prevention:** Avoid `BaseHTTPMiddleware` in async FastAPI apps that use asyncpg. Use raw ASGI middleware instead.

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
