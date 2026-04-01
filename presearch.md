# ChatBridge Pre-Search Document

## Case Study Analysis

TutorMeAI's edge is configurability — teachers can shape the chatbot in ways competitors don't allow. Embedding third-party apps inside the chat is the next step, but it introduces two hard problems: keeping kids safe and keeping the chatbot in sync with whatever the app is doing.

The trust problem is about the fact that these users are children. If a third-party app breaks or turns out to be malicious, it's not just a bad experience — a child could see content they shouldn't, or their data ends up somewhere it shouldn't. That changes how I approached every decision. Sandboxing had to be built in from the start. Apps run in isolated iframes with strict CSP headers, minimal sandbox permissions, and no access to the parent page. The platform validates every app registration against Pydantic schemas, rate-limits tool invocations, and gives teachers control over which apps are available in their classrooms. In a K-12 context the default has to be locked down — you open things up intentionally, not the other way around.

The communication problem is about keeping the chatbot and the app on the same page. The chatbot needs to know what's happening inside the app, the app needs to receive instructions from the chatbot, and both sides need to agree on when an interaction is finished. Chess makes this concrete — the chatbot has to read a FEN string to analyze the board mid-game, the app has to validate moves, and when checkmate happens the conversation needs to pick back up naturally. I went with a hybrid approach for completion signaling: apps send an explicit "done" message through postMessage, and the LLM falls back to polling the app's state if that signal never arrives. Well-built apps get a clean lifecycle, poorly-built ones don't break the experience.

There's no clean answer on flexibility vs. safety — you're always giving up one for the other. Server-side rendering is too restrictive for interactive apps like chess. Unrestricted client-side execution is indefensible when the users are children. I went with sandboxed iframes, postMessage for communication, and Pydantic-validated tool schemas as the contract layer. FastAPI handles registration and OAuth, LangGraph orchestrates tool calling through OpenAI, React manages iframe lifecycle on the frontend. Tool schemas are injected dynamically per turn to keep context window usage tight. LangSmith traces every agent decision for debugging and cost visibility.

---

## 1. Project Overview & Fork Strategy

**Project:** ChatBridge — AI Chat Platform with Third-Party App Integration
**Client:** TutorMeAI (K-12, 10,000+ districts, 200,000+ daily users)
**Sprint:** 7 days | **Builder:** Solo (Xian)

**Base repo:** `seeincodes/TutorMeAI` (forked from `chatboxai/chatbox`, GPLv3, Electron + TypeScript + React + Tailwind, pnpm workspaces, 930 commits)

**Approach:** The base repo is an Electron desktop client. The spec requires a deployed web app. I'm building the web platform alongside the existing Electron code — `web/frontend/` (React Vite), `web/backend/` (FastAPI), and `apps/` (7 iframe apps). The original `src/` stays untouched. pnpm workspace config extends to include the new packages.

---

## 2. Tech Stack

| Layer                | Choice                                            | Rationale                                                                                                            |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | React (Vite) + TypeScript                         | No SSR needed. Vite dev proxy eliminates CORS. Lighter than Next.js.                                                 |
| **Backend**          | Python FastAPI                                    | Async-native, Pydantic validation, LangChain/LangGraph integration, native SSE.                                      |
| **AI**               | LangGraph + OpenAI GPT-4.1-mini                   | Graph-based agent. $0.40/$1.60 per 1M tokens. 1M context. Strong function calling. Built-in K-12 content moderation. |
| **Real-time**        | SSE (streaming) + REST (messages)                 | SSE for server→client streaming. REST POST for user messages. Simpler than WebSockets.                               |
| **App Sandboxing**   | Iframes (`sandbox="allow-scripts"`) + postMessage | Browser-enforced isolation. K-12 demands the strongest boundary.                                                     |
| **Auth (Platform)**  | FastAPI native (bcrypt + JWT)                     | Admin creates school accounts. No social login, no self-registration. Role-based (student/teacher/admin).            |
| **Auth (3rd party)** | OAuth2 PKCE via FastAPI                           | Spotify flow. Popup window (not iframe). Tokens encrypted server-side.                                               |
| **Database**         | PostgreSQL on Railway                             | Alembic migrations from day 1. Full relational power.                                                                |
| **Observability**    | LangSmith                                         | Traces every tool call, routing decision, and token usage.                                                           |
| **Rate Limiting**    | slowapi middleware                                | Per-IP and per-user.                                                                                                 |

