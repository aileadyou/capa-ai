# BUILD_LOGS.md

This file records all completed work sessions for the AI Coach Nova prototype.

Every AI agent must append a dated entry after finishing work.

## 2026-05-30 — Existing Project Audit

### Completed
- Audited current repository against `docs/PLANS.md`, `docs/RULES.md`, and `docs/TO_DOS.md`.
- Identified major conflicts between the existing Lead AI/Supabase app and the AI Coach Nova frontend-only prototype plan.
- Added an audit report with coverage matrix and recommended refactor order.
- Restored `BUILD_LOGS.md` to the expected build-log format because it contained duplicated handoff content.

### Changed Files
- `docs/EXISTING_PROJECT_AUDIT.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npm run build` — passed.
- `npm run lint` — failed with 35 errors and 16 warnings from existing legacy/template code.
- Manual audit — completed.

### Notes
- Existing app is runnable, but most current routes/data/integrations conflict with the new frontend-only mock-data prototype rules.
- The current docs directory is untracked in git status.

### Next Recommended Task
- Implement Phase 1 routing foundation from `docs/TO_DOS.md`.

## 2026-05-30 — Nova Foundation Routing and Domain Types

### Completed
- Installed required missing prototype dependencies: `zustand`, `reactflow`, and `html2pdf.js`.
- Replaced the active app route tree with the required AI Coach Nova routes.
- Added `/` redirect to `/dashboard`.
- Added safe placeholder screens for dashboard, findings, CAPA, 8D steps, actions, similarity, topics, audit trail, notifications, and persona settings.
- Added clean not-found handling for invalid routes and invalid golden-case IDs.
- Added base folders for `mock-data`, `types`, `services`, `store`, and `utils`.
- Added Nova, severity, status, and surface design tokens.
- Added TypeScript domain model files for CAPA, persona, finding, audit trail, notification, and dashboard data.
- Updated `TO_DOS.md` with completed Phase 1 routing/design work and Phase 2 domain types.

### Changed Files
- `package.json`
- `package-lock.json`
- `src/App.tsx`
- `src/router.tsx`
- `src/routes.ts`
- `src/pages/nova/NovaPlaceholderPage.tsx`
- `src/pages/NotFound.tsx`
- `src/index.css`
- `tailwind.config.ts`
- `src/types/audit.ts`
- `src/types/capa.ts`
- `src/types/dashboard.ts`
- `src/types/finding.ts`
- `src/types/index.ts`
- `src/types/notification.ts`
- `src/types/persona.ts`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npm run build` — passed.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template code; new foundation files do not add blocking TypeScript build errors.
- `npm run dev -- --host 0.0.0.0` — passed on `http://localhost:8081/`.
- Manual route check — dev server started; browser interaction not run yet.

### Notes
- Active production bundle dropped from about 1.2 MB to about 313 kB minified because old pages are no longer imported by the active app shell.
- `npm install` reported 18 dependency vulnerabilities from the current dependency tree; no audit fix was run because it may change unrelated packages.
- `tsconfig.app.json` is still permissive and should be tightened after legacy code is removed or isolated.

### Next Recommended Task
- Start Phase 3 mock data: create `src/mock-data/` JSON files, beginning with personas and the three golden findings.

## 2026-05-30 — Mock Data and Utility Foundation

### Completed
- Created the AI Coach Nova mock data folder structure and all required JSON seed files.
- Added five demo personas with role, department, NIK, and initials.
- Added 15 findings across Deviation, Audit Finding, and Complaint with mixed severities and statuses.
- Added golden prefill JSON for Bizzmine deviation, Q100+ audit finding, and Bizzmine Complaint.
- Added 8 CAPA cases, including the three golden cases plus closed, approval, disposisi, overdue, and recurred examples.
- Added corrective actions, preventive actions, audit trail events, notifications, KG citations, topic clusters, and dashboard stats.
- Added deterministic Nova scripts for 5-Whys, Fishbone, Decision Tree, containment, CA, PA, verification coaching, and fallback chat.
- Added typed mock data exports in `src/mock-data/index.ts`.
- Added utility foundation for mock AI calls, quality scoring, impact classification, and formatting.
- Enabled JSON module imports in TypeScript.
- Updated `TO_DOS.md` with completed mock data and utility work, leaving UI-dependent acceptance items noted as remaining.

