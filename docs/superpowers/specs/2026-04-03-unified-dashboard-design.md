# Unified Dashboard — Design Spec

## Overview

Replace the current single-file `TeacherDashboard.tsx` with a unified dashboard at `/dashboard` that uses a left sidebar nav with role-based section visibility. Teachers see 3 sections (Students, Apps, Flags). Admins see all 7 (+ Districts, Marketplace, App Health, Costs). Each section is its own component, loaded by sub-route.

## Architecture

### Routing

```
/dashboard              → DashboardLayout (sidebar + outlet)
/dashboard/students     → StudentsSection
/dashboard/apps         → AppsSection
/dashboard/flags        → FlagsSection
/dashboard/districts    → DistrictsSection     (admin only)
/dashboard/marketplace  → MarketplaceSection   (admin only)
/dashboard/health       → HealthSection        (admin only)
/dashboard/costs        → CostsSection         (admin only)
```

Default redirect: `/dashboard` → `/dashboard/students`.

Role guard: admin-only sub-routes redirect non-admins to `/dashboard/students`.

### Layout Component (`DashboardLayout.tsx`)

Full-height flex container with:
- **Left sidebar** (200px, fixed) — nav items grouped by role
- **Main content** (flex-1) — renders the active section via `<Outlet />`

Sidebar structure:
1. **Brand header** — "ChatBridge" text (clickable, navigates to `/`)
2. **Back link** — "← Back to Chat" link below brand, navigates to `/`
3. **Teaching group** — label + nav items: Students, Apps, Flags
4. **Admin group** — label + nav items: Districts, Marketplace, App Health, Costs (hidden for teachers)
5. **User footer** — avatar, username, role badge, sign out button

Active nav item: brand-color left border + tinted background (matches wireframe). Flags item shows a badge with unreviewed count.

All icons are inline SVGs — no emojis. Icon style: 16x16, stroke-based, matching existing Sidebar.tsx patterns.

### Section Components

Each section is a standalone component that fetches its own data on mount.

#### 1. StudentsSection (`/dashboard/students`)
- **Roles:** teacher, admin
- **API:** `GET /api/teacher/dashboard`
- **UI:** Table of students with grade dropdown, reading level toggles, conversation count
- **Migrated from:** existing TeacherDashboard student tab (no new backend work)

#### 2. AppsSection (`/dashboard/apps`)
- **Roles:** teacher, admin
- **API:** `GET /api/teacher/dashboard` (apps array)
- **UI:** Grid/table of apps with active/inactive toggle, usage count, trust tier badge, status badge
- **New:** trust tier and status badges (data already in response once we add them)
- **Action:** `PATCH /api/teacher/apps/{app_id}` to toggle

#### 3. FlagsSection (`/dashboard/flags`)
- **Roles:** teacher, admin
- **API:** `GET /api/teacher/flags`
- **UI:** Table with student name, app, flagged content, reason, timestamp, reviewed status
- **Action:** `PATCH /api/teacher/flags/{flag_id}/review`
- **Migrated from:** existing TeacherDashboard flags tab

#### 4. DistrictsSection (`/dashboard/districts`)
- **Roles:** admin only
- **API:** `GET /api/districts`, `POST /api/districts/{id}/apps`, `DELETE /api/districts/{id}/apps/{app_id}`
- **UI:** List of districts with name, state, user count. Expandable rows showing approved apps for each district. Actions: approve app (dropdown + button), revoke app (delete button).
- **Note:** District creation is not yet a backend endpoint — this section is read-only for districts, write for app approvals. We can add a create district endpoint if needed.

#### 5. MarketplaceSection (`/dashboard/marketplace`)
- **Roles:** admin only
- **APIs:**
  - `GET /api/marketplace/catalog` — all apps with status, trust tier, developer info
  - `PATCH /api/marketplace/{app_id}/trust` — update trust tier
  - `GET /api/marketplace/screening-queue` — flagged apps
  - `POST /api/marketplace/{app_id}/clear-flags` — reset flags and reactivate