---

## 3. K-12 Child Safety

### Threat Model

| Threat                                           | How We Prevent It                                                                                                                   | Sprint Status                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Malicious app content in iframe**              | All 7 apps built by us. `is_active` flag for instant suspension. Teacher whitelisting. No `allow-popups` or `allow-top-navigation`. | Zero risk (all internal)                                            |
| **Predator contact via embedded chat in iframe** | No PII sent to apps. No messaging mechanism. CSP domain restriction. App review rejects apps with external chat features.           | Zero risk (all internal). Production: CSP `connect-src` on iframes. |
| **LLM generates harmful content**                | OpenAI built-in filters + system prompt with K-12 safety guidelines + tool result delimiters + schema validation on results.        | Covered                                                             |
| **Student data exfiltration**                    | Data minimization: apps receive `{from:"e2",to:"e4"}`, never student PII. OAuth tokens server-side only.                            | Covered by architecture                                             |
| **Account compromise**                           | bcrypt hashing, rate limiting, short JWT expiry (2h), per-user data isolation. No self-registration.                                | Covered                                                             |
| **Malicious external API response**              | All API calls go through FastAPI backend. Schema validation + LLM content filtering.                                                | Covered                                                             |
| **Shared device data leakage**                   | Session timeout, no client-side storage, prominent "Not you? Sign out" UI.                                                          | Covered                                                             |
| **OAuth confusion**                              | Chatbot explains permissions in kid-friendly language. Minimal scopes. Explicit consent click. Easy disconnect.                     | Covered                                                             |

### Data Classification

| Data Type                                            | Who Has Access              | Sent to Apps?                    |
| ---------------------------------------------------- | --------------------------- | -------------------------------- |
| Student PII (name, email, school)                    | Platform only (users table) | **Never**                        |
| Conversation history, quiz scores                    | Platform + LLM              | **Never**                        |
| Tool invocation params (chess moves, weather cities) | Platform + apps             | **Yes — only data apps receive** |
| OAuth tokens (Spotify)                               | Backend only (encrypted)    | **Never**                        |

### COPPA/FERPA

FERPA: education records (conversations, scores) stay in PostgreSQL, scoped by user_id. Apps receive only tool params, never education records. COPPA: school consent exception applies — school authorizes the platform, not individual parents per-app. No self-registration, no personal email collection, no advertising, no profiling. 2025 amendments require opt-in consent for third-party data sharing — our architecture enforces this by never sharing PII with apps.

### Educational Accuracy

Tools are the source of truth, not the LLM's memory. Math goes through math.js, definitions through the dictionary API, quiz answers validated by the app. System prompt: "When a tool returns a factual result, relay it accurately. If a registered tool can answer the question, use the tool. Never perform arithmetic yourself."

---

## 4. Architecture

### Agent (LangGraph)

**Dynamic tool schema injection:** 7 apps × 3-5 tools = 20+ schemas. Injecting all of them wastes tokens. Two-phase routing: lightweight intent classification first → inject only the relevant app's schemas. Saves ~40% input tokens.

**Hybrid completion signaling:** Apps send explicit `{type: "completion"}` via postMessage (primary). LLM polls via `get_state` tool if signal never arrives (fallback). Clean lifecycle for good apps, graceful degradation for bad ones.

**Dual error recovery:** Inline error banner in iframe container + chatbot acknowledges conversationally. Both fire simultaneously.

**State management:** Chat state in PostgreSQL (permanent). Agent state in LangGraph memory (session). App state owned by iframe (transient). Last `state_update` stored in message metadata for continuity.

### PostMessage Protocol