### Changed Files
- `src/mock-data/personas.json`
- `src/mock-data/findings.json`
- `src/mock-data/capa-cases.json`
- `src/mock-data/corrective-actions.json`
- `src/mock-data/preventive-actions.json`
- `src/mock-data/audit-trail.json`
- `src/mock-data/notifications.json`
- `src/mock-data/kg-citations.json`
- `src/mock-data/topic-clusters.json`
- `src/mock-data/dashboard-stats.json`
- `src/mock-data/prefills/bizzmine-deviation.json`
- `src/mock-data/prefills/q100-audit.json`
- `src/mock-data/prefills/bizzmine-complaint.json`
- `src/mock-data/nova-scripts/5whys-hepa.json`
- `src/mock-data/nova-scripts/fishbone-audit-documentation.json`
- `src/mock-data/nova-scripts/decision-tree-complaint-particulate.json`
- `src/mock-data/nova-scripts/containment-suggestions.json`
- `src/mock-data/nova-scripts/ca-suggestions.json`
- `src/mock-data/nova-scripts/pa-suggestions.json`
- `src/mock-data/nova-scripts/verification-coaching.json`
- `src/mock-data/nova-scripts/chat-responses.json`
- `src/mock-data/index.ts`
- `src/utils/mockAI.ts`
- `src/utils/scoring.ts`
- `src/utils/impact.ts`
- `src/utils/formatters.ts`
- `tsconfig.app.json`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npm run build` — passed.
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Utility and mock data files compile cleanly.
- Several acceptance items in `TO_DOS.md` remain open because they require Phase 5 services, Phase 6 stores, or feature UI wiring.

### Next Recommended Task
- Start Phase 5 services, beginning with data access services for CAPA, findings, Nova, audit trail, notifications, actions, and dashboard.

## 2026-05-30 — Services and Zustand Persistence

### Completed
- Added service layer for CAPA, findings, Nova, audit trail, notifications, actions, and dashboard data.
- Added in-memory mock mutations for creating CAPA records, linking findings, advancing workflow steps, closing CAPA, updating actions, adding audit events, and marking notifications read.
- Added Nova service methods backed by JSON scripts and deterministic mock AI delay.
- Added Zustand stores for active persona, CAPA/finding/action state, UI state, audit trail, and notifications.
- Added localStorage persistence keys under `ai-coach-nova-*`.
- Added `resetDemoData()` helper to clear demo storage and reload initial mock JSON state.
- Updated `TO_DOS.md` with completed service/store items and UI-dependent remaining notes.

### Changed Files
- `src/services/actionService.ts`
- `src/services/auditTrailService.ts`
- `src/services/capaService.ts`
- `src/services/dashboardService.ts`
- `src/services/findingService.ts`
- `src/services/index.ts`
- `src/services/notificationService.ts`
- `src/services/novaService.ts`
- `src/store/index.ts`
- `src/store/resetDemoData.ts`
- `src/store/storageKeys.ts`
- `src/store/useAuditTrailStore.ts`
- `src/store/useCapaStore.ts`
- `src/store/useNotificationStore.ts`
- `src/store/usePersonaStore.ts`
- `src/store/useUIStore.ts`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Stores are ready for UI wiring, but the reset demo data button and confirmation modal are still Phase 7 layout/shared component work.
- Service mutations are intentionally frontend-only and deterministic; no backend or real integration was added.

### Next Recommended Task
- Start Phase 7 shared components, beginning with layout components, persona switcher, reset demo data control, and reusable badges.

## 2026-05-30 — Shared Layout, Nova Components, and Dashboard

### Completed
- Added layout components: `TopBar`, `Sidebar`, and `PageWrapper`.
- Moved the active app shell from `App.tsx` into reusable layout components.
- Added persona switcher, notification shortcut, reset demo data button, and reset confirmation dialog to the TopBar.
- Added shared components for severity/status/source badges, score pill, AI loading state, blocker banner, empty state, confirmation dialog, and mocked toast helper.
- Added Nova components for coach tips, suggestion cards, chat panel, and thinking dots.
- Added score components for score bar, breakdown, and sticky-style sidebar content.
- Added chart components for finding trends, type donut, root cause bars, and department heatmap.
- Replaced the `/dashboard` placeholder with a real mock-data dashboard using service data.
- Updated `TO_DOS.md` with completed Phase 7 shared/layout items and Phase 8 dashboard items.

### Changed Files
- `src/App.tsx`
- `src/router.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/PageWrapper.tsx`
- `src/components/shared/PersonaSwitcher.tsx`
- `src/components/shared/SeverityBadge.tsx`
- `src/components/shared/StatusBadge.tsx`
- `src/components/shared/ScorePill.tsx`
- `src/components/shared/SourceBadge.tsx`
- `src/components/shared/AILoadingSpinner.tsx`
- `src/components/shared/BlockerBanner.tsx`
- `src/components/shared/EmptyState.tsx`
- `src/components/shared/ConfirmDialog.tsx`
- `src/components/shared/Toast.tsx`
- `src/components/nova/NovaCoachTip.tsx`
- `src/components/nova/NovaSuggestionCard.tsx`
- `src/components/nova/NovaChatPanel.tsx`
- `src/components/nova/NovaThinkingDots.tsx`
- `src/components/score/ScoreBar.tsx`
- `src/components/score/ScoreBreakdown.tsx`
- `src/components/score/ScoreSidebar.tsx`
- `src/components/charts/TrendLineChart.tsx`
- `src/components/charts/TypeDonutChart.tsx`
- `src/components/charts/RootCauseBarChart.tsx`
- `src/components/charts/DeptHeatmap.tsx`
- `src/pages/nova/DashboardPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with a bundle-size warning after adding Recharts-backed dashboard charts.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- The dashboard now uses mock services and makes the three golden findings reachable from the first screen.
- A dedicated recurrence trend chart remains unchecked; recurrence counts are currently represented in the root cause chart.

