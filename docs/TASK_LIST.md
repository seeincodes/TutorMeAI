# ChatBridge — Task List

## Phase 1: MVP

### 1. Project Setup & Infrastructure [MVP1, MVP3]
- [x] Fork/clone base repo, set up pnpm workspace for `web/frontend/`, `web/backend/`, `apps/`
- [x] Initialize React Vite app in `web/frontend/` with TypeScript + Tailwind
- [x] Initialize FastAPI project in `web/backend/` with uvicorn
- [x] Set up PostgreSQL on Railway, configure `DATABASE_URL`
- [x] Create SQLAlchemy async models for all 6 tables (users, conversations, messages, app_registrations, tool_invocations, oauth_tokens)
- [x] Set up Alembic with async engine, create initial migration
- [x] Seed demo accounts via Alembic migration (admin, teacher1, student1, student2)
- [ ] Configure `.env` with all required environment variables
- [ ] Set up Vite dev proxy to FastAPI backend

### 2. Authentication System [MVP1]
- [ ] Implement bcrypt password hashing with passlib
- [ ] Implement JWT generation (access + refresh tokens) with python-jose
- [ ] Create `/api/auth/login` endpoint — bcrypt verify → JWT in httpOnly/Secure/SameSite=Strict cookie
- [ ] Create `/api/auth/refresh` endpoint — server-side refresh token rotation
- [ ] Create `/api/auth/logout` endpoint — invalidate session
- [ ] Implement role-based middleware (student/teacher/admin)
- [ ] Create `/api/users/me` endpoint
- [ ] Build login page with seed credential hints
- [ ] Implement frontend auth state management and route guards

### 3. Chat Interface & Streaming [MVP2, MVP3]
- [ ] Create `/api/conversations` CRUD endpoints with per-user data isolation
- [ ] Create `/api/conversations/{id}/messages` POST endpoint with SSE streaming
- [ ] Set up LangGraph agent with GPT-4.1-mini and K-12 system prompt
- [ ] Implement SSE streaming from LangGraph to frontend via sse-starlette
- [ ] Build chat UI: message list, input box, streaming token display
- [ ] Build conversation sidebar with history list
- [ ] Implement `aria-live="polite"` on streaming messages
- [ ] Configure LangSmith tracing

### 4. App Registration & Tool Schema System [MVP4, MVP5]
- [ ] Create Pydantic models for app registration and tool schemas
- [ ] Create `/api/apps` endpoints (list, register, update status)
- [ ] Implement dynamic tool schema injection in LangGraph — two-phase routing (intent → schema load)
- [ ] Seed Chess app registration with tool schemas (new_game, make_move, get_board_state, analyze_position)
- [ ] Validate tool invocation params against registered Pydantic schemas

### 5. Iframe Embedding & PostMessage Protocol [MVP6, MVP7]
- [ ] Build iframe container component with `sandbox="allow-scripts"` (no `allow-same-origin`)
- [ ] Implement postMessage protocol: PlatformMessage and AppMessage interfaces
- [ ] Add origin validation and correlation ID tracking on both sides
- [ ] Implement `ui_ready` handshake — iframe signals ready before first tool invocation
- [ ] Build 30s timeout handler with error banner display
- [ ] Implement dual error display: inline banner + chatbot acknowledgment

### 6. Chess App — Full Integration [MVP8, MVP9, MVP10]
- [ ] Build Chess app in `apps/chess/` with chess.js + react-chessboard
- [ ] Implement tools: `new_game`, `make_move`, `get_board_state`, `analyze_position`
- [ ] Wire postMessage communication: platform sends moves, app validates and returns FEN
- [ ] Implement LLM mid-game analysis — chatbot reads FEN and suggests moves
- [ ] Implement hybrid completion signaling: checkmate → `completion` message + polling fallback
- [ ] Verify context retention: chatbot references game results in follow-up turns