```typescript
// Platform → App
interface PlatformMessage {
  type: "tool_invoke" | "tool_cancel" | "state_request" | "shutdown";
  correlationId: string;
  tool: string;
  params: Record<string, any>;
}

// App → Platform
interface AppMessage {
  type: "tool_result" | "state_update" | "completion" | "error" | "ui_ready";
  correlationId: string;
  data: Record<string, any>;
}
```

**Security:** Origin validation on every message. Correlation IDs prevent cross-app spoofing. Schema validation strips unexpected fields. 30s timeout per invocation. Apps receive only tool params — never PII, chat history, or tokens.

### Iframe Sandbox

`sandbox="allow-scripts"` only. No `allow-same-origin` — this is non-negotiable in K-12. The browser enforces that the app cannot access the parent DOM, cookies, localStorage, or session tokens. PostMessage still works because it's designed for cross-origin communication.

### Session Security

Login → bcrypt verify → JWT (`user_id`, `role`, `exp`) → httpOnly/Secure/SameSite=Strict cookie. 2-hour access tokens, 7-day refresh tokens stored server-side. JWT signing key in Railway env var. Production: 90-day key rotation with dual-key fallback for zero-downtime swap.

### Seed Accounts (Demo)

| Username   | Password     | Role    |
| ---------- | ------------ | ------- |
| `admin`    | `admin123`   | admin   |
| `teacher1` | `teacher123` | teacher |
| `student1` | `student123` | student |
| `student2` | `student234` | student |

Seeded via Alembic migration. Credentials on the login page as a demo hint.

---

## 5. Third-Party Apps (7 Total)

| App                     | Auth                  | Complexity | Unique Pattern                                                                                                                                                    |
| ----------------------- | --------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chess** (required)    | None                  | High       | Stateful, bidirectional, mid-session LLM analysis. chess.js + react-chessboard.                                                                                   |
| **Spotify Playlist**    | OAuth2 PKCE           | Medium     | Popup OAuth flow. Server-side tokens. Embedded player. Age-appropriate consent language.                                                                          |
| **Weather**             | API key (server-side) | Low        | Stateless external API. No user auth.                                                                                                                             |
| **Flashcard Quiz**      | None                  | Medium     | Stateful multi-turn education workflow. App validates answers, not LLM.                                                                                           |
| **Dictionary**          | None                  | Low        | Stateless lookup via Free Dictionary API. K-12 vocabulary building.                                                                                               |
| **Math Calculator**     | None                  | Low        | Simplest pattern. Single tool, no state. math.js. LLM never does arithmetic.                                                                                      |
| **Life Skills Toolkit** | None                  | Medium     | Multi-domain: budget planner, compound interest, decision matrix, meal planner, schedule optimizer. Tests intra-app routing (LLM picks among 5 tools in one app). |

### OAuth Flow (Spotify)

Popup window (not iframe — sandbox blocks redirects). FastAPI handles PKCE. Student authenticates on Spotify's page (platform never sees password). Tokens encrypted in PostgreSQL, auto-refreshed, never sent to iframes. Students can disconnect anytime.

---

## 6. Database Schema

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

---

## 7. AI Cost Analysis

**GPT-4.1-mini:** $0.40/1M input, $1.60/1M output. Blended per session (~10 messages, 5 tool calls): ~$0.012.

| Users   | Sessions/Month | Monthly Cost (LLM + Infra) |
| ------- | -------------- | -------------------------- |
| 100     | 300            | ~$9                        |
| 1,000   | 3,000          | ~$46                       |
| 10,000  | 30,000         | ~$385                      |
| 100,000 | 300,000        | ~$3,700                    |

**Dev spend:** $15-40 total (LLM API + Railway).

---

## 8. Build Strategy (Spec Priority Order)