### Next Recommended Task
- Start Phase 9 Findings Flow: replace findings placeholder with a searchable/filterable findings table and finding detail screen.

## 2026-05-30 — Findings List and Detail Flow

### Completed
- Replaced `/findings` placeholder with a real findings table using persisted demo store data.
- Added search plus type, severity, status, and department filters.
- Added finding status, severity, and source badges.
- Added action column with View Finding, View CAPA, and Create CAPA links.
- Replaced `/findings/:id` placeholder with a real finding detail page.
- Added source system badge, finding metadata, source prefill panel, linked CAPA card, and timeline.
- Added clean not-found behavior for missing finding IDs.
- Wired create CAPA links to `/capa/new?type=...&sourceId=...`.
- Updated `TO_DOS.md` with completed Findings Flow items and a remaining note for the date filter.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/FindingsListPage.tsx`
- `src/pages/nova/FindingDetailPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- The findings list currently has all planned filters except the date filter.
- All three golden findings are reachable and render source context correctly.

### Next Recommended Task
- Start Phase 10 CAPA Intake: implement `/capa/new` with query param support, mocked source fetch, Nova impact classification, score sidebar, and submit flow.

## 2026-05-30 — CAPA Intake Flow

### Completed
- Replaced `/capa/new` placeholder with a real CAPA intake page.
- Added CAPA type selector for Deviation, Audit Finding, and Complaint.
- Added query param support for `type` and `sourceId`.
- Added mocked source fetch buttons for Bizzmine, Q100+, and Bizzmine Complaint.
- Added Nova loading states for source import and impact classification.
- Loaded and rendered typed prefill JSON for the three golden cases.
- Generated suggested CAPA titles from imported source context.
- Generated Nova impact classification and displayed Major severity plus rationale/factors.
- Added six gate question inputs with required-field validation.
- Added live score sidebar for intake completeness.
- Added submit flow that creates or opens the correct CAPA, links the finding, records audit trail, adds notification, and redirects to CAPA detail.
- Updated `TO_DOS.md` with completed CAPA Intake items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/CapaIntakePage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Submitting an already-linked golden finding opens its existing CAPA, keeping the demo deterministic.
- Intake remains frontend-only and all AI/source behavior is mocked.