- **UI:** Table of all apps (catalog view) with columns: name, developer, status badge, trust tier dropdown, flag count, actions. Header buttons: "Screening Queue (N)" opens a filtered view of flagged/suspended apps. Trust tier is an inline dropdown that PATCHes on change.

#### 6. HealthSection (`/dashboard/health`)
- **Roles:** admin only
- **API:** `GET /api/observability/app-health`
- **UI:** Table with columns: app name, invocation count, success count, error count, timeout count, avg duration (ms). Rows sorted by invocation count descending. Color-coded: error/timeout counts in red when > 0. Auto-refresh every 30 seconds.

#### 7. CostsSection (`/dashboard/costs`)
- **Roles:** admin only
- **API:** `GET /api/observability/cost-dashboard`
- **UI:** Summary cards at top: total input tokens, total output tokens, estimated cost. Below: per-app breakdown table with columns: app name, input tokens, output tokens, invocations. Estimated cost calculated client-side using GPT-4.1-mini pricing ($0.40/1M input, $1.60/1M output).

### API Client Updates

Extend `web/frontend/src/lib/api.ts` with new functions:
- `fetchDistricts()` — `GET /api/districts`
- `approveDistrictApp(districtId, appId)` — `POST /api/districts/{id}/apps`
- `revokeDistrictApp(districtId, appId)` — `DELETE /api/districts/{id}/apps/{app_id}`
- `fetchMarketplaceCatalog()` — `GET /api/marketplace/catalog`
- `updateTrustTier(appId, tier)` — `PATCH /api/marketplace/{app_id}/trust`
- `fetchScreeningQueue()` — `GET /api/marketplace/screening-queue`
- `clearAppFlags(appId)` — `POST /api/marketplace/{app_id}/clear-flags`
- `fetchAppHealth()` — `GET /api/observability/app-health`
- `fetchCostDashboard()` — `GET /api/observability/cost-dashboard`

### Backend Changes

Minimal. The APIs are already built. Two small additions needed:

1. **Add `district_admin` to `require_role` checks** on teacher dashboard endpoint so district admins can also access it.
2. **Add trust_tier and developer_name to the teacher dashboard apps response** so the Apps section can show them without a separate marketplace call.

### File Structure

```
web/frontend/src/pages/
  dashboard/
    DashboardLayout.tsx      # Sidebar + Outlet
    StudentsSection.tsx       # Migrated from TeacherDashboard
    AppsSection.tsx           # Migrated + extended
    FlagsSection.tsx          # Migrated
    DistrictsSection.tsx      # New
    MarketplaceSection.tsx    # New
    HealthSection.tsx         # New
    CostsSection.tsx          # New
  TeacherDashboard.tsx         # Delete after migration complete
```

### Design Tokens

Use existing chatbox design tokens throughout (same as Sidebar.tsx):
- `bg-chatbox-background-primary` for sidebar
- `border-chatbox-border-primary` for borders
- `text-chatbox-tint-primary` for text
- `bg-chatbox-background-brand-primary` for active states
- Status badges: green for active, yellow for pending, red for suspended/error

### Navigation Updates

- `App.tsx`: Replace single `/dashboard` route with nested routes under `/dashboard/*`
- `Sidebar.tsx`: Both teacher and admin nav buttons navigate to `/dashboard` (existing behavior preserved)
- `DashboardLayout.tsx` sidebar: "Back to Chat" navigates to `/`

### Testing

Frontend tests are out of scope for this pass (no existing frontend test infrastructure). Backend APIs are already covered by 233 existing tests.

### Success Criteria

- Teacher logs in, clicks Dashboard → sees Students/Apps/Flags sections with sidebar nav
- Admin logs in, clicks Settings → sees all 7 sections
- All sections fetch live data from existing APIs
- Trust tier changes persist immediately
- Flag counts update on review
- App toggles work as before
- Costs show real token usage data
- Health table auto-refreshes
- "Back to Chat" returns to chat page
