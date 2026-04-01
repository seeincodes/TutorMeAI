# ChatBridge — Testing Strategy

## Testing Pyramid

```
        ╱╲
       ╱ E2E ╲          10% — Full user journeys (login → chat → app → completion)
      ╱────────╲
     ╱Integration╲      30% — API endpoints, DB queries, LangGraph tool routing
    ╱──────────────╲
   ╱   Unit Tests   ╲   60% — Schema validation, auth logic, postMessage parsing, app tools
  ╱──────────────────╲
```

## Coverage Targets

| Layer | Target % | Tool |
|-------|----------|------|
| Unit | 80%+ | pytest (backend), vitest (frontend) |
| Integration | 70%+ | pytest + httpx TestClient (backend), vitest + MSW (frontend) |
| E2E | Key flows only | Playwright or manual verification |

## Test Categories

### Unit Tests (60%)

**Backend:**
- Pydantic schema validation: app registration schemas, tool invocation params, postMessage message types
- Auth logic: JWT generation/verification, bcrypt hash/verify, role checking
- Tool schema injection: verify only target app's schemas are injected
- Intent classification: verify routing logic maps queries to correct apps
- OAuth PKCE: code verifier/challenge generation, token encryption/decryption

**Frontend:**
- PostMessage parsing: validate incoming AppMessage format, reject malformed messages
- Correlation ID tracking: verify IDs match between request and response
- Chat state management: message list updates, streaming token accumulation
- Iframe sandbox attribute verification: ensure `allow-scripts` only, no `allow-same-origin`

**Apps:**
- Chess: move validation via chess.js, FEN generation, checkmate detection
- Calculator: math.js expression evaluation, edge cases (division by zero, overflow)
- Flashcards: quiz state machine (start → answer → score), answer validation
- Life Skills: budget calculation, compound interest formula, decision matrix scoring

### Integration Tests (30%)

**API Endpoints:**
- Auth flow: login → receive JWT → access protected route → refresh → logout
- Conversation CRUD: create → send messages → retrieve history → verify user isolation
- App registration: register → list → invoke tool → verify response schema
- OAuth flow: authorize URL generation → callback token storage → disconnect
- Rate limiting: verify slowapi blocks after threshold

**Database:**
- Alembic migration up/down for all tables
- Foreign key constraints: cascade delete user → conversations → messages
- JSONB queries on tool_invocations.params and messages.metadata
- User isolation: query with user_id filter never returns other users' data

**LangGraph Agent:**
- Tool routing: "play chess" → chess app, "what's the weather" → weather app
- Ambiguous query handling: "help me study" → clarification response
- No-app query: "book a flight" → polite decline
- Content moderation: harmful prompt → refusal
- Schema injection: verify only relevant schemas present in LLM context per turn

### E2E Tests (10%)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Chess full game | Login → "Let's play chess" → play moves → "what should I do?" → checkmate → follow-up | Board renders, moves validated, FEN analysis, completion signal, chatbot discusses results |
| 2 | Multi-app switch | Chess game → "check the weather in Tokyo" → return to chess | Weather renders, chess state preserved on return |
| 3 | Spotify OAuth | "Make me a playlist" → OAuth popup → auth → playlist created | Popup opens, tokens stored, iframe loads, playlist visible |
| 4 | Content safety | Login as student → send harmful prompt → inspect postMessage payloads | LLM refuses, no PII in any tool invocation |
| 5 | Data isolation | Login as student1 → create conversation → login as student2 → verify no cross-access | student2 sees only their own conversations |
| 6 | Iframe sandbox | Open browser console in iframe → `window.parent.document` | Blocked by browser sandbox policy |
| 7 | Error recovery | Kill iframe mid-game → verify error banner + chatbot acknowledgment → retry | Dual error display, retry option works |
| 8 | Ambiguous routing | "Help me learn vocabulary" | Chatbot asks: flashcards or dictionary? |
| 9 | Teacher dashboard | Login as teacher → view dashboard → toggle app → verify student sees change | App whitelist updates reflected |
| 10 | Session timeout | Wait for token expiry → attempt action → verify re-auth | Redirect to login, no stale data displayed |

## CI Integration

**Planned pipeline (post-sprint):**
```
push → lint (ruff + eslint) → type check (mypy + tsc) → unit tests → integration tests → build
```

**During sprint:**
- Run `pytest` manually for backend tests
- Run `pnpm test` (vitest) for frontend/app tests
- E2E scenarios verified manually against running dev environment
- LangSmith dashboard for agent behavior verification

## Requirement Coverage Matrix

| Requirement | Test Suite | Test Type |
|-------------|-----------|-----------|
| [MVP1] Auth with role-based access | `tests/test_auth.py` | Unit + Integration |
| [MVP2] Real-time AI chat with streaming | `tests/test_chat.py`, `tests/test_agent.py` | Integration |
| [MVP3] Conversation persistence | `tests/test_conversations.py` | Integration |
| [MVP4] App registration with Pydantic schemas | `tests/test_apps.py` | Unit + Integration |
| [MVP5] Dynamic schema injection | `tests/test_agent.py::test_schema_injection` | Unit + Integration |
| [MVP6] Sandboxed iframe embedding | `web/frontend/src/__tests__/iframe.test.ts` | Unit + E2E (#6) |
| [MVP7] PostMessage protocol | `web/frontend/src/__tests__/postmessage.test.ts` | Unit |
| [MVP8] Chess full integration | `apps/chess/src/__tests__/`, E2E #1 | Unit + E2E |
| [MVP9] Hybrid completion signaling | `tests/test_agent.py::test_completion`, E2E #1 | Integration + E2E |
| [MVP10] Context retention | E2E #1 (follow-up after checkmate) | E2E |
| [MVP11] Multiple apps | `apps/*/src/__tests__/`, `tests/test_agent.py::test_routing` | Unit + Integration |
| [MVP12] Spotify OAuth | `tests/test_oauth.py`, E2E #3 | Integration + E2E |
| [MVP13] K-12 safety | `tests/test_safety.py`, E2E #4, #6 | Integration + E2E |
| [MVP14] Error handling | `tests/test_errors.py`, E2E #7 | Integration + E2E |