### Next Recommended Task
- Start Phase 11 CAPA List and Detail: implement `/capa` table and `/capa/:id` workflow hub.

## 2026-05-30 — CAPA List and Detail

### Completed
- Replaced `/capa` placeholder with a real CAPA table.
- Added search plus type, status, department, severity, and date filters.
- Added quality score badges, derived open-action due dates, and row actions.
- Linked every CAPA row to its detail page.
- Replaced `/capa/:id` placeholder with a workflow hub.
- Added CAPA header with source, type, severity, status, and quality score badges.
- Added Overview, 8D Workflow, Audit Trail, and Actions tabs.
- Added overview source data, Nova summary, similar cases, timeline, and linked finding card.
- Added 8D stepper and Continue Workflow CTA using the CAPA current step.
- Added CAPA-specific audit trail rendering.
- Added CA/PA action lists and add-action entry buttons.
- Added clean not-found behavior for invalid CAPA IDs.
- Updated `TO_DOS.md` with completed CAPA List and Detail items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/CapaListPage.tsx`
- `src/pages/nova/CapaDetailPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Due dates are derived from the earliest open corrective or preventive action.
- Add action buttons route into the relevant 8D workflow placeholders until Phase 12 implements the forms.

### Next Recommended Task
- Start Phase 12 8D Workflow: implement D1 Problem Statement at `/capa/:id/8d/problem`.

## 2026-05-30 — 8D D1 Problem Statement

### Completed
- Replaced `/capa/:id/8d/problem` placeholder with a real D1 Problem Statement page.
- Added Nova suggested problem statements for the three golden CAPA cases, using `PLANS.md` examples as the source of truth.
- Added a multi-line problem statement editor with live quality score preview.
- Added Nova improvement tip panel and validation checklist.
- Validates minimum specificity, date/timing, area/location, equipment or system reference, batch/lot or scoped record count, and measurable observation.
- Shows a blocker and toast when the statement is too weak.
- Saves valid statements into CAPA gate answers and updates the problem specificity score.
- Adds audit events on save and continue.
- Advances valid D1 completion to `/capa/:id/8d/containment`.
- Updated `TO_DOS.md` with completed Phase 12.1 items.

### Changed Files
- `src/router.tsx`
- `src/store/useCapaStore.ts`
- `src/pages/nova/eight-d/D1ProblemPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- D2-D7 routes remain placeholder routes until their dedicated Phase 12 tasks are implemented.
- The D1 suggested statements intentionally follow `PLANS.md` even when dates differ from older mock JSON.

### Next Recommended Task
- Continue Phase 12 with D2 Containment at `/capa/:id/8d/containment`.

## 2026-05-30 — 8D D2 Containment

### Completed
- Replaced `/capa/:id/8d/containment` placeholder with a real D2 Containment page.
- Added PLANS-first Nova containment suggestions for all three golden CAPA cases.
- Added Accept/Edit/Replace support through the Nova suggestion card.
- Added containment action description input, PIC dropdown, and due date input.
- Validates action length, containment intent, selected PIC, and due date that is not in the past.
- Shows blocker and toast when containment data is incomplete.
- Updates CAPA gate answers and live containment score.
- Adds audit trail events on save.
- Adds QA Deviation notification when continuing to RCA.
- Advances valid containment completion to `/capa/:id/8d/rca`.
- Updated `TO_DOS.md` with completed Phase 12.2 items.

### Changed Files
- `src/router.tsx`
- `src/store/useCapaStore.ts`
- `src/pages/nova/eight-d/D2ContainmentPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Containment text intentionally follows `PLANS.md` when older mock JSON uses different batch/lot identifiers.
- D3-D7 routes remain placeholder routes until their dedicated Phase 12 tasks are implemented.