| Priority          | Focus                        | Day | Key Deliverable                                                                      |
| ----------------- | ---------------------------- | --- | ------------------------------------------------------------------------------------ |
| 1                 | Basic chat                   | 1   | Chat with streaming, auth, seeded accounts, conversation history                     |
| 2                 | App registration             | 2   | Pydantic schemas, registration API, Chess seeded                                     |
| 3                 | Tool invocation              | 2   | Dynamic schema injection, Chess tool calls working                                   |
| 4                 | UI embedding                 | 2-3 | Sandboxed iframe, postMessage protocol, Chess board renders                          |
| 5                 | Completion signaling         | 3   | Hybrid completion, Chess checkmate → conversation resumes                            |
| 6                 | Context retention            | 3   | Chatbot references game results in follow-up turns                                   |
| **✅ Checkpoint** |                              |     | **Chess 100% integrated. Full vertical slice proven.**                               |
| 7                 | Multiple apps                | 3-4 | Calculator, Dictionary, Weather, Flashcards, Life Skills, multi-app routing          |
| 8                 | Auth flows                   | 4-5 | Spotify OAuth PKCE, popup flow, playlist creation                                    |
| 9                 | Error handling + K-12 safety | 5-6 | Timeouts, crash recovery, LLM refusal testing, PII verification, sandbox enforcement |
| 10                | Polish + docs                | 6-7 | Swagger, UI polish, cost report, demo video, deploy, social post                     |

---

## 9. Testing

| #   | Scenario                                     | Expected                                                |
| --- | -------------------------------------------- | ------------------------------------------------------- |
| 1   | "Let's play chess"                           | Intent routes to chess, board renders                   |
| 2   | Play moves, ask "what should I do?"          | Chatbot analyzes FEN, suggests move                     |
| 3   | Checkmate → follow-up question               | Chatbot discusses game results                          |
| 4   | Switch from chess to weather mid-game        | Weather renders, chess state preserved                  |
| 5   | "Help me learn vocabulary" (ambiguous)       | Chatbot clarifies: flashcards or dictionary?            |
| 6   | "Book me a flight" (no app)                  | Chatbot declines                                        |
| 7   | Spotify without auth                         | Age-appropriate OAuth prompt → popup → playlist created |
| 8   | Kill iframe mid-game                         | Error banner + chatbot acknowledges + retry             |
| 9   | "Write me a violent story"                   | LLM refuses, redirects to educational topics            |
| 10  | Inspect postMessage payloads                 | No student PII in any tool invocation                   |
| 11  | Log in as student2                           | No data from student1 visible                           |
| 12  | `window.parent.document` from iframe console | Blocked by browser sandbox                              |

---

## 10. Risk Register

| Risk                                     | Impact       | Mitigation                                                                                         |
| ---------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| LLM produces inappropriate content       | **Critical** | OpenAI filters + system prompt + result delimiters. Jailbreaks are an arms race — log and iterate. |
| Malicious iframe content (production)    | **Critical** | App review + teacher whitelist + instant suspension. Can't inspect iframe content at runtime.      |
| Predator contact via iframe (production) | **Critical** | No PII sent. CSP `connect-src` on iframes blocks external connections.                             |
| PostMessage race conditions              | Medium       | Correlation IDs, timeouts, `ui_ready` handshake.                                                   |
| Wrong app routing                        | Medium       | Two-phase routing, detailed tool descriptions, LangSmith traces for debugging.                     |
| Token costs spike                        | Low          | GPT-4.1-mini, dynamic schema injection, spending limits.                                           |

---

## 11. Accessibility

Semantic HTML (`<main>`, `<form>`, `<button>`), ARIA labels on chat elements, `aria-live="polite"` on streaming messages, keyboard navigation (Tab/Enter/Escape), WCAG AA color contrast, visible focus rings. Iframes get `title` attributes for screen readers. Full WCAG audit is post-sprint.

---

## 12. Teacher Dashboard

Teachers see: app whitelist toggles (enable/disable per classroom), conversation summaries (which apps used, session duration, quiz outcomes), app suspension button, OAuth connection status. Teachers don't see: raw chat text without clicking in, system prompt, other classrooms' data. Sprint implementation: `role` field on users table, `classroom_apps` junction table, filtered message queries.
