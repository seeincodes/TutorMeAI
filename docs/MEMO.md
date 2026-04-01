# ChatBridge — Architecture Memo

## Project Summary

ChatBridge extends TutorMeAI's existing chatbot with a third-party app integration layer that allows interactive educational tools (chess, quizzes, calculators, music) to be embedded directly within AI chat conversations. The architecture prioritizes child safety through browser-enforced iframe sandboxing, a strict postMessage protocol, and zero PII exposure to embedded apps, while maintaining a flexible tool-calling interface powered by LangGraph and OpenAI.

## Key Architecture Decisions

### 1. Sandboxed Iframes over Server-Side Rendering for App Embedding

Chose `sandbox="allow-scripts"` iframes with postMessage communication over server-side rendering of app content. SSR would be safer (no client-side execution) but too restrictive for interactive apps like chess boards or music players. Full client-side execution without sandboxing is indefensible when users are children. The iframe sandbox provides browser-enforced isolation — apps cannot access the parent DOM, cookies, localStorage, or session tokens. `allow-same-origin` is explicitly excluded, which is non-negotiable in K-12.

**Rejected:** Server-side rendering (too restrictive for interactive apps), unsandboxed iframes (unacceptable risk for children), Web Components (insufficient isolation guarantees).

### 2. Two-Phase Routing with Dynamic Schema Injection over Full Schema Loading

With 7 apps × 3-5 tools each = 20+ tool schemas, injecting all schemas into every LLM call wastes ~40% of input tokens. Instead, a lightweight intent classification step first determines which app the user wants, then only that app's schemas are injected for tool calling. This keeps cost manageable at scale (200K daily users) while preserving routing accuracy.

**Rejected:** Loading all schemas every turn (expensive, clutters context), hardcoded keyword routing (too brittle, can't handle ambiguous requests like "help me learn vocabulary").

### 3. Hybrid Completion Signaling over Single-Method Approaches

Apps signal completion via an explicit `{type: "completion"}` postMessage (primary path). If the signal never arrives (app crashes, developer forgot), the LLM falls back to polling the app's state via a `get_state` tool. This means well-built apps get a clean lifecycle, and poorly-built apps don't break the conversation flow.

**Rejected:** Only explicit signals (breaks on crash/bad apps), only polling (wasteful, adds latency), timeout-only (can't distinguish "still working" from "crashed").

### 4. SSE + REST over WebSockets for Real-Time Communication

SSE handles server→client streaming (LLM token streaming). REST POST handles client→server messages. This is simpler than WebSockets for what is fundamentally a unidirectional streaming pattern. WebSockets add connection management complexity (reconnection, heartbeats) without benefit here since the client only needs to send discrete messages, not stream.

**Rejected:** WebSockets (over-engineered for this use case), long polling (poor UX for streaming), gRPC (no browser-native support).

### 5. FastAPI Native Auth over Auth0/Clerk/Supabase Auth

The platform has specific constraints: no self-registration (admin creates all accounts), role-based access (student/teacher/admin), and school-managed accounts. External auth providers add complexity and cost for features we don't need (social login, magic links, MFA). bcrypt + JWT with httpOnly/Secure/SameSite=Strict cookies is straightforward and keeps control in-house.

**Rejected:** Auth0 (overkill, adds external dependency), Supabase Auth (ties to Supabase ecosystem), Clerk (unnecessary features, cost at scale).

### 6. PostgreSQL over NoSQL for All Persistent Data

Conversations, messages, tool invocations, and app registrations all have relational structure with foreign keys. PostgreSQL with Alembic migrations gives schema enforcement, JSONB for flexible metadata (tool params/results), and strong data isolation guarantees needed for FERPA compliance (scoped queries by user_id).

**Rejected:** MongoDB (schema-less is a liability for compliance), SQLite (no concurrent access for production), DynamoDB (overkill, vendor lock-in).

### 7. All 7 Apps Built Internally for Sprint

Instead of building an app marketplace, all 7 apps are built by the solo developer. This eliminates the trust problem for the sprint — no app review pipeline needed, no risk of malicious content. The architecture supports external apps (registration API, sandboxing, schema validation), but the sprint proves the pattern with known-safe apps.

**Rejected:** Open marketplace in sprint (impossible to review third-party apps solo in 7 days), fewer apps (doesn't demonstrate multi-app routing and varied integration patterns).

## Processing Strategy

1. **User sends message** → REST POST to `/api/conversations/{id}/messages`
2. **Intent classification** → LangGraph lightweight node determines target app (or none)
3. **Schema injection** → Only the target app's tool schemas are loaded into context
4. **LLM processes** → GPT-4.1-mini generates response, may include tool calls
5. **Tool invocation** → Backend validates params against Pydantic schema, sends to frontend via SSE
6. **Frontend dispatches** → postMessage to target iframe with correlation ID
7. **App processes** → Iframe executes tool, returns result via postMessage
8. **Result routing** → Frontend sends result back to backend, LLM incorporates into response
9. **Completion** → App sends `completion` signal (or LLM polls via `get_state` fallback)
10. **Streaming** → All LLM tokens streamed to client via SSE in real-time

## Known Failure Modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Iframe crashes or hangs | User stuck, conversation blocked | 30s timeout + error banner + chatbot acknowledges conversationally + retry option |
| PostMessage race condition | Tool result attributed to wrong invocation | Correlation IDs on every message, `ui_ready` handshake before first invocation |
| LLM routes to wrong app | User sees unexpected app, confusion | Two-phase routing with detailed tool descriptions, LangSmith traces for debugging |
| LLM generates harmful content | Child exposed to inappropriate material | OpenAI built-in filters + system prompt with K-12 guidelines + tool result delimiters |
| OAuth popup blocked by browser | Spotify auth fails silently | Detect popup blocker, show explicit instructions to allow popups for this site |
| Database connection exhaustion | All requests fail | Connection pooling via asyncpg, Railway auto-scaling, circuit breaker pattern |
| Spotify token expiry mid-session | Playlist creation fails | Auto-refresh on 401, graceful re-auth prompt if refresh fails |
