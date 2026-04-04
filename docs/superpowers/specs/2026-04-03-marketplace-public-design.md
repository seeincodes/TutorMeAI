# Marketplace Public UI, Classrooms & Review Workflow

**Date:** 2026-04-03
**Status:** Approved

## Summary

Add a public-facing marketplace for app discovery, per-classroom app whitelisting, a developer submission form, app detail pages, and a multi-stage admin review workflow.

## Architecture

### New Data Models

**Classroom** — created by teachers to group students
- `id` (UUID PK), `name` (Text), `teacher_id` (FK → users), `created_at`

**ClassroomMembership** — assigns students to classrooms
- `id` (UUID PK), `classroom_id` (FK → classrooms), `student_id` (FK → users), `joined_at`
- Unique constraint: (classroom_id, student_id)

**ClassroomAppWhitelist** — per-classroom app enablement
- `id` (UUID PK), `classroom_id` (FK → classrooms), `app_id` (Text, FK → app_registrations.app_id), `added_by` (FK → users), `added_at`
- Unique constraint: (classroom_id, app_id)

### Visibility Rules

- **Teachers**: see full marketplace catalog (all apps with `status=active` and `is_active=True`)
- **Students**: see only apps whitelisted for any classroom they belong to
- **Admins**: see everything (existing catalog endpoint already handles this)

### New Backend Endpoints

**Classroom management** (`/api/classrooms`):
- `POST /api/classrooms` — teacher creates a classroom
- `GET /api/classrooms` — teacher lists their classrooms
- `POST /api/classrooms/{id}/members` — add student to classroom
- `DELETE /api/classrooms/{id}/members/{student_id}` — remove student
- `GET /api/classrooms/{id}/members` — list classroom members
- `POST /api/classrooms/{id}/apps` — whitelist an app for a classroom
- `DELETE /api/classrooms/{id}/apps/{app_id}` — remove app from whitelist
- `GET /api/classrooms/{id}/apps` — list whitelisted apps

**Public marketplace** (`/api/marketplace`):
- `GET /api/marketplace/browse` — returns apps visible to the current user (teachers: full active catalog; students: their whitelisted apps)
- `GET /api/marketplace/{app_id}/detail` — full app detail (description, developer info, tools, trust tier, privacy policy, age rating)

**Admin review** (`/api/marketplace`):
- `GET /api/marketplace/review-queue` — apps in `pending_review` with their screening results
- `POST /api/marketplace/{app_id}/review` — admin action: approve, reject, or request_changes with optional note

### New Frontend Routes

- `/marketplace` — public browse page (hybrid card grid, category chips, search)
- `/marketplace/:appId` — dedicated app detail page (two-column: info left, metadata sidebar right)
- `/marketplace/submit` — developer submission form (public, no auth required)

### Marketplace Browse Page

- Hybrid card grid layout (2-3 columns, responsive)
- Each card: icon/logo, name, short description, trust badge, "Add to Classroom" button (teachers only)
- Category filter chips at top + search bar
- Teachers see all active apps; students see only their whitelisted subset

### App Detail Page

- Dedicated page at `/marketplace/:appId`
- Two-column layout: app info (left), metadata sidebar (right)
- Left column: icon, name, trust badge, full description, tools list with descriptions
- Right column: age rating, auth type, privacy policy link, website link, developer name/email, "Add to Classroom" button (teachers)
- "Back to Marketplace" link at top
- "Add to Classroom" opens a dropdown/picker listing the teacher's classrooms; selecting one calls `POST /api/classrooms/{id}/apps`

### Developer Submission Form

- Public page at `/marketplace/submit` — no authentication required
- Fields: app_id, name, description, iframe_url, tool_schemas (JSON), developer_name, developer_email, website_url (optional), privacy_policy_url (optional), logo_url (optional), age_rating dropdown
- Submits to existing `POST /api/marketplace/submit` endpoint
- Success state shows "Submitted for review" confirmation with the app_id

### Admin Review Workflow

Three-stage pipeline displayed in the dashboard MarketplaceSection:

1. **Submitted** — app created as `pending_review`
2. **Auto-screened** — existing content screening runs on submission (moderation API on description + tool schemas)
3. **Manual review** — admin sees screening results alongside app details

Admin actions:
- **Approve** — sets `status=active`, `is_active=True`, records `approved_at` and `approved_by`
- **Reject** — sets `status=rejected` (new status value), records review note
- **Request Changes** — sets `status=changes_requested` (new status value), records review note

Review queue shows: app name, developer, submission time, screening results (pass/warn/fail badges), tools count, and action buttons.

### Status Values Update

AppRegistration.status needs two new values:
- `rejected`
- `changes_requested`

Update the existing check constraint or add these to the allowed values.

## Testing Strategy

Red/green TDD throughout. Test layers:
1. **Model tests** — Classroom, ClassroomMembership, ClassroomAppWhitelist creation and constraints
2. **API tests** — classroom CRUD, whitelist management, browse visibility rules, detail endpoint, review actions
3. **Frontend tests** — marketplace browse rendering, detail page, submission form validation, review queue

## Out of Scope

- Developer portal (analytics dashboard for developers)
- App ratings/reviews
- App categories as a data model (filter chips use `age_rating` or a future `category` field)
- Notification system for review status changes
