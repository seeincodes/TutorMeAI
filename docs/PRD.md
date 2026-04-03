# ChatBridge — Product Requirements Document

## Overview

ChatBridge is an AI-powered chat platform for TutorMeAI that enables K-12 students to interact with a conversational tutor capable of invoking and embedding third-party educational apps (chess, flashcards, calculators, etc.) directly within the chat interface, all within a child-safe sandboxed environment.

## Problem Statement

TutorMeAI's existing chatbot is text-only. Teachers want interactive tools — chess boards, quizzes, music playlists — embedded in conversations, but integrating third-party apps into an AI chat raises two hard problems in K-12: keeping children safe from harmful content/data exposure, and keeping the chatbot in sync with whatever the embedded app is doing.

## Target Users

| Role | Description |
|------|-------------|
| **Students** (K-12) | Primary users. Interact with the chatbot and embedded apps for learning. Must be protected from inappropriate content and data leakage. |
| **Teachers** | Configure which apps are available in their classrooms. View conversation summaries and app usage. Can suspend apps. |
| **Admins** | Manage school accounts, users, and platform-wide settings. No self-registration — admins create all accounts. |
| **TutorMeAI (client)** | 10,000+ districts, 200,000+ daily users. Needs a deployed web demo proving the integration pattern works. |

## MVP Requirements

- [MVP1] User authentication with role-based access (student/teacher/admin) using bcrypt + JWT
- [MVP2] Real-time AI chat with streaming responses via SSE using LangGraph + OpenAI GPT-4.1-mini
- [MVP3] Conversation persistence in PostgreSQL with per-user data isolation
- [MVP4] Third-party app registration system with Pydantic-validated tool schemas
- [MVP5] Dynamic tool schema injection into LLM context (two-phase routing to minimize token usage)
- [MVP6] Sandboxed iframe embedding with `sandbox="allow-scripts"` only — no `allow-same-origin`
- [MVP7] PostMessage protocol for bidirectional platform↔app communication with origin validation and correlation IDs
- [MVP8] Chess app: full integration demonstrating stateful, bidirectional, mid-session LLM analysis (chess.js + react-chessboard)
- [MVP9] Hybrid completion signaling: explicit app `completion` message + LLM polling fallback
- [MVP10] Context retention: chatbot references app results in follow-up conversation turns
- [MVP11] Multi-app support: Calculator, Dictionary, Weather, Flashcard Quiz, Life Skills Toolkit
- [MVP12] Spotify app with OAuth2 PKCE flow (popup window, server-side token storage, embedded player)
- [MVP13] K-12 safety: no PII sent to apps, content moderation via OpenAI filters + system prompt, sandbox enforcement
- [MVP14] Error handling: iframe crash recovery, timeout handling (30s), dual error display (banner + chatbot acknowledgment)
- [MVP15] Completion verification: LLM polls app `get_state` to verify completion claims before acting on them (defends against false "done" signals)
- [MVP16] PostMessage rate limiting: frontend throttles incoming iframe messages to max 10/second per app, drops excess silently, reloads iframe on persistent abuse
- [MVP17] Per-app rate limiting: extend slowapi to enforce per-app request ceilings on `/api/apps/{app_id}/invoke`
- [MVP18] Schema integrity: compute SHA-256 hash of `tool_schemas` at registration, verify hash on each tool invocation, auto-suspend app on mismatch
- [MVP19] Schema audit trail: `app_schema_audit` table logging schema changes with diff, reviewer, and decision for FERPA/COPPA auditability

## Final Submission Features

**Polish & UX:**
- Accessible UI: semantic HTML, ARIA labels, keyboard navigation, WCAG AA contrast
- `aria-live="polite"` on streaming messages for screen readers
- Shared device safety: session timeout, no client-side storage, "Not you? Sign out" UI
- Seed accounts with demo credentials on login page

**Teacher Dashboard:**
- App whitelist toggles per classroom
- Conversation summaries (apps used, session duration, quiz outcomes)
- App suspension button
- OAuth connection status visibility

**Adversarial Resilience:**
- Completion verification via state polling (MVP15)
- PostMessage flood protection (MVP16)
- Per-app invocation rate limiting (MVP17)
- Schema integrity enforcement with auto-suspend on drift (MVP18)
- Schema change audit trail (MVP19)

**Observability & Cost:**
- LangSmith tracing for every tool call, routing decision, and token usage
- Rate limiting via slowapi (per-IP, per-user, and per-app)
- Tool invocation logging with duration, token counts, and status

**Documentation:**
- Swagger/OpenAPI docs for all endpoints
- Demo video
- Cost analysis report

## Performance Targets

| Metric | Target |
|--------|--------|
| Chat response first-token latency | < 1s |
| Tool invocation round-trip | < 30s (timeout) |
| Iframe load time | < 3s |
| JWT token expiry | 2h access / 7d refresh |
| Concurrent users (demo) | 50+ |
| LLM cost per session (~10 messages, 5 tool calls) | ~$0.012 |

## Scope Boundaries

**In Scope:**
- Web application (React Vite frontend + FastAPI backend)
- 7 built-in apps (Chess, Spotify, Weather, Flashcards, Dictionary, Math Calculator, Life Skills)
- PostgreSQL with Alembic migrations
- Railway deployment
- K-12 safety controls (COPPA/FERPA compliance architecture)
- OAuth2 PKCE for Spotify

**Out of Scope:**
- Electron desktop client (existing `src/` stays untouched)
- External/third-party app marketplace (all 7 apps built internally)
- Real-time collaborative features (multi-student same session)
- Full WCAG audit (post-sprint)
- Production key rotation (documented but not implemented in sprint)
- Behavioral anomaly detection for compliant corruption (post-sprint, teacher dashboard observational)
- District-level whitelisting governance workflow (post-sprint, designed in presearch)
- Parent notification system
- Mobile-native apps