### Next Recommended Task
- Continue Phase 12 with D3 Root Cause Analysis at `/capa/:id/8d/rca`.

## 2026-05-30 — 8D D3 Root Cause Analysis

### Completed
- Replaced `/capa/:id/8d/rca` placeholder with a real D3 RCA page.
- Added RCA method picker with PLANS/default mapping: Deviation → 5-Whys, Audit Finding → Fishbone, Complaint → Decision Tree.
- Added 5-Whys UI with five Nova suggestion cards, Accept/Edit/Replace, and KG citation cards.
- Added Fishbone UI across Man, Machine, Material, Method, Measurement, and Environment categories.
- Added Decision Tree UI for the complaint flow.
- Added confirmed root cause editor with PLANS-first root cause defaults for all three golden cases.
- Added validation blockers for insufficient RCA depth and missing confirmed root cause.
- Updates CAPA RCA data and root cause depth score.
- Adds audit event when RCA is saved/confirmed.
- Advances valid RCA completion to `/capa/:id/8d/ca`.
- Updated `TO_DOS.md` with completed Phase 12.3 items.

### Changed Files
- `src/router.tsx`
- `src/store/useCapaStore.ts`
- `src/pages/nova/eight-d/D3RCAPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- D3 content intentionally follows `PLANS.md` when older mock scripts use different root cause phrasing.
- D4-D7 routes remain placeholder routes until their dedicated Phase 12 tasks are implemented.

### Next Recommended Task
- Continue Phase 12 with D4 Corrective Action at `/capa/:id/8d/ca`.

## 2026-05-30 — 8D D4 Corrective Action

### Completed
- Replaced `/capa/:id/8d/ca` placeholder with a real D4 Corrective Action page.
- Added existing CA list rendering from the persisted CAPA store.
- Added PLANS-first Nova corrective action suggestions for all three golden CAPA cases.
- Added Accept/Edit/Replace support through the Nova suggestion card.
- Added add-CA form with description, PIC, due date, linked root cause, and verification method.
- Validates description length, PIC, due date, root cause link, and verification method.
- Adds valid CA entries through `useCapaStore.addCA`, making them available to CAPA detail and the global action store.
- Updates action effectiveness score after CA creation.
- Adds audit trail events for saved corrective actions.
- Advances valid D4 completion to `/capa/:id/8d/pa`.
- Updated `TO_DOS.md` with completed Phase 12.4 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Corrective action suggestions intentionally follow `PLANS.md` when older mock JSON uses different equipment or batch IDs.
- D5-D7 routes remain placeholder routes until their dedicated Phase 12 tasks are implemented.

### Next Recommended Task
- Continue Phase 12 with D5 Preventive Action at `/capa/:id/8d/pa`.

## 2026-05-30 — 8D D5 Preventive Action

### Completed
- Replaced `/capa/:id/8d/pa` placeholder with a real D5 Preventive Action page.
- Added existing PA list rendering from the persisted CAPA store.
- Added PLANS-first Nova preventive action suggestions for all three golden CAPA cases.
- Added Accept/Edit/Replace support through the Nova suggestion card.
- Added add-PA form with description, PIC, and target date.
- Validates forward-looking description, selected PIC, and future target date.
- Adds valid PA entries through `useCapaStore.addPA`, making them available to CAPA detail and the global action store.
- Updates action effectiveness score after PA creation.
- Adds audit trail events for saved preventive actions.
- Advances valid D5 completion to `/capa/:id/8d/verification`.
- Updated `TO_DOS.md` with completed Phase 12.5 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/eight-d/D5PreventiveActionPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Preventive action suggestions intentionally follow `PLANS.md` when older mock JSON uses different wording.
- D6-D7 routes remain placeholder routes until their dedicated Phase 12 tasks are implemented.

### Next Recommended Task
- Continue Phase 12 with D6 Verification at `/capa/:id/8d/verification`.

## 2026-05-30 — 8D D6 Verification

### Completed
- Replaced `/capa/:id/8d/verification` placeholder with a real D6 Verification page.
- Added verification method dropdown using the existing verification enum with PLANS-first labels.
- Added verification result text area with golden-case defaults from `PLANS.md`.
- Added mocked evidence upload with visible uploaded filename and toast feedback.
- Added Nova verification coaching button that opens the Nova chat panel.
- Validates method, result, and evidence filename before sign-off.
- Updates CAPA verification data through `completeVerification`.
- Updates effectiveness and containment score preview after valid verification.
- Adds audit trail events for verification completion.
- Advances valid D6 completion to `/capa/:id/8d/signoff`.
- Updated `TO_DOS.md` with completed Phase 12.6 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/eight-d/D6VerificationPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Verification defaults intentionally follow `PLANS.md` when older mock JSON uses different wording.
- D7 Sign-Off remains the final Phase 12 placeholder route.

### Next Recommended Task
- Continue Phase 12 with D7 Sign-Off at `/capa/:id/8d/signoff`.

## 2026-05-30 — 8D D7 Sign-Off

### Completed
- Replaced `/capa/:id/8d/signoff` placeholder with a real D7 Sign-Off page.
- Added final quality score gate and Audit Ready badge for score >= 80.
- Blocks approval when score is below 80.
- Added approval chains based on CAPA type:
  - Deviation and Audit Finding: Bambang Saputra → Siti Rahmawati → Dewi Anggraini.
  - Complaint: Siti Rahmawati → Bambang Saputra → Dewi Anggraini.
- Added Critical severity SME co-approval handling.
- Added e-signature modal with mocked timestamp and notes.
- Supports approve and reject decisions.
- Adds audit trail events for approvals, rejections, notifications, and closure.
- Adds notification for next approver and closure notifications for required approvers.
- Closes CAPA through `closeCAPA` when all approvers approve, marking the finding as `capa_closed`.
- Updated `TO_DOS.md` with completed Phase 12.7 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/eight-d/D7SignOffPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Phase 12 8D Workflow is now implemented end-to-end from D1 through D7.
- Closure persists through the existing Zustand persisted CAPA store.

### Next Recommended Task
- Start Phase 13 Global Action Screens with `/actions/corrective`.

## 2026-05-30 — Global Corrective Action List

### Completed
- Replaced `/actions/corrective` placeholder with a real global corrective action table.
- Added search across CA ID, CAPA ID, description, PIC, root cause, verification method, department, and CAPA title.
- Added filters for status, PIC, department, and due date.
- Added CAPA links for each corrective action row.
- Added overdue badge for open/in-progress actions past due.
- Added Mark Completed action with toast feedback.
- Added persisted CA status update method to `useCapaStore`.
- Shows workflow-added CA records because the page reads the same persisted corrective action store.
- Updated `TO_DOS.md` with completed Phase 13.1 items.

### Changed Files
- `src/router.tsx`
- `src/store/useCapaStore.ts`
- `src/pages/nova/CorrectiveActionsPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Status updates are persisted through Zustand and reflected anywhere the same action store is read.

### Next Recommended Task
- Continue Phase 13 with `/actions/preventive`.
