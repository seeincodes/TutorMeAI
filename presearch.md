# ChatBridge Pre-Search Document

## Case Study Analysis

TutorMeAI's edge is configurability — teachers can shape the chatbot in ways competitors don't allow. Embedding third-party apps inside the chat is the next step, but it introduces two hard problems: keeping kids safe and keeping the chatbot in sync with whatever the app is doing.

The trust problem is about the fact that these users are children. If a third-party app breaks or turns out to be malicious, it's not just a bad experience — a child could see content they shouldn't, or their data ends up somewhere it shouldn't. That changes how I approached every decision. Sandboxing had to be built in from the start. Apps run in isolated iframes with strict CSP headers, minimal sandbox permissions, and no access to the parent page. The platform validates every app registration against Pydantic schemas, rate-limits tool invocations, and gives teachers control over which apps are available in their classrooms. In a K-12 context the default has to be locked down — you open things up intentionally, not the other way around.

The communication problem is about keeping the chatbot and the app on the same page. The chatbot needs to know what's happening inside the app, the app needs to receive instructions from the chatbot, and both sides need to agree on when an interaction is finished. Chess makes this concrete — the chatbot has to read a FEN string to analyze the board mid-game, the app has to validate moves, and when checkmate happens the conversation needs to pick back up naturally. I went with a hybrid approach for completion signaling: apps send an explicit "done" message through postMessage, and the LLM falls back to polling the app's state if that signal never arrives. Well-built apps get a clean lifecycle, poorly-built ones don't break the experience.

The irreducible invariant this architecture depends on: **the iframe trust boundary is structurally incapable of escalation.** No matter what an embedded app does — compliant or adversarial — it cannot access the parent DOM, read student PII, escalate its own permissions, or break out of the sandbox. The browser enforces this, not our code. Every design decision below is an elaboration of what that invariant requires in practice.

That invariant is what led me to sandboxed iframes over four other approaches I evaluated:

- **Server-side rendering** — the platform renders app UI on the server. Eliminates client-side risk entirely, but kills interactivity. A chess board needs drag-and-drop; a Spotify player needs real-time audio controls. Teachers see a static page, not an interactive tool. Too restrictive for educational apps that need to feel responsive.
- **Platform-controlled component library** — apps are built exclusively from platform-provided React components (dropdowns, boards, inputs). Keeps control tight, but locks every app into a constrained UI vocabulary. The chess board requires chess.js + react-chessboard; the Spotify embed requires its own player widget; math.js rendering needs custom DOM. This approach couples app updates to platform releases and breaks the moment an app needs something the library doesn't offer. Trust escalation risk: low (platform controls all rendering), but expressiveness is too limited to serve the range of educational tools this platform needs.
- **Restricted embedded web app (WebView-like model)** — apps run in a custom embedded browser context with an allow-list of browser APIs. Sounds like finer-grained control than iframes, but browser iframes already provide this model natively via the `sandbox` attribute. A custom WebView layer adds implementation cost and a new attack surface without stronger guarantees than what the browser already enforces. Trust escalation risk: medium (custom runtime is harder to audit than the browser's built-in sandbox).
- **Unrestricted client-side execution** — apps run in iframes without sandbox restrictions, with `allow-same-origin` enabled. Maximum flexibility, but the app can access parent cookies, localStorage, session tokens, and DOM. Indefensible when the users are children. Trust escalation risk: critical (app can read any student data on the page).
- **Sandboxed iframes + postMessage (chosen)** — `sandbox="allow-scripts"` with no `allow-same-origin`. Browser-enforced isolation where the app cannot access anything outside its own frame. PostMessage is designed for cross-origin communication, so the structured contract layer still works. Pydantic validates tool schemas on both sides. Trust escalation risk: none — the browser makes escalation structurally impossible, not just policy-prohibited.

The architectural bet here is that sandboxed iframes are the only approach that satisfies both safety and extensibility. A component library is safe but can't grow beyond one developer's capacity. Iframes with a governance layer can — the same registration, schema validation, and whitelisting infrastructure that protects 7 internal apps today could support third-party submissions tomorrow without changing the trust model.

FastAPI handles registration and OAuth, LangGraph orchestrates tool calling through OpenAI, React manages iframe lifecycle on the frontend. Tool schemas are injected dynamically per turn to keep context window usage tight. LangSmith traces every agent decision for debugging and cost visibility.

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

**Three-party principal structure:** K-12 platforms have a consent model that most software doesn't. Students (ages 5-18) cannot consent to data processing. Teachers and district IT admins control which apps are available and what data flows where. The developer (platform operator) bears liability for content safety and compliance. This means every governance decision has three stakeholders with different incentives and different technical visibility: the student who uses the app, the teacher/district who approved it, and the platform that hosts it. COPPA obligations also vary across the age band — a 7-year-old and a 17-year-old have different regulatory profiles. The architecture handles this by making the platform the single point of data control: apps never receive PII regardless of age, teachers whitelist apps per classroom, and the platform logs every tool invocation for auditability. The question "who approved this app, when, and what data does it touch?" must always be answerable from the audit trail.

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

### Governance & Schema Versioning (Post-Sprint Architecture)

This section describes the production governance model. During the 7-day sprint, all 7 apps are internal, so no review pipeline is needed. But the architecture must be designed now because these decisions constrain future implementation.

**The core problem:** An app approved with `{tool: "make_move", params: {from, to}}` could later update its schema to add `{tool: "send_message", params: {recipient, text}}` — a fundamentally different permission surface. Hash-based schema detection catches this, but only if the detection happens *before* the new schema takes effect.

**Fail-secure default:** Schema changes require re-approval before taking effect, not after detection. On app registration, the backend computes SHA-256 of `tool_schemas` and stores it. On each agent invocation, the backend recomputes the hash and rejects tool calls if the hash doesn't match the approved version. The app is automatically suspended (`is_active = false`) and an alert is created. This means a compromised schema never runs — it's blocked at invocation time, not discovered after the fact.

**Approval principal structure:**
- **Platform-level review** (centralized): A platform admin reviews tool schemas, declared permissions, iframe URL, and CSP policy before an app enters the catalog. This is the security gate — it requires technical expertise and happens once per app version. Reviewer records: who approved, when, what schema hash was approved, what data the app can access.
- **District-level whitelisting** (distributed): Teachers and district IT admins control which approved apps are available in their classrooms. This is the pedagogical appropriateness gate — it requires educational judgment and happens per-district. This separates "is this app safe?" (centralized, hard, requires expertise) from "is this app right for my 3rd graders?" (distributed, teacher-controlled).
- **Override authority:** District admins can emergency-suspend any app for their district. Platform admins can suspend globally. Both actions take effect immediately and are logged.
- **Decision timeline:** Schema change detected → app suspended within the same request (synchronous hash check). Platform admin alerted via webhook. Re-review SLA: 24 hours for schema-only changes, 72 hours for new tools. During review, the app remains suspended.

**Behavioral anomaly detection:** Hash-based detection catches schema drift but not compliant behavioral corruption — an app that never changes its schema while gradually producing educationally harmful outputs through valid tool calls. For this, the platform logs every tool invocation result in `tool_invocations` and surfaces anomalies to the teacher dashboard: unusually fast quiz completions (gaming), repetitive identical results (broken app), or sudden changes in result patterns. This is observational, not blocking — teachers make the judgment call.

**Rate limiting per app:** The existing slowapi middleware extends to per-app rate limits. Each app has a configurable requests-per-minute ceiling. Apps that exceed it are throttled, not suspended — resource exhaustion becomes a rate limit problem, not a security incident.

```sql
-- Additional columns on app_registrations
ALTER TABLE app_registrations ADD COLUMN schema_version INTEGER DEFAULT 1;
ALTER TABLE app_registrations ADD COLUMN schema_hash TEXT NOT NULL;
ALTER TABLE app_registrations ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE app_registrations ADD COLUMN approved_by UUID REFERENCES users(id);

-- Audit trail for schema changes and approval decisions
CREATE TABLE app_schema_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id TEXT REFERENCES app_registrations(app_id),
    old_schema JSONB,
    new_schema JSONB,
    old_hash TEXT,
    new_hash TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    decision TEXT CHECK (decision IN ('approved', 'rejected', 'pending', 'auto_suspended')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
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

### Adversarial App Behavior

The risk register above covers system failures. This section addresses a different question: what can a *technically compliant* app do to harm students, and how does the architecture contain it? The threat actor here isn't a sophisticated external attacker — it's more likely a bored teenager with browser DevTools during free period, or a future third-party app that behaves correctly during review and degrades later.

The iframe trust invariant (structurally incapable of escalation) means the adversary's ceiling is limited to what happens *inside* the sandbox. They cannot access student PII, parent DOM, cookies, or session tokens. The attacks below operate within that ceiling.

| Attack | What a Student Experiences | Detection / Containment | Detectable in Sprint? |
| --- | --- | --- | --- |
| **False completion signal** — App sends `{type: "completion"}` before work is actually finished (student spams "done" via DevTools to skip a lesson) | Chatbot thinks the activity is finished and moves on. Student skips educational content without completing it. | LLM verifies completion claims via `get_state` poll before acting on them. State response must be schema-valid and internally consistent (e.g., FEN string must show checkmate, quiz must have all answers submitted). Completion signals that contradict polled state are logged and ignored. | **Yes** — hybrid completion signaling already includes this fallback |
| **State spoofing** — App returns fabricated state data (fake quiz scores, wrong FEN position) | Student receives unearned credit or the chatbot gives advice based on a board position that doesn't exist. Teacher sees inflated progress. | Platform validates schema conformance and checks for impossible values (e.g., FEN with illegal piece counts, quiz score > total questions). LangSmith traces create an audit trail. Teacher dashboard flags anomalous patterns (100% scores with 2-second completion times). | **Partial** — schema validation is sprint-scope; anomaly dashboards are post-sprint |
| **PostMessage flooding** — App sends thousands of `state_update` messages per second (student opens DevTools console and runs a loop) | Platform slows down or becomes unresponsive. Other students on shared infrastructure may be affected. | Rate limit postMessage handling: max 10 messages/second per iframe. Excess messages dropped silently. Persistent violators (>100 dropped messages) trigger automatic iframe reload. | **Yes** — client-side rate limiter is a few lines of code |
| **Compliant behavioral corruption** — App never changes its schema but gradually produces educationally harmful outputs through valid tool calls (e.g., a flashcard app that always marks wrong answers as correct) | Student builds incorrect knowledge over time. No technical alarm fires because the app is operating within its approved schema. This is the hardest attack to detect. | Cannot be caught by schema validation or hash detection. Mitigated by: (1) all 7 sprint apps are first-party, so the code is auditable, (2) teacher dashboard surfaces result patterns for human review, (3) tool invocation logs in `tool_invocations` table enable retroactive analysis, (4) future: automated consistency checks comparing app results against LLM verification. | **No** — requires behavioral monitoring infrastructure post-sprint |
| **UI deception** — App renders phishing UI or inappropriate content within its iframe (future third-party risk) | Student sees content that looks like a login form or inappropriate material. Student may enter credentials or be exposed to harmful content. | Cannot inspect iframe content at runtime (same-origin policy works both ways). Mitigated by: all sprint apps are first-party, app review process for future apps, teacher whitelist, instant suspension via `is_active` flag, CSP restricts external resource loading within iframes. | **No** — requires app review process and CSP enforcement post-sprint |
| **Slow drip data exfiltration** — App encodes student behavior patterns (timing, error rates, interaction sequences) in outbound API calls | No immediate student-visible harm, but behavioral data is exfiltrated without consent. Violates COPPA/FERPA. | CSP `connect-src` on iframes restricts which domains the app can contact. First-party apps have no external API calls except through the FastAPI backend. Future third-party apps would require declared domains in app registration, reviewed at approval time. `sandbox="allow-scripts"` without `allow-same-origin` prevents cookie-based tracking. | **Partial** — sandbox blocks cookies now; CSP domain restriction is post-sprint |

---

## 11. Accessibility

Semantic HTML (`<main>`, `<form>`, `<button>`), ARIA labels on chat elements, `aria-live="polite"` on streaming messages, keyboard navigation (Tab/Enter/Escape), WCAG AA color contrast, visible focus rings. Iframes get `title` attributes for screen readers. Full WCAG audit is post-sprint.

---

## 12. Teacher Dashboard

Teachers see: app whitelist toggles (enable/disable per classroom), conversation summaries (which apps used, session duration, quiz outcomes), app suspension button, OAuth connection status. Teachers don't see: raw chat text without clicking in, system prompt, other classrooms' data. Sprint implementation: `role` field on users table, `classroom_apps` junction table, filtered message queries.
