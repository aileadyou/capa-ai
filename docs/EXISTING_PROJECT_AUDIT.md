# Existing Project Audit — AI Coach Nova Revamp

Date: 2026-05-30
Auditor: Codex

## Executive Summary

The current repository is a runnable React/Vite app, but it is still mostly the previous Lead AI / CAPA quality dashboard and data-processing product. It can be reused as a shell and component source, but the product architecture does not yet match `docs/PLANS.md`.

`docs/PLANS.md` should win over the existing implementation. Based on that rule, the project should be treated as a major frontend refactor, not an incremental feature pass.

## Validation Baseline

- `npm run build` — passed.
- `npm run lint` — failed with 35 errors and 16 warnings.
- Git status before audit showed `docs/` as untracked.

Key build note:

- Production bundle is large: `index` JS is about 1.2 MB minified, mostly because the existing app still ships old screens, Supabase integration, data-processing UI, and many dependencies.

## Current Tech Stack Fit

Already present and usable:

- React + Vite + TypeScript.
- React Router.
- Tailwind CSS.
- Radix/shadcn-style primitives.
- Recharts.
- React Hook Form and Zod.
- Lucide icons.

Missing or not aligned:

- Zustand is required by the plan but not installed or used.
- `reactflow` is required for Decision Tree / RCA editor but is not installed.
- `html2pdf.js` is listed in the task plan but is not installed.
- The existing app uses `@tanstack/react-query`, `next-themes`, Supabase, `xlsx`, `papaparse`, and file/data-processing dependencies that are outside the new prototype scope unless deliberately kept for UI-only mock behavior.

## Major Conflicts With PLANS/RULES

### 1. Backend and real integrations exist

The new prototype must be frontend-only with JSON mock data. Current repo includes:

- `supabase/` migrations and edge functions.
- `src/integrations/supabase/`.
- Supabase auth/session usage in multiple pages and components.
- Real storage/database/function calls.
- A real AI gateway call in `supabase/functions/ai-data-quality-check/index.ts`.
- A real PubChem fetch in `supabase/functions/fetch-pubchem-data/index.ts`.

Recommendation: remove or quarantine all Supabase/backend/data-cleaning surfaces from the demo app. Keep only pure UI primitives that are useful.

### 2. Routing does not match required route map

Current `src/App.tsx` routes:

- `/`
- `/data-management`
- `/investigation`
- `/deviations`
- `/capa-actions`
- `/capa-actions/:id`
- `/audit-trail`
- `/reports`
- `/auth`

Required routes from `PLANS.md` / `RULES.md`:

- `/` redirecting to `/dashboard`
- `/dashboard`
- `/findings`
- `/findings/:id`
- `/capa`
- `/capa/new`
- `/capa/:id`
- `/capa/:id/8d/problem`
- `/capa/:id/8d/containment`
- `/capa/:id/8d/rca`
- `/capa/:id/8d/ca`
- `/capa/:id/8d/pa`
- `/capa/:id/8d/verification`
- `/capa/:id/8d/signoff`
- `/actions/corrective`
- `/actions/preventive`
- `/actions/consolidated`
- `/similarity`
- `/topics`
- `/audit-trail`
- `/notifications`
- `/settings/personas`

Coverage status: only `/audit-trail` conceptually overlaps. Everything else needs route migration or new placeholders.

### 3. Product identity is still old

Current UI still says:

- Lead AI
- CAPA AI
- AI Engine
- AI Ready
- Sarah Chen / James Wilson style mock users
- 2025 demo IDs and dates

Target identity:

- Product: AI Coach Nova.
- Assistant: Nova.
- English-first UI copy.
- Indonesian names/personas are allowed.
- 2026 golden cases with Major severity.

Recommendation: replace all user-facing product copy and demo data early, before detailed screen work.

### 4. Mock data is hardcoded inside components

Examples:

- Dashboard chart/task data in `src/pages/CapaDashboard.tsx`.
- CAPA list data in `src/pages/CapaActions.tsx`.
- CAPA detail data in `src/pages/CapaDetail.tsx`.
- Audit trail data in `src/pages/AuditTrail.tsx`.
- Deviation/finding list data in `src/pages/Deviations.tsx`.

Target:

- All major mock data in `src/mock-data/`.
- Runtime state in Zustand with localStorage persistence.

Recommendation: create types and mock JSON before rebuilding the screens, then point screens at services/store selectors.

### 5. Required state model is missing

Current persistence is limited and unrelated:

- Tutorial completion uses `localStorage`.
- Generic progress hook uses `localStorage`.
- Supabase client uses browser storage for auth.

Missing:

- Active persona persistence.
- CAPA workflow progress.
- 8D step state.
- Nova suggestion accept/edit/replace state.
- CA/PA state.
- Verification and approvals.
- Audit trail events.
- Notification read/unread state.
- Reset Demo Data.