### 7. Multiple Apps [MVP11]
- [ ] Build Math Calculator app (`apps/calculator/`) — math.js, single tool `calculate`
- [ ] Build Dictionary app (`apps/dictionary/`) — Free Dictionary API, tool `define_word`
- [ ] Build Weather app (`apps/weather/`) — OpenWeatherMap API via backend proxy, tool `get_weather`
- [ ] Build Flashcard Quiz app (`apps/flashcards/`) — stateful multi-turn quiz, tools `start_quiz`, `submit_answer`, `get_score`
- [ ] Build Life Skills Toolkit app (`apps/life-skills/`) — 5 tools: `plan_budget`, `calculate_interest`, `decision_matrix`, `plan_meals`, `optimize_schedule`
- [ ] Seed all app registrations with tool schemas
- [ ] Test multi-app routing: verify LLM correctly routes ambiguous queries

### 8. Spotify OAuth Integration [MVP12]
- [ ] Implement OAuth2 PKCE flow in FastAPI (`/api/oauth/spotify/authorize`, `/api/oauth/spotify/callback`)
- [ ] Build popup window OAuth flow (not iframe — sandbox blocks redirects)
- [ ] Encrypt and store tokens in PostgreSQL oauth_tokens table
- [ ] Implement auto-refresh on token expiry
- [ ] Build Spotify app (`apps/spotify/`) with embedded player
- [ ] Implement tools: `create_playlist`, `search_tracks`, `get_playlists`
- [ ] Add kid-friendly OAuth consent language in chatbot prompts

### 9. K-12 Safety & Error Handling [MVP13, MVP14]
- [ ] Verify no PII in any postMessage payload (inspect tool invocation params)
- [ ] Test OpenAI content moderation — send harmful prompts, verify refusal
- [ ] Add K-12 safety guidelines to LangGraph system prompt
- [ ] Implement tool result delimiters to prevent prompt injection via app results
- [ ] Implement iframe crash detection and recovery with retry option
- [ ] Add rate limiting via slowapi (per-IP and per-user)
- [ ] Verify `sandbox="allow-scripts"` blocks `window.parent.document` access
- [ ] Test per-user data isolation — student2 cannot see student1 data

## Phase 2: Polish

### 10. Teacher Dashboard
- [ ] Build teacher dashboard page with role-based route guard
- [ ] Implement app whitelist toggles per classroom
- [ ] Show conversation summaries (apps used, session duration, quiz outcomes)
- [ ] Add app suspension button
- [ ] Show OAuth connection status for students

### 11. Accessibility & UX
- [ ] Semantic HTML throughout (`<main>`, `<form>`, `<button>`)
- [ ] ARIA labels on all chat elements and interactive controls
- [ ] Keyboard navigation: Tab/Enter/Escape for all workflows
- [ ] WCAG AA color contrast verification
- [ ] Visible focus rings on all interactive elements
- [ ] Iframe `title` attributes for screen readers
- [ ] Session timeout with "Not you? Sign out" UI
- [ ] No client-side storage of sensitive data

### 12. API Documentation & Observability
- [ ] Enable FastAPI auto-generated Swagger/OpenAPI docs
- [ ] Verify LangSmith traces capture every tool call, routing decision, and token count
- [ ] Add tool invocation logging to `tool_invocations` table (duration, tokens, status)
- [ ] Review and document rate limiting thresholds

## Phase 3: Final

### 13. Deployment & Production Readiness
- [ ] Deploy FastAPI backend to Railway
- [ ] Deploy frontend (Vite build) — static hosting or Railway
- [ ] Configure production environment variables on Railway
- [ ] Verify CORS configuration for production domains
- [ ] Test full flow on deployed environment with seed accounts
- [ ] Verify SSE streaming works through Railway's proxy

### 14. Documentation & Submission
- [ ] Record demo video showing full user journey (login → chess → multi-app → Spotify OAuth)
- [ ] Write cost analysis report (LLM + infrastructure)
- [ ] Final Swagger review — all endpoints documented
- [ ] Social post for project showcase
- [ ] Final pass on all docs/ files — ensure accuracy
