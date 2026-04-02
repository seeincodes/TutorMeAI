# Google Classroom Integration — Design Spec

**Date:** 2026-04-02
**Status:** Approved
**Replaces:** Spotify integration (MVP12 in PRD)

## Overview

Replace the Spotify OAuth integration with Google Classroom as ChatBridge's third-party OAuth app. Google Classroom is K-12-native, avoids COPPA/ToS landmines, and provides genuine educational value (assignments, submissions, course management) within the AI tutor chat experience.

The design also introduces a provider-agnostic OAuth architecture and a three-tier app allowlist/blocklist system for K-12 safety.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Who connects? | Teacher only | COPPA-safe; teacher already has legitimate access to Classroom data |
| Tool set | Full (read + submissions + create) | Maximum demo value with role-gating for safety |
| Student data in iframe? | Never | Student names/PII stay in backend, only referenced in teacher chat sessions |
| Setup entry points | Dashboard + in-chat discovery | Maximize discoverability without forcing a flow |
| Assignment creation | Confirm-then-create | AI drafts, teacher reviews preview card in iframe, clicks to confirm |
| Spotify | Remove entirely | Council verdict: ToS/COPPA liability, rate limit blocker at scale |
| Future OAuth apps | Provider-agnostic architecture | oauth_config in AppRegistration, no code changes to add providers |

---

## 1. Provider-Agnostic OAuth Architecture

### 1.1 AppRegistration Extension

Add an `oauth_config` JSONB column to `app_registrations`:

```json
{
  "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
  "token_url": "https://oauth2.googleapis.com/token",
  "scopes": [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me",
    "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly"
  ],
  "client_id_env_var": "GOOGLE_CLASSROOM_CLIENT_ID",
  "client_secret_env_var": "GOOGLE_CLASSROOM_CLIENT_SECRET",
  "redirect_uri_env_var": "GOOGLE_CLASSROOM_REDIRECT_URI"
}
```

- `client_id_env_var` stores the **name** of the environment variable, not the secret itself.
- The OAuth router resolves credentials at runtime via `os.environ[oauth_config["client_id_env_var"]]`.
- Nullable — apps with `auth_type != "oauth2"` leave this as `null`.

### 1.2 OAuth Router Refactor

Replace all hardcoded Spotify logic in `web/backend/app/oauth/router.py`:

- Remove `app_id != "spotify"` guards.
- Remove hardcoded Spotify auth/token URLs and scopes.
- On any OAuth endpoint (`/authorize`, `/callback`, `/status`, `/disconnect`):
  1. Look up `AppRegistration` by `app_id`.
  2. Verify `auth_type == "oauth2"` and `oauth_config` is not null.
  3. Read URLs, scopes, and env var names from `oauth_config`.
  4. Proceed with existing PKCE flow (unchanged).
- Rename `get_spotify_token()` → `get_oauth_token(user_id, app_id, db)` — generic token retrieval with auto-refresh.

### 1.3 What Stays Unchanged

- `crypto.py` — Fernet encrypt/decrypt (provider-agnostic)
- `pkce.py` — PKCE pair generation (provider-agnostic)
- `OAuthToken` model — `(user_id, app_id)` keyed, no provider-specific columns
- `AppIframe.tsx` — generic postMessage protocol
- Agent tool loading — dynamic from `AppRegistration.tool_schemas`

### 1.4 Adding a Future OAuth App

1. Create an alembic migration inserting a new `AppRegistration` row with `oauth_config`.
2. Set the corresponding env vars.
3. Build the iframe app and proxy endpoints.
4. No changes to the OAuth router.

---

## 2. App Allowlist/Blocklist for K-12 Safety

### 2.1 Three-Tier Gating

| Level | Who controls | Scope |
|-------|-------------|-------|
| Platform | Admin | Global allowlist/blocklist for all OAuth apps |
| District | District admin | Further restricts from platform allowlist |
| Teacher | Teacher | Enables/disables allowed apps for their classroom |

### 2.2 Data Model

**Extend `app_registrations`:**

```
+ platform_status: str  -- 'allowed' | 'blocked' | 'pending_review'
+ requires_admin_approval: bool  -- default True for auth_type='oauth2'
```

**New table: `district_app_policies`:**

```
district_id: UUID (FK to districts)
app_id: str
status: str  -- 'allowed' | 'blocked'
UNIQUE(district_id, app_id)
```

Teacher-level toggles use the existing teacher dashboard app whitelist mechanism (already in PRD).

### 2.3 Enforcement Flow

When a teacher attempts to connect an OAuth app:

1. Check `app_registrations.platform_status == 'allowed'`
2. Check `district_app_policies` for this district + app (if no row, inherit platform status)
3. Check teacher's classroom whitelist
4. If blocked at any level, show reason: "This app is not available in your district" or "This app is pending platform review"
5. If all pass, show the OAuth connect button

### 2.4 Default Stance

New OAuth apps default to `platform_status: 'pending_review'`. An admin must explicitly set `'allowed'` before any teacher can connect. Secure-by-default.

---

## 3. Google Classroom Proxy Endpoints

### 3.1 Route Table

All routes under `/api/classroom/`, all require JWT auth.

| Endpoint | Method | Google Classroom API | Role Gate |
|----------|--------|---------------------|-----------|
| `/api/classroom/courses` | GET | `courses.list` | Teacher + Student |
| `/api/classroom/courses/{course_id}/assignments` | GET | `courseWork.list` | Teacher + Student |
| `/api/classroom/courses/{course_id}/assignments/{assignment_id}` | GET | `courseWork.get` | Teacher + Student |
| `/api/classroom/courses/{course_id}/assignments/{assignment_id}/submissions` | GET | `studentSubmissions.list` | Teacher only |
| `/api/classroom/courses/{course_id}/assignments` | POST | `courseWork.create` | Teacher only |

### 3.2 Role-Gated Response Filtering

```python
if current_user.role == "student":
    # Strip PII: no student names, emails, submission ownership
    response = strip_student_pii(google_response)
elif current_user.role == "teacher":
    # Full response
    response = google_response
```

Student sessions use the teacher's OAuth token (the teacher who connected the app for this classroom). The backend resolves which teacher token to use based on the student's enrolled classroom.

### 3.3 Token Resolution for Student Sessions

When a student triggers a Google Classroom tool:
1. Look up the student's classroom assignment (via existing `users.classroom_id` or equivalent FK).
2. Find the teacher for that classroom.
3. Retrieve the teacher's `OAuthToken` for `google-classroom`.
4. If no teacher has connected Google Classroom for this class, the agent responds: "Your teacher hasn't connected Google Classroom yet. Ask them to set it up!"

**Note:** If the current data model lacks a student→teacher/classroom mapping, a lightweight join table (`classroom_memberships` with `user_id`, `classroom_id`, `role`) may be needed. This should be confirmed during implementation planning.

### 3.4 Assignment Creation (Confirm-then-Create)

1. AI drafts assignment → sends `tool_invoke` with `create_assignment` + draft params to iframe.
2. Iframe renders editable preview card (title, description, due date, points).
3. Teacher clicks "Create" → iframe sends `tool_result` with `{confirmed: true, ...finalParams}`.
4. Backend receives confirmation, calls `courseWork.create`, returns the created assignment.
5. Teacher clicks "Cancel" → iframe sends `tool_result` with `{confirmed: false}`.
6. AI acknowledges: "No problem, assignment wasn't created."

---

## 4. AI Agent Tool Schemas

### 4.1 Tool Definitions

Registered in `AppRegistration.tool_schemas` for `google-classroom`:

```json
[
  {
    "name": "list_courses",
    "description": "List the teacher's Google Classroom courses",
    "parameters": {}
  },
  {
    "name": "list_assignments",
    "description": "List assignments for a specific course",
    "parameters": {
      "course_id": {"type": "string", "description": "The course ID"}
    }
  },
  {
    "name": "get_assignment",
    "description": "Get details for a specific assignment",
    "parameters": {
      "course_id": {"type": "string", "description": "The course ID"},
      "assignment_id": {"type": "string", "description": "The assignment ID"}
    }
  },
  {
    "name": "list_submissions",
    "description": "List student submissions for an assignment (teacher only)",
    "parameters": {
      "course_id": {"type": "string", "description": "The course ID"},
      "assignment_id": {"type": "string", "description": "The assignment ID"}
    }
  },
  {
    "name": "create_assignment",
    "description": "Draft a new assignment for teacher review before creation",
    "parameters": {
      "course_id": {"type": "string", "description": "The course ID"},
      "title": {"type": "string", "description": "Assignment title"},
      "description": {"type": "string", "description": "Assignment description/instructions"},
      "due_date": {"type": "string", "description": "Due date in ISO 8601 format"},
      "max_points": {"type": "number", "description": "Maximum points for the assignment"}
    }
  }
]
```

### 4.2 Tier Gating

In `TIER_ALLOWED_TOOLS`, `list_submissions` and `create_assignment` are excluded from student tiers. Students only see `list_courses`, `list_assignments`, `get_assignment`.

### 4.3 OAuth Status Check

The agent's system prompt includes:

> "If the user's message references assignments, homework, grades, submissions, courses, or Google Classroom, and no Google Classroom OAuth token exists for this user, suggest connecting before attempting tool use."

New helper: `get_oauth_status(user_id, app_id, db) -> {connected: bool, expired: bool}` (generalized from existing Spotify status endpoint).

---

## 5. Google Classroom Iframe App

### 5.1 Purpose

Visual companion to the chat. Shows structured data that's easier to scan visually than read in text: course cards, assignment lists, submission summaries, and the assignment creation preview.

### 5.2 Views

| View | Trigger | Content |
|------|---------|---------|
| Course cards | `list_courses` tool | Grid of course name, section, period |
| Assignment list | `list_assignments` tool | Sortable table: title, due date, points, status |
| Assignment detail | `get_assignment` tool | Full description, materials, due date |
| Submission summary | `list_submissions` tool | Bar chart or table — submitted/late/missing counts (no student names in DOM) |
| Assignment preview | `create_assignment` tool | Editable card with confirm/cancel buttons |

### 5.3 Tech Stack

- React + TypeScript + Tailwind (same as other apps)
- Vite build, served as static files at `/apps/google-classroom/index.html`
- Same postMessage protocol as all other iframe apps
- Sandbox: `allow-scripts allow-same-origin allow-forms` (first-party app)

### 5.4 Submission Summary Privacy

The `list_submissions` response shown in the iframe displays **aggregate counts only** (e.g., "24 submitted, 3 late, 2 missing"). Individual student names are only referenced in the teacher's chat text by the AI, never rendered in the iframe DOM.

---

## 6. In-Chat Discovery Flow

### 6.1 Detection

When a teacher sends a message referencing classroom concepts and has no `oauth_tokens` row for `google-classroom`:

1. Agent responds with a suggestion and emits a special SSE event.
2. Frontend renders an inline connect card in the chat stream.

### 6.2 SSE Event

```
event: oauth_prompt
data: {"app_id": "google-classroom", "message": "Connect Google Classroom to see your assignments"}
```

Frontend renders this as a styled card with a "Connect" button.

### 6.3 Connect Flow

1. Teacher clicks "Connect" → `window.open()` popup to `/api/oauth/google-classroom/authorize`
2. Standard PKCE flow completes → popup sends `postMessage({type: 'oauth_complete', app_id: 'google-classroom'})` and closes
3. Frontend updates connection state
4. Agent detects the new connection and automatically retries the original request

### 6.4 Dashboard Flow

Unchanged — teacher goes to settings, sees Google Classroom connection status, clicks connect/disconnect. Both entry points use the identical OAuth router.

### 6.5 Pre-Consent Explanation

Before the OAuth popup opens (in both dashboard and in-chat flows), ChatBridge shows:

> "ChatBridge will be able to: view your courses, view and create assignments, and view student submissions. It cannot delete anything or access student emails."

---

## 7. Spotify Removal

| Action | Details |
|--------|---------|
| Delete `apps/spotify/` | Entire directory |
| Migration | Set Spotify registration: `platform_status: 'blocked'`, `is_active: false` (preserve row for referential integrity) |
| Config cleanup | Remove `spotify_client_id`, `spotify_client_secret`, `spotify_redirect_uri` from `config.py` |
| Router cleanup | Remove all hardcoded Spotify URLs/scopes/checks (replaced by provider-agnostic lookup) |
| Agent cleanup | Remove Spotify tools from `TIER_ALLOWED_TOOLS` |
| Test cleanup | Remove Spotify-specific fixtures from conftest |

---

## 8. Google OAuth Scopes & Consent

### 8.1 Required Scopes

| Scope | Purpose |
|-------|---------|
| `classroom.courses.readonly` | List courses |
| `classroom.coursework.me` | Read + create assignments |
| `classroom.student-submissions.students.readonly` | Read submissions |

### 8.2 Google Cloud Project

- **MVP/Dev:** Consent screen in "Testing" mode (100 manually-added test users). No verification needed.
- **Production (post-sprint):** Requires Google's verification review and potentially Marketplace for Education listing. Document this as a follow-up task.

### 8.3 Future Consideration

Google supports incremental scope requests. For v1, request all scopes at once. If teachers balk at permissions, a future iteration could request read-only first, then prompt for write scope on first `create_assignment` attempt.

---

## Dependencies

- Google Cloud project with Classroom API enabled
- OAuth consent screen configured (Testing mode for MVP)
- Environment variables: `GOOGLE_CLASSROOM_CLIENT_ID`, `GOOGLE_CLASSROOM_CLIENT_SECRET`, `GOOGLE_CLASSROOM_REDIRECT_URI`
- Test Google Workspace for Education account(s) with sample courses/assignments