Recommendation: add a single demo store with persisted Zustand state after types/mock data are in place.

### 6. Three golden cases are not implemented

Required golden cases:

- `DEV-2026-0341` → `CAPA-2026-0341`, Deviation, Bizzmine, 5-Whys.
- `AUD-2026-0089` → `CAPA-2026-0089`, Audit Finding, Q100+, Fishbone.
- `CMP-2026-0112` → `CAPA-2026-0112`, Complaint, Bizzmine Complaint, Decision Tree.

Current app uses 2025 deviation/CAPA examples and does not support all three end-to-end CAPA types.

Recommendation: build these three cases first and use them to drive all screens.

## Existing Code That Can Be Reused

Good candidates:

- `src/components/ui/*` primitives.
- `src/lib/utils.ts`.
- Recharts patterns from the current dashboard.
- Some layout ideas from `src/components/EnterpriseLayout.tsx`.
- Badge/table/card interaction patterns in current pages.
- `src/index.css` has a usable enterprise-medical token foundation, though it needs Nova-specific tokens and product cleanup.

Use with caution:

- `EnterpriseLayout` currently imports Lead AI branding and tutorial UI.
- `CapaSidebar`/sidebar components have old route labels and product naming.
- Tutorial/welcome components are not in the new plan and can become demo friction.

Likely delete/quarantine:

- Supabase integration and `supabase/` backend folder.
- Auth/Profile/ProtectedRoute flows.
- Data collection, cleaning, filtering, grouping, PubChem screens.
- Old stream/data-science components.

## Lint Failure Summary

`npm run lint` failed mainly because of old code:

- `no-explicit-any` errors in data-processing pages/components.
- React hook dependency warnings in old effects.
- Empty interface errors in UI template components.
- `require()` import in `tailwind.config.ts`.
- Supabase edge functions included in lint scope.

Recommendation: do not spend time fixing lint in old modules that will be removed. First reduce the app to the Nova prototype surface, then clean lint on the retained files.

## Coverage Matrix

| Area | Current Status | Gap |
|---|---|---|
| Frontend-only app shell | Partial | Existing shell exists, but includes backend/auth integrations. |
| Required route map | Not covered | Needs new router and placeholders. |
| Types/domain model | Not covered | No `src/types/*` Nova CAPA model. |
| Mock JSON data | Not covered | No `src/mock-data/`; data is hardcoded in pages. |
| Zustand persisted state | Not covered | Zustand missing. |
| Persona switcher | Not covered | No role switcher matching 5 personas. |
| Dashboard analytics | Partial concept | Existing dashboard can inspire charts, but data/copy/routes wrong. |
| Findings list/detail | Partial concept | Existing deviations page only partially maps, IDs/types wrong. |
| CAPA intake | Not covered | No `/capa/new` or mock source import flow. |
| 8D workflow | Not covered | Existing CAPA implementation steps are not the planned 8D flow. |
| Nova suggestions | Partial concept | Existing AI panels exist, but not Nova/mock JSON/accept-edit-replace. |
| Similarity analysis | Not covered | Component exists, but required route/data/flow missing. |
| Topics grouping | Not covered | Required route/data/flow missing. |
| CA/PA/consolidated action lists | Partial concept | Existing CAPA actions list is not split as required. |
| Audit trail | Partial | Existing page exists, but data/copy/domains/personas wrong. |
| Notifications | Not covered | Required route and state missing. |
| Reset Demo Data | Not covered | Required control missing. |

## Recommended Refactor Order

1. Rename project identity and strip demo blockers: remove welcome/tutorial/auth/backend entry points from the active route tree.
2. Add required dependencies only where missing: Zustand first; React Flow/html2pdf only when those screens are implemented.
3. Create `src/router.tsx` and required placeholder pages.
4. Create `src/types/*` from `PLANS.md`.
5. Create `src/mock-data/*` for personas, golden findings, CAPA cases, dashboard stats, Nova scripts, audit trail, and notifications.
6. Add mock services: source import delay, Nova delay, score calculation, audit event creation.
7. Add persisted Zustand demo store and Reset Demo Data.
8. Rebuild layout/navigation around AI Coach Nova and the required routes.
9. Build screens in demo order: dashboard → findings → CAPA intake/detail → 8D steps → actions → similarity/topics → audit trail/notifications.
10. Remove old Supabase/data-processing code from the active app and then clean lint.

## Immediate Next Task

Start with Phase 1 routing foundation from `docs/TO_DOS.md`:

- Redirect `/` to `/dashboard`.
- Create placeholders for every required route.
- Create a clean `NotFound`.
- Keep the existing app runnable while moving old pages out of the active route map.

