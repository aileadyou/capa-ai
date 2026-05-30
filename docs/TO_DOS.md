# to_dos.md — AI Coach Nova CAPA Prototype

## 0. Compact Context for AI Agent

You are building a frontend-only demo prototype named **AI Coach Nova**.

This is a CAPA management demo prototype for pitching.
The goal is not production-readiness. The goal is a smooth, deterministic, 15–20 minute demo.

### Product Name

**AI Coach Nova**

The AI assistant must always be called:

**Nova**

### Content Language

Use **English-first** UI content.

Use English for:

* navigation labels
* buttons
* form labels
* table columns
* toast messages
* blocker messages
* Nova responses
* audit trail events
* notifications
* empty states

Indonesian names/personas/departments may stay Indonesian.

### Tech Stack

Use:

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* Zustand
* Recharts
* Radix primitives where needed
* Lucide icons
* JSON mock data only

Do not build:

* backend
* database
* real authentication
* real SSO
* real AI/LLM calls
* real Bizzmine/Q100+/MES integration
* real file upload
* real email sending
* real notification service
* real e-signature provider

### Demo Scope

The demo must support **three end-to-end CAPA cases**:

1. Deviation
2. Audit Finding
3. Complaint

All three demo cases use **Major** severity.

Critical cases may exist as secondary mock data for dashboard/list realism, but they are not part of the primary walkthrough.

### Golden Demo Cases

| Type          | Finding ID    | CAPA ID        | Source             | Scenario                                            | RCA Method    |
| ------------- | ------------- | -------------- | ------------------ | --------------------------------------------------- | ------------- |
| Deviation     | DEV-2026-0341 | CAPA-2026-0341 | Bizzmine           | Environmental monitoring excursion in filling suite | 5-Whys        |
| Audit Finding | AUD-2026-0089 | CAPA-2026-0089 | Q100+              | GMP documentation gap during internal audit         | Fishbone      |
| Complaint     | CMP-2026-0112 | CAPA-2026-0112 | Bizzmine Complaint | Visible particulate matter complaint                | Decision Tree |

### Main Goal

Build a polished, clickable, frontend-only prototype where the user can:

1. open dashboard,
2. open a finding,
3. create CAPA with Nova,
4. fetch mocked source data,
5. complete 8D workflow,
6. accept/edit/replace Nova suggestions,
7. update score,
8. pass validation blockers,
9. complete verification,
10. approve with mocked e-signature,
11. close CAPA as Audit Ready,
12. see audit trail and notifications update.

---

# 1. Global Implementation Rules

## 1.1 Mandatory Guardrails

* [ ] Do not add a backend server.
* [ ] Do not add a database.
* [ ] Do not call real AI APIs.
* [ ] Do not call external APIs.
* [ ] Do not implement real auth.
* [ ] Do not implement real file storage.
* [ ] Do not implement real email sending.
* [ ] Do not over-engineer the architecture.
* [ ] Do not add extra dependencies unless necessary.
* [ ] Do not hardcode large mock data inside components.
* [ ] Do not leave dead buttons without mocked toast feedback.
* [ ] Do not leave routes blank.
* [ ] Do not leave raw JSON visible in the UI.
* [ ] Do not leave lorem ipsum text.

## 1.2 Demo Stability Rules

* [ ] Every route must render safely.
* [ ] Every major button must either work or show a mocked toast.
* [ ] Every ID-based route must have a not-found fallback.
* [ ] Browser refresh must not destroy demo progress.
* [ ] Add `Reset Demo Data` button.
* [ ] Use localStorage persistence for runtime demo state.
* [ ] Keep the UI stable at 1920×1080.
* [ ] Basic responsiveness is enough, but desktop demo layout is the priority.

## 1.3 UI Copy Rules

Use these terms consistently:

| Concept                  | Use                                                         |
| ------------------------ | ----------------------------------------------------------- |
| AI assistant             | Nova                                                        |
| Ready state              | Audit Ready                                                 |
| Source import            | Imported from [System]                                      |
| Bizzmine import loading  | Nova is importing source data from Bizzmine...              |
| Q100+ import loading     | Nova is importing audit finding data from Q100+...          |
| Complaint import loading | Nova is importing complaint data from Bizzmine Complaint... |
| Ask AI button            | Ask Nova                                                    |
| AI loading               | Nova is analyzing...                                        |
| Accept suggestion        | Accept                                                      |
| Edit suggestion          | Edit                                                        |
| Replace suggestion       | Replace                                                     |
| Approval button          | Approve with E-Signature                                    |
| Reset button             | Reset Demo Data                                             |

---

# 2. Phase 1 — Project Foundation

Goal: create the working app foundation before building feature screens.

## 2.1 Scaffold Project

* [x] Create Vite React TypeScript project.
* [x] Install required dependencies:

  * `react-router-dom`
  * `zustand`
  * `recharts`
  * `react-hook-form`
  * `zod`
  * Radix UI primitives as needed
  * `reactflow`
  * `html2pdf.js`
  * `date-fns`
  * `clsx`
  * `tailwind-merge`
  * `lucide-react`
* [x] Configure Tailwind CSS.
* [ ] Configure TypeScript strict enough for reliable frontend work.
  - Progress: Existing TypeScript build passes through Vite.
  - Remaining: Tighten `tsconfig.app.json` after legacy pages are removed or isolated.
* [x] Create base folder structure.

Expected structure:

```txt
src/
├── main.tsx
├── App.tsx
├── router.tsx
├── mock-data/
├── types/
├── services/
├── store/
├── utils/
├── components/
└── pages/
```

Acceptance criteria:

* [x] App starts with `npm run dev`.
* [x] No TypeScript errors.
* [x] Tailwind classes work.
* [x] React Router works.
* [x] `/dashboard` route renders a placeholder page.

---

## 2.2 Add Design Tokens

Create CSS variables for:

* primary blue
* Nova purple
* severity colors
* status colors
* neutral colors
* background
* surface
* border
* text

Tasks:

* [x] Add global CSS variables.
* [x] Add body font.
* [x] Add base background color.
* [x] Add reusable utility styles if needed.
* [x] Make the app look enterprise/medical, not playful.

Acceptance criteria:

* [x] UI has consistent colors.
* [x] Severity badges can use shared color tokens.
* [x] Nova components can use Nova accent color.

---

## 2.3 Configure Routing

Create the following routes:

```txt
/
 /dashboard
/findings
/findings/:id
/capa
/capa/new
/capa/:id
/capa/:id/8d/problem
/capa/:id/8d/containment
/capa/:id/8d/rca
/capa/:id/8d/ca
/capa/:id/8d/pa
/capa/:id/8d/verification
/capa/:id/8d/signoff
/actions/corrective
/actions/preventive
/actions/consolidated
/similarity
/topics
/audit-trail
/notifications
/settings/personas
```

Tasks:

* [x] Redirect `/` to `/dashboard`.
* [x] Create placeholder page for every route.
* [x] Create `NotFound` page.
* [x] Add route-level fallback for invalid paths.

Acceptance criteria:

* [x] All routes render.
* [x] Browser back/forward works.
* [x] Invalid route shows clean not-found page.
* [x] No route crashes.

---

# 3. Phase 2 — Types and Domain Model

Goal: define the domain model before building stores/services/UI.

## 3.1 Create TypeScript Types

Create files:

```txt
src/types/capa.ts
src/types/persona.ts
src/types/finding.ts
src/types/audit.ts
src/types/notification.ts
src/types/dashboard.ts
src/types/index.ts
```

Define types for:

* `CAPAType`
* `Severity`
* `PersonaID`
* `EightDStep`
* `CAPAStatus`
* `ActionStatus`
* `RCAMethod`
* `NovaSuggestionStatus`
* `AuditDomain`
* `Persona`
* `DeviationPreFill`
* `AuditPreFill`
* `ComplaintPreFill`
* `PreFillContext`
* `QualityScore`
* `ScoreLiftTip`
* `ImpactClassification`
* `GateAnswer`
* `RCAData`
* `FiveWhysNode`
* `FishboneCategory`
* `DecisionNode`
* `NovaSuggestion`
* `KGCitation`
* `CorrectiveAction`
* `PreventiveAction`
* `VerificationData`
* `ApprovalEvent`
* `Disposisi`
* `AuditEvent`
* `Notification`
* `CAPACase`
* `Finding`
* `SimilarityResult`
* `TopicCluster`
* `DashboardStats`
* `TrendDataPoint`
* `DepartmentHeatmapEntry`
* `RootCauseTrendEntry`

Acceptance criteria:

* [x] Types compile.
* [x] Mock JSON shape can map to these types.
* [x] Component props can reuse these types.
* [x] No duplicated domain type definitions inside components.

---

# 4. Phase 3 — Mock Data

Goal: prepare all mock data before UI complexity.

## 4.1 Create Mock Data Folder

Create:

```txt
src/mock-data/
├── personas.json
├── findings.json
├── capa-cases.json
├── corrective-actions.json
├── preventive-actions.json
├── audit-trail.json
├── notifications.json
├── kg-citations.json
├── topic-clusters.json
├── dashboard-stats.json
├── prefills/
└── nova-scripts/
```

Acceptance criteria:

* [x] All JSON files exist.
* [x] JSON is valid.
* [x] Data can be imported by TypeScript.
* [x] No large mock data hardcoded in components.

---

## 4.2 Create Personas Data

Create 5 personas:

1. Andi Wijaya — Operator Senior — Fill-Finish
2. Siti Rahmawati — QA Deviation / QA Compliance / QA Complaint
3. Bambang Saputra — Department Head — Fill-Finish / Warehouse / Production
4. Dewi Anggraini — Head of QA
5. Dr. Ahmad Pratomo — SME Microbiology

Tasks:

* [x] Add ID.
* [x] Add display name.
* [x] Add role.
* [x] Add department.
* [x] Add NIK.
* [x] Add avatar initials.

Acceptance criteria:

* [ ] Persona switcher can show all personas.
  - Progress: `personas.json` contains all five personas and typed exports are ready.
  - Remaining: Build the persona store and persona settings screen.
* [x] Approval flows can reference personas.
* [x] Audit trail can reference personas.

---

## 4.3 Create Three Golden Findings

Create findings for:

### Deviation

* [x] ID: `DEV-2026-0341`
* [x] Type: `deviation`
* [x] Source: `Bizzmine`
* [x] Severity: `Major`
* [x] Department: `Fill-Finish`
* [x] Status: `pending_capa` or `capa_in_progress`

### Audit Finding

* [x] ID: `AUD-2026-0089`
* [x] Type: `audit`
* [x] Source: `Q100+`
* [x] Severity: `Major`
* [x] Department: `Warehouse / QA Compliance`
* [x] Status: `pending_capa` or `capa_in_progress`

### Complaint

* [x] ID: `CMP-2026-0112`
* [x] Type: `complaint`
* [x] Source: `Bizzmine-Complaint`
* [x] Severity: `Major`
* [x] Department: `QA Complaint / Production`
* [x] Status: `pending_capa` or `capa_in_progress`

Acceptance criteria:

* [ ] All three appear on dashboard latest findings.
  - Progress: mock data is ready.
  - Remaining: wire dashboard UI to `findings.json`.
* [ ] All three appear in findings list.
  - Progress: mock data is ready.
  - Remaining: wire findings UI to `findings.json`.
* [x] All three can be opened from `/findings/:id`.

---

## 4.4 Create Additional Mock Findings

Add additional findings for dashboard/list realism:

* [x] At least 5 Deviation findings.
* [x] At least 5 Audit findings.
* [x] At least 5 Complaint findings.
* [x] Include different statuses:

  * `pending_capa`
  * `capa_in_progress`
  * `capa_closed`
  * `overdue`
* [x] Include different severities:

  * Minor
  * Major
  * Critical

Acceptance criteria:

* [x] Dashboard charts do not look empty.
* [x] Filters on findings list have meaningful results.
* [x] Lists feel realistic.

---

## 4.5 Create Prefill JSON for Three Golden Cases

Create:

```txt
src/mock-data/prefills/bizzmine-deviation.json
src/mock-data/prefills/q100-audit.json
src/mock-data/prefills/bizzmine-complaint.json
```

### Deviation Prefill

Must include:

* [x] source
* [x] deviation ID
* [x] reported date
* [x] occurred date
* [x] location
* [x] area
* [x] line
* [x] equipment ID
* [x] initiator
* [x] initial observation
* [x] affected batches
* [x] attachments
* [x] SOP references
* [x] initial severity

### Audit Prefill

Must include:

* [x] source
* [x] finding ID
* [x] audit ID
* [x] audit type
* [x] reported date
* [x] audit date
* [x] auditor
* [x] auditee
* [x] finding category
* [x] finding description
* [x] regulation references
* [x] severity
* [x] SOP references

### Complaint Prefill

Must include:

* [x] source
* [x] complaint ID
* [x] reported date
* [x] customer
* [x] product
* [x] lot number
* [x] expiry date
* [x] complaint type
* [x] description
* [x] initial severity
* [x] attachments

Acceptance criteria:

* [ ] `/capa/new` can fetch correct mock prefill based on type.
  - Progress: typed prefill JSON exists.
  - Remaining: create Nova service and intake UI.
* [ ] Finding detail can show source data.
  - Progress: typed prefill JSON exists.
  - Remaining: wire finding detail UI.
* [ ] CAPA overview can show source data.
  - Progress: CAPA cases embed prefill context.
  - Remaining: wire CAPA overview UI.

---

## 4.6 Create CAPA Cases

Create CAPA cases for the three golden cases:

* [x] `CAPA-2026-0341`
* [x] `CAPA-2026-0089`
* [x] `CAPA-2026-0112`

Each CAPA must have:

* [x] ID
* [x] type
* [x] title
* [x] preFill
* [x] gateAnswers
* [x] score
* [x] impact
* [x] 8D data
* [x] audit events
* [x] status
* [x] current step
* [x] createdAt
* [x] updatedAt
* [x] createdBy
* [x] assignedTo
* [x] department

Also create additional CAPA cases for dashboard/list realism:

* [x] closed case
* [x] approval case
* [x] investigation case
* [x] overdue case
* [x] recurred case for similarity demo

Acceptance criteria:

* [x] CAPA list has useful data.
* [ ] CAPA detail can load each golden case.
  - Progress: CAPA data and placeholder routes exist.
  - Remaining: build CAPA service/store and detail UI.
* [x] Global action lists can read from CAPA data or action JSON.

---

## 4.7 Create Nova Scripts

Create:

```txt
src/mock-data/nova-scripts/
├── 5whys-hepa.json
├── fishbone-audit-documentation.json
├── decision-tree-complaint-particulate.json
├── ca-suggestions.json
├── pa-suggestions.json
├── containment-suggestions.json
├── verification-coaching.json
└── chat-responses.json
```

Tasks:

* [x] Add scripted Nova responses for Deviation 5-Whys.
* [x] Add scripted Nova responses for Audit Fishbone.
* [x] Add scripted Nova responses for Complaint Decision Tree.
* [x] Add CA suggestions for all three cases.
* [x] Add PA suggestions for all three cases.
* [x] Add containment suggestions for all three cases.
* [x] Add verification coaching responses.
* [x] Add generic fallback response.

Acceptance criteria:

* [x] Nova suggestions are deterministic.
* [x] Accept/Edit/Replace can use these scripts.
* [x] Nova chat never breaks even with unscripted input.

---

# 5. Phase 4 — Utilities

Goal: create reusable logic before feature UI.

## 5.1 Create Mock AI Utility

File:

```txt
src/utils/mockAI.ts
```

Tasks:

* [x] Create `mockAICall<T>()`.
* [x] Add deterministic delay support.
* [x] Default delay: 1500–3000ms.
* [x] Return typed mock response.
* [x] Handle missing response key gracefully.

Acceptance criteria:

* [ ] Nova loading states use this utility.
  - Progress: utility exists and `novaService` uses deterministic mock calls.
  - Remaining: wire UI loading states.
* [x] No real AI request exists.
* [x] Missing script does not crash app.

---

## 5.2 Create Scoring Utility

File:

```txt
src/utils/scoring.ts
```

Implement:

* [x] `computeProblemSpecificity()`
* [x] `computeRootCauseDepth()`
* [x] `computeActionEffectiveness()`
* [x] `computeContainmentStrength()`
* [x] `computeTotalQualityScore()`
* [x] `getScoreLiftTips()`
* [x] `isAuditReady()`

Scoring dimensions:

| Category             | Max |
| -------------------- | --: |
| Problem Specificity  |  25 |
| Root Cause Depth     |  25 |
| Action Effectiveness |  25 |
| Containment Strength |  25 |

Acceptance criteria:

* [x] Score changes when user improves content.
* [x] Score can reach 80+ for completed golden cases.
* [ ] Sign-off blocks if score < 80.
  - Progress: `isAuditReady()` exists.
  - Remaining: wire D7 Sign-Off UI blocker.
* [x] Score tips are in English.

---

## 5.3 Create Impact Classification Utility

File:

```txt
src/utils/impact.ts
```

Tasks:

* [x] Implement `computeImpact(prefill)`.
* [x] Support Deviation.
* [x] Support Audit Finding.
* [x] Support Complaint.
* [x] Return severity, weight, factors, rationale.
* [x] Force golden cases to Major severity when needed for demo.

Acceptance criteria:

* [x] All three golden cases classify as Major.
* [x] Rationale is English.
* [ ] Intake screen can display classification.
  - Progress: impact utility exists.
  - Remaining: wire intake UI.

---

## 5.4 Create Formatters

File:

```txt
src/utils/formatters.ts
```

Implement:

* [x] date formatter
* [x] relative time formatter
* [x] status label formatter
* [x] severity label formatter
* [x] CAPA type label formatter
* [x] percent formatter

Acceptance criteria:

* [x] Dates look consistent.
* [x] Table values are readable.
* [x] UI does not expose raw enum names unless intentional.

---

# 6. Phase 5 — Services

Goal: isolate data access and mock mutations from UI components.

Create:

```txt
src/services/capaService.ts
src/services/findingService.ts
src/services/novaService.ts
src/services/auditTrailService.ts
src/services/notificationService.ts
src/services/actionService.ts
src/services/dashboardService.ts
```

## 6.1 CAPA Service

Implement:

* [x] `getAllCAPAs()`
* [x] `getCAPAById(id)`
* [x] `createCAPAFromFinding(findingId, type)`
* [x] `updateCAPA(id, patch)`
* [x] `advanceCAPAStep(id, step)`
* [x] `closeCAPA(id)`
* [x] `resetCAPAData()`

Acceptance criteria:

* [ ] CAPA list uses service.
  - Progress: `capaService` exists.
  - Remaining: wire CAPA list UI.
* [ ] CAPA detail uses service/store.
  - Progress: `capaService` and `useCapaStore` exist.
  - Remaining: wire CAPA detail UI.
* [x] Workflow updates persist.

---

## 6.2 Finding Service

Implement:

* [x] `getAllFindings()`
* [x] `getFindingById(id)`
* [x] `getFindingsByType(type)`
* [x] `linkFindingToCAPA(findingId, capaId)`
* [x] `updateFindingStatus(findingId, status)`

Acceptance criteria:

* [ ] Findings list works.
  - Progress: `findingService` exists.
  - Remaining: wire findings UI.
* [ ] Finding detail works.
  - Progress: `findingService` exists.
  - Remaining: wire finding detail UI.
* [x] Creating CAPA updates linked status.

---

## 6.3 Nova Service

Implement:

* [x] `importSourceData(type, sourceId)`
* [x] `classifyImpact(prefill)`
* [x] `getContainmentSuggestion(capaId)`
* [x] `getRCASuggestions(capaId, method)`
* [x] `getCorrectiveActionSuggestions(capaId)`
* [x] `getPreventiveActionSuggestions(capaId)`
* [x] `getVerificationCoaching(capaId)`
* [x] `getChatResponse(step, message)`

Acceptance criteria:

* [x] Nova responses come from JSON scripts.
* [x] Nova loading states are consistent.
* [x] No real AI call exists.

---

## 6.4 Audit Trail Service

Implement:

* [x] `getAllAuditEvents()`
* [x] `getAuditEventsByCAPA(capaId)`
* [x] `addAuditEvent(event)`
* [x] `filterAuditEvents(filters)`

Acceptance criteria:

* [ ] Audit Trail page shows events.
  - Progress: `auditTrailService` and `useAuditTrailStore` exist.
  - Remaining: wire audit trail UI.
* [ ] CAPA detail shows CAPA-specific audit trail.
  - Progress: CAPA-specific selectors exist.
  - Remaining: wire CAPA detail UI.
* [x] Major workflow actions create audit events.

---

## 6.5 Notification Service

Implement:

* [x] `getNotificationsByPersona(personaId)`
* [x] `markAsRead(notificationId)`
* [x] `markAllAsRead(personaId)`
* [x] `addNotification(notification)`
* [x] `filterNotifications(filters)`

Acceptance criteria:

* [ ] Notification center works.
  - Progress: notification service/store exists.
  - Remaining: wire notification UI.
* [x] Read/unread state persists.
* [x] Workflow actions can create notifications.

---

## 6.6 Action Service

Implement:

* [x] `getAllCorrectiveActions()`
* [x] `getAllPreventiveActions()`
* [x] `getActionsByCAPA(capaId)`
* [x] `addCorrectiveAction(capaId, action)`
* [x] `addPreventiveAction(capaId, action)`
* [x] `updateActionStatus(actionId, status)`

Acceptance criteria:

* [ ] Global CA list works.
  - Progress: action service/store data exists.
  - Remaining: wire CA list UI.
* [ ] Global PA list works.
  - Progress: action service/store data exists.
  - Remaining: wire PA list UI.
* [ ] CAPA Actions tab works.
  - Progress: CAPA action selectors exist.
  - Remaining: wire CAPA detail actions tab.
* [x] Added actions appear in global lists.

---

# 7. Phase 6 — Zustand Stores and Persistence

Goal: make the prototype behave like a real app during demo.

## 7.1 Create Persona Store

File:

```txt
src/store/usePersonaStore.ts
```

Tasks:

* [x] Store active persona ID.
* [x] Load personas.
* [x] Switch persona.
* [x] Persist active persona to localStorage.

Acceptance criteria:

* [ ] Persona switcher works.
  - Progress: persona store exists.
  - Remaining: build PersonaSwitcher UI.
* [x] Active persona persists after refresh.
* [x] Notifications can filter by active persona.

---

## 7.2 Create CAPA Store

File:

```txt
src/store/useCapaStore.ts
```

Tasks:

* [x] Store CAPA cases.
* [x] Store findings.
* [x] Store actions.
* [x] Create CAPA from finding.
* [x] Update current step.
* [x] Update score.
* [x] Add CA.
* [x] Add PA.
* [x] Complete verification.
* [x] Approve sign-off.
* [x] Close CAPA.
* [x] Persist to localStorage.

Acceptance criteria:

* [x] Workflow progress survives refresh.
* [x] CAPA status changes are visible.
* [x] Global lists reflect mutations.

---

## 7.3 Create UI Store

File:

```txt
src/store/useUIStore.ts
```

Tasks:

* [x] Track Nova chat panel open/close.
* [x] Track citation detail panel open/close.
* [x] Track export menu state.
* [x] Track toast messages.
* [x] Track modal states.

Acceptance criteria:

* [ ] Slide-over panels work.
  - Progress: UI state exists.
  - Remaining: build slide-over components.
* [x] Modals can open/close.
* [ ] Toasts appear for mocked actions.
  - Progress: toast message state exists.
  - Remaining: wire visual toast trigger/component.

---

## 7.4 Create Audit and Notification Stores

Files:

```txt
src/store/useAuditTrailStore.ts
src/store/useNotificationStore.ts
```

Tasks:

* [x] Store audit events.
* [x] Store notifications.
* [x] Add event.
* [x] Add notification.
* [x] Mark read.
* [x] Persist to localStorage.

Acceptance criteria:

* [x] Audit trail updates during demo.
* [x] Notifications update during demo.
* [x] Both survive refresh.

---

## 7.5 Add Reset Demo Data

Tasks:

* [x] Add `Reset Demo Data` button in TopBar or Settings.
* [x] Show confirmation modal.
* [x] Clear localStorage demo keys.
* [x] Reload initial mock JSON data.
* [x] Show toast after reset.

Acceptance criteria:

* [x] Demo can be reset cleanly.
* [x] All three golden cases return to initial state.
* [x] No stale localStorage data remains.

---

# 8. Phase 7 — Shared Components

Goal: build reusable UI before pages.

## 8.1 Layout Components

Create:

```txt
src/components/layout/TopBar.tsx
src/components/layout/Sidebar.tsx
src/components/layout/PageWrapper.tsx
```

TopBar must include:

* [x] product name
* [x] active persona switcher
* [x] reset demo data button/dropdown
* [x] notification shortcut

Sidebar must include links to:

* [x] Dashboard
* [x] Findings
* [x] CAPA
* [x] Corrective Actions
* [x] Preventive Actions
* [x] Consolidated Plan
* [x] Similarity
* [x] Topics
* [x] Audit Trail
* [x] Notifications

Acceptance criteria:

* [x] Layout wraps all pages.
* [x] Active route is highlighted.
* [x] Navigation works.

---

## 8.2 Shared UI Components

Create:

```txt
src/components/shared/PersonaSwitcher.tsx
src/components/shared/SeverityBadge.tsx
src/components/shared/StatusBadge.tsx
src/components/shared/ScorePill.tsx
src/components/shared/SourceBadge.tsx
src/components/shared/AILoadingSpinner.tsx
src/components/shared/BlockerBanner.tsx
src/components/shared/EmptyState.tsx
src/components/shared/Toast.tsx
src/components/shared/ConfirmDialog.tsx
```

Acceptance criteria:

* [x] Badges use consistent colors.
* [x] Blocker messages are clear.
* [x] Loading state feels polished.
* [x] Empty states are not generic/lorem ipsum.

---

## 8.3 Nova Components

Create:

```txt
src/components/nova/NovaCoachTip.tsx
src/components/nova/NovaSuggestionCard.tsx
src/components/nova/NovaChatPanel.tsx
src/components/nova/NovaThinkingDots.tsx
```

`NovaSuggestionCard` must support:

* [x] Accept
* [x] Edit
* [x] Replace
* [x] Citation display if available
* [x] Status badge: pending / accepted / edited / replaced

Acceptance criteria:

* [x] User can accept suggestion.
* [x] User can edit suggestion.
* [x] User can replace suggestion.
* [x] Action updates state.
* [x] Audit event is created for Nova suggestion action.

---

## 8.4 Score Components

Create:

```txt
src/components/score/ScoreSidebar.tsx
src/components/score/ScoreBar.tsx
src/components/score/ScoreBreakdown.tsx
```

Must show:

* [x] total score
* [x] audit-ready status
* [x] category breakdown
* [x] improvement tips

Acceptance criteria:

* [x] Score visually updates.
* [x] Score >= 80 shows Audit Ready.
* [x] Score < 80 shows improvement tips.

---

## 8.5 RCA Components

Create:

```txt
src/components/rca/RCAMethodPicker.tsx
src/components/rca/FiveWhysTree.tsx
src/components/rca/FishboneDiagram.tsx
src/components/rca/DecisionTree.tsx
```

Acceptance criteria:

* [ ] Deviation can use 5-Whys.
* [ ] Audit Finding can use Fishbone.
* [ ] Complaint can use Decision Tree.
* [ ] User can confirm root cause.
* [ ] Root cause confirmation updates score.

---

## 8.6 Action Components

Create:

```txt
src/components/actions/CorrectiveActionForm.tsx
src/components/actions/PreventiveActionForm.tsx
src/components/actions/ActionListItem.tsx
```

Acceptance criteria:

* [ ] User can add CA.
* [ ] User can add PA.
* [ ] CA can link to root cause.
* [ ] PA requires future target date.
* [ ] Added actions persist.

---

## 8.7 Sign-Off Components

Create:

```txt
src/components/signoff/SignOffCascade.tsx
src/components/signoff/ESignatureModal.tsx
```

Acceptance criteria:

* [ ] Approval chain renders.
* [ ] E-signature modal opens.
* [ ] Approver can approve or reject.
* [ ] Approval updates state.
* [ ] All approvals close CAPA.

---

## 8.8 Chart Components

Create:

```txt
src/components/charts/TrendLineChart.tsx
src/components/charts/TypeDonutChart.tsx
src/components/charts/RootCauseBarChart.tsx
src/components/charts/DeptHeatmap.tsx
```

Acceptance criteria:

* [x] Dashboard charts render.
* [x] Charts use mock data.
* [x] No chart crashes with empty data.

---

# 9. Phase 8 — Dashboard

Route:

```txt
/dashboard
```

Goal: create a strong opening screen for demo.

Tasks:

* [x] Render summary cards:

  * Total Findings
  * Open CAPAs
  * Overdue CAPAs
  * CAPA Effectiveness Rate
* [x] Render finding trend chart.
* [x] Render breakdown by type.
* [x] Render top root causes.
* [x] Render department completion heatmap.
* [ ] Render recurrence trend.
  - Progress: root cause recurrence counts are shown in the root cause chart.
  - Remaining: add dedicated recurrence trend line if needed.
* [x] Render latest findings table.
* [x] Ensure three golden findings are visible or easily reachable.
* [x] Add alert cards for overdue/approaching CAPAs.
* [x] Add CTA to open findings list.

Acceptance criteria:

* [x] Dashboard immediately communicates the value of AI Coach Nova.
* [x] Three golden cases are reachable.
* [x] Charts show realistic data.
* [x] No empty dashboard on first load.

---

# 10. Phase 9 — Findings Flow

## 10.1 Findings List

Route:

```txt
/findings
```

Tasks:

* [x] Render table of findings.
* [ ] Add filters:
  - Progress: type, severity, status, and department filters are implemented.
  - Remaining: add date filter.

  * type
  * severity
  * status
  * department
  * date
* [x] Add search input.
* [x] Add status badges.
* [x] Add action column:

  * View Finding
  * View CAPA
  * Create CAPA
* [x] Link rows to detail page.

Acceptance criteria:

* [x] User can filter by Deviation/Audit/Complaint.
* [x] User can open all three golden findings.
* [x] Status badges are clear.
* [x] Search works.

---

## 10.2 Finding Detail

Route:

```txt
/findings/:id
```

Tasks:

* [x] Show source system badge.
* [x] Show finding ID.
* [x] Show severity.
* [x] Show department.
* [x] Show reported date.
* [x] Show source prefill panel.
* [x] Show linked CAPA card if CAPA exists.
* [x] Show `Create CAPA with Nova` if CAPA does not exist.
* [x] Show timeline.

Acceptance criteria:

* [x] `DEV-2026-0341` opens correctly.
* [x] `AUD-2026-0089` opens correctly.
* [x] `CMP-2026-0112` opens correctly.
* [x] Create CAPA button routes to `/capa/new` with correct query params.

---

# 11. Phase 10 — CAPA Intake

Route:

```txt
/capa/new
```

Goal: user creates CAPA from source finding with Nova guidance.

Tasks:

* [x] Add CAPA type selector:

  * Deviation
  * Audit Finding
  * Complaint
* [x] Read query params:

  * `type`
  * `sourceId`
* [x] Preselect type if query param exists.
* [x] Add source fetch button:

  * Deviation: `Fetch from Bizzmine`
  * Audit: `Fetch from Q100+`
  * Complaint: `Fetch from Bizzmine Complaint`
* [x] Add mocked loading state.
* [x] Load correct prefill JSON.
* [x] Show imported source data panel.
* [x] Generate suggested CAPA title.
* [x] Generate Nova impact classification.
* [x] Show Major severity.
* [x] Render gate questions.
* [x] Render score sidebar.
* [x] Validate required fields.
* [x] Submit CAPA.
* [x] Link finding to CAPA.
* [x] Add audit trail event.
* [x] Add notification for QA reviewer.
* [x] Redirect to CAPA detail.

Acceptance criteria:

* [x] Deviation intake works.
* [x] Audit Finding intake works.
* [x] Complaint intake works.
* [x] All three classify as Major.
* [x] Submit creates/opens correct CAPA.
* [x] Intake uses English-first copy.

---

# 12. Phase 11 — CAPA List and Detail

## 12.1 CAPA List

Route:

```txt
/capa
```

Tasks:

* [x] Render CAPA table.
* [x] Add filters:

  * type
  * status
  * department
  * severity
  * date
* [x] Add search.
* [x] Add quality score badge.
* [x] Add due date.
* [x] Add action column.
* [x] Link to CAPA detail.

Acceptance criteria:

* [x] Golden CAPAs appear.
* [x] Filter by type works.
* [x] Filter by status works.
* [x] User can open each CAPA.

---

## 12.2 CAPA Detail

Route:

```txt
/capa/:id
```

Tasks:

* [x] Render CAPA header.
* [x] Show CAPA ID.
* [x] Show type badge.
* [x] Show severity badge.
* [x] Show status badge.
* [x] Show quality score.
* [x] Add tabs:

  * Overview
  * 8D Workflow
  * Audit Trail
  * Actions
* [x] Overview tab:

  * source data panel
  * Nova summary
  * similar cases
  * timeline
* [x] 8D tab:

  * stepper
  * current step CTA
* [x] Audit Trail tab:

  * CAPA-specific audit events
* [x] Actions tab:

  * CA list
  * PA list
  * add action buttons

Acceptance criteria:

* [x] `CAPA-2026-0341` loads.
* [x] `CAPA-2026-0089` loads.
* [x] `CAPA-2026-0112` loads.
* [x] Invalid CAPA ID shows clean not-found state.
* [x] User can continue workflow from current step.

---

# 13. Phase 12 — 8D Workflow

Goal: build the core demo workflow.

## 13.1 D1 Problem Statement

Route:

```txt
/capa/:id/8d/problem
```

Tasks:

* [x] Render problem statement editor.
* [x] Preload suggested problem for golden case.
* [x] Show Nova improvement tips.
* [x] Update score while editing.
* [x] Validate minimum specificity.
* [x] Require:

  * date
  * area/location
  * equipment ID or system reference where relevant
  * batch/lot where relevant
  * measurable observation or clear issue
* [x] Show blocker if invalid.
* [x] Continue to containment if valid.
* [x] Add audit event on save/continue.

Acceptance criteria:

* [x] Weak statement is blocked.
* [x] Strong statement advances.
* [x] Score improves after better statement.
* [x] Works for all three golden cases.

---

## 13.2 D2 Containment

Route:

```txt
/capa/:id/8d/containment
```

Tasks:

* [x] Render action description input.
* [x] Render PIC dropdown.
* [x] Render due date picker.
* [x] Render Nova suggestion card.
* [x] Support Accept/Edit/Replace.
* [x] Validate:

  * action length
  * PIC selected
  * due date is not past
* [x] Update containment score.
* [x] Add audit event.
* [x] Add notification if needed.
* [x] Continue to RCA.

Acceptance criteria:

* [x] Containment suggestion loads for each golden case.
* [x] Accept/Edit/Replace works.
* [x] Invalid containment is blocked.
* [x] Valid containment advances.

---

## 13.3 D3 Root Cause Analysis

Route:

```txt
/capa/:id/8d/rca
```

Tasks:

* [x] Render RCA method picker.
* [x] Default method by case:

  * Deviation: 5-Whys
  * Audit Finding: Fishbone
  * Complaint: Decision Tree
* [x] Render selected RCA UI.
* [x] Load Nova suggestions.
* [x] Show citations where relevant.
* [x] Allow user to accept/edit/replace suggestions.
* [x] Allow user to confirm root cause.
* [x] Validate confirmed root cause exists.
* [x] Update root cause score.
* [x] Add audit event.
* [x] Continue to Corrective Action.

Acceptance criteria:

* [x] Deviation 5-Whys works.
* [x] Audit Fishbone works.
* [x] Complaint Decision Tree works.
* [x] No confirmed root cause blocks progress.
* [x] Confirmed root cause advances.

---

## 13.4 D4 Corrective Action

Route:

```txt
/capa/:id/8d/ca
```

Tasks:

* [x] Render CA list.
* [x] Render add CA form.
* [x] Load Nova CA suggestions.
* [x] Support Accept/Edit/Replace.
* [x] Each CA must have:

  * description
  * PIC
  * due date
  * linked root cause
  * verification method
* [x] Validate at least one CA linked to root cause.
* [x] Update action effectiveness score.
* [x] Add CA to global action list.
* [x] Add audit event.
* [x] Continue to Preventive Action.

Acceptance criteria:

* [x] CA suggestions load for all three cases.
* [x] CA must link to root cause.
* [x] Added CA appears in CAPA detail and global CA list.
* [x] Valid CA advances.

---

## 13.5 D5 Preventive Action

Route:

```txt
/capa/:id/8d/pa
```

Tasks:

* [x] Render PA list.
* [x] Render add PA form.
* [x] Load Nova PA suggestions.
* [x] Support Accept/Edit/Replace.
* [x] Each PA must have:

  * description
  * PIC
  * target date
* [x] Validate at least one PA.
* [x] Validate future target date.
* [x] Update action effectiveness score.
* [x] Add PA to global action list.
* [x] Add audit event.
* [x] Continue to Verification.

Acceptance criteria:

* [x] PA suggestions load for all three cases.
* [x] Past target date is blocked.
* [x] Added PA appears in CAPA detail and global PA list.
* [x] Valid PA advances.

---

## 13.6 D6 Verification

Route:

```txt
/capa/:id/8d/verification
```

Tasks:

* [x] Render verification method dropdown.
* [x] Render result text area.
* [x] Render mock evidence upload.
* [x] Show Nova verification coaching button.
* [x] Open Nova chat/panel for coaching.
* [x] Validate:

  * method exists
  * result exists
  * evidence filename exists
* [x] Update score.
* [x] Add audit event.
* [x] Continue to Sign-Off.

Acceptance criteria:

* [x] Missing method/result/evidence blocks progress.
* [x] Mock upload shows uploaded filename.
* [x] Verification completion advances to sign-off.
* [x] Works for all three golden cases.

---

## 13.7 D7 Sign-Off

Route:

```txt
/capa/:id/8d/signoff
```

Tasks:

* [x] Render final quality score.
* [x] Show Audit Ready badge if score >= 80.
* [x] Block sign-off if score < 80.
* [x] Render approval chain based on CAPA type.
* [x] Render e-signature modal.
* [x] Allow approve/reject with notes.
* [x] Add audit event for each approval.
* [x] Add notification for next approver.
* [x] When all approvers approve:

  * set status to `closed`
  * mark CAPA as Audit Ready
  * update finding status to `capa_closed`
  * add final audit event
  * add closure notifications

Approval chains:

### Deviation

1. Bambang Saputra
2. Siti Rahmawati
3. Dewi Anggraini

### Audit Finding

1. Bambang Saputra
2. Siti Rahmawati
3. Dewi Anggraini

### Complaint

1. Siti Rahmawati
2. Bambang Saputra
3. Dewi Anggraini

Acceptance criteria:

* [x] Score < 80 blocks final approval.
* [x] Score >= 80 allows approval.
* [x] All three golden cases can close.
* [x] Closure persists after refresh.

---

# 14. Phase 13 — Global Action Screens

## 14.1 Corrective Action List

Route:

```txt
/actions/corrective
```

Tasks:

* [x] Render global CA table.
* [x] Add filters:

  * status
  * PIC
  * department
  * due date
* [x] Add CAPA link.
* [x] Add status update action.
* [x] Add overdue badge if relevant.

Acceptance criteria:

* [x] All CA entries appear.
* [x] Added CA from workflow appears here.
* [x] Each CA links back to CAPA.

---

## 14.2 Preventive Action List

Route:

```txt
/actions/preventive
```

Tasks:

* [ ] Render global PA table.
* [ ] Add filters:

  * status
  * PIC
  * department
  * target date
* [ ] Add CAPA link.
* [ ] Add recurrence indicator.
* [ ] Add status update action.

Acceptance criteria:

* [ ] All PA entries appear.
* [ ] Added PA from workflow appears here.
* [ ] Each PA links back to CAPA.

---

## 14.3 Consolidated Action Plan

Route:

```txt
/actions/consolidated
```

Tasks:

* [ ] Render grouped CA + PA view.
* [ ] Group by:

  * root cause cluster
  * department
  * risk priority
* [ ] Add mocked AI clustering button.
* [ ] Show loading state.
* [ ] Show grouped results.
* [ ] Add export button with mocked toast.

Acceptance criteria:

* [ ] Page looks like management overview.
* [ ] AI clustering button works with mock loading.
* [ ] Export button shows mocked toast.

---

# 15. Phase 14 — Similarity, Topics, Audit Trail, Notifications

## 15.1 Similarity Explorer

Route:

```txt
/similarity
```

Tasks:

* [ ] Render search input.
* [ ] Render AI Search button.
* [ ] Add mocked loading state.
* [ ] Render similarity result cards.
* [ ] Show:

  * similarity score
  * root cause
  * year
  * outcome
  * source type
* [ ] Add filters:

  * min similarity
  * outcome
  * type
  * year
* [ ] Add result detail modal.

Acceptance criteria:

* [ ] User can search with any text.
* [ ] Mock results appear.
* [ ] Results feel relevant to CAPA demo.

---

## 15.2 Topics Grouping

Route:

```txt
/topics
```

Tasks:

* [ ] Render Analyze Topics button.
* [ ] Add mocked loading state.
* [ ] Render cluster cards.
* [ ] Show:

  * cluster name
  * finding count
  * CAPA count
  * severity distribution
  * trend
  * risk level
  * related findings
* [ ] Add links to related findings.

Acceptance criteria:

* [ ] Topic analysis looks AI-powered.
* [ ] Cluster cards are readable.
* [ ] Related findings are clickable.

---

## 15.3 Global Audit Trail

Route:

```txt
/audit-trail
```

Tasks:

* [ ] Render audit trail table.
* [ ] Add filters:

  * event domain
  * CAPA ID
  * finding ID
  * actor
  * date
* [ ] Show event domain badge:

  * system
  * ai_decision
  * integration
  * clear_labeling
* [ ] Show before/after where available.
* [ ] Show AI model metadata for Nova events.
* [ ] Add mocked export button.

Acceptance criteria:

* [ ] Audit trail shows initial seed events.
* [ ] Workflow actions add events.
* [ ] Nova decisions are auditable.
* [ ] Export button shows mocked toast.

---

## 15.4 Notification Center

Route:

```txt
/notifications
```

Tasks:

* [ ] Render notification list for active persona.
* [ ] Add filters:

  * All
  * Unread
  * CAPA Updates
  * Approvals
  * Overdue
* [ ] Add read/unread state.
* [ ] Add Mark All as Read.
* [ ] Add mocked settings toggles.
* [ ] Add links to related CAPA.

Acceptance criteria:

* [ ] Notifications filter by active persona.
* [ ] Mark as read works.
* [ ] Workflow actions create relevant notifications.

---

# 16. Phase 15 — Nova Chat and Slide-over Panels

## 16.1 Nova Chat Panel

Tasks:

* [ ] Add global slide-over panel.
* [ ] Trigger from `Ask Nova` button.
* [ ] Pass context:

  * CAPA ID
  * current 8D step
  * active persona
* [ ] Show scripted response if known.
* [ ] Show fallback response if unknown.
* [ ] Add loading state.
* [ ] Keep responses concise.

Acceptance criteria:

* [ ] Nova chat opens from 8D screens.
* [ ] Nova responds with English-first copy.
* [ ] Unscripted user input does not break chat.

---

## 16.2 KG Citation Detail Panel

Tasks:

* [ ] Add citation card component.
* [ ] Add slide-over detail panel.
* [ ] Show:

  * historical CAPA ID
  * finding ID
  * similarity score
  * root cause
  * corrective action
  * year
  * outcome
  * source type

Acceptance criteria:

* [ ] Citation cards are clickable.
* [ ] Detail panel opens.
* [ ] Panel closes safely.

---

## 16.3 Export Menu

Tasks:

* [ ] Add export menu in CAPA detail.
* [ ] Options:

  * PDF
  * Word
  * Excel
  * JSON
  * Share Link
  * Send to Bizzmine
* [ ] All options may be mocked.
* [ ] Show toast for mocked actions.

Acceptance criteria:

* [ ] Export menu opens.
* [ ] Every option gives feedback.
* [ ] No dead menu item.

---

# 17. Phase 16 — Polish

Goal: make the prototype feel demo-ready.

Tasks:

* [ ] Add page fade transition.
* [ ] Add Nova thinking dots.
* [ ] Add shimmer loading for AI/import actions.
* [ ] Add score count-up animation.
* [ ] Add blocker shake animation.
* [ ] Add confetti when score first reaches Audit Ready.
* [ ] Improve empty states.
* [ ] Improve table spacing.
* [ ] Improve card hierarchy.
* [ ] Add icons consistently.
* [ ] Ensure all text is English-first.
* [ ] Remove placeholder text.
* [ ] Remove console logs unless useful for demo.
* [ ] Check browser console for errors.

Acceptance criteria:

* [ ] Demo feels polished.
* [ ] No obvious visual jank.
* [ ] No Bahasa UI copy remains except names/departments/context.
* [ ] No broken buttons.

---

# 18. Manual QA Checklist

Run this before considering the prototype done.

## 18.1 Foundation QA

* [ ] `npm install` works.
* [ ] `npm run dev` works.
* [ ] `npm run build` works.
* [ ] No TypeScript errors.
* [ ] No console errors during normal navigation.
* [ ] All routes render.
* [ ] Invalid route shows Not Found.

## 18.2 Dashboard QA

* [ ] Dashboard loads.
* [ ] Stats cards show data.
* [ ] Charts render.
* [ ] Latest findings show golden cases.
* [ ] Clicking golden cases works.

## 18.3 Deviation Golden Flow QA

Complete:

* [ ] Open `/findings/DEV-2026-0341`.
* [ ] Create CAPA with Nova.
* [ ] Fetch from Bizzmine.
* [ ] Submit to QA.
* [ ] Complete D1 Problem.
* [ ] Complete D2 Containment.
* [ ] Complete D3 5-Whys RCA.
* [ ] Complete D4 Corrective Action.
* [ ] Complete D5 Preventive Action.
* [ ] Complete D6 Verification.
* [ ] Complete D7 Sign-Off.
* [ ] Confirm status becomes Closed.
* [ ] Confirm Audit Ready badge appears.
* [ ] Refresh page.
* [ ] Confirm state persists.

## 18.4 Audit Finding Golden Flow QA

Complete:

* [ ] Open `/findings/AUD-2026-0089`.
* [ ] Create CAPA with Nova.
* [ ] Fetch from Q100+.
* [ ] Submit to QA Compliance.
* [ ] Complete D1 Problem.
* [ ] Complete D2 Containment.
* [ ] Complete D3 Fishbone RCA.
* [ ] Complete D4 Corrective Action.
* [ ] Complete D5 Preventive Action.
* [ ] Complete D6 Verification.
* [ ] Complete D7 Sign-Off.
* [ ] Confirm status becomes Closed.
* [ ] Confirm Audit Ready badge appears.

## 18.5 Complaint Golden Flow QA

Complete:

* [ ] Open `/findings/CMP-2026-0112`.
* [ ] Create CAPA with Nova.
* [ ] Fetch from Bizzmine Complaint.
* [ ] Submit to QA Complaint.
* [ ] Complete D1 Problem.
* [ ] Complete D2 Containment.
* [ ] Complete D3 Decision Tree RCA.
* [ ] Complete D4 Corrective Action.
* [ ] Complete D5 Preventive Action.
* [ ] Complete D6 Verification.
* [ ] Complete D7 Sign-Off.
* [ ] Confirm status becomes Closed.
* [ ] Confirm Audit Ready badge appears.

## 18.6 State QA

* [ ] Refresh does not lose workflow progress.
* [ ] Reset Demo Data works.
* [ ] Reset returns all golden cases to initial state.
* [ ] Persona switch persists.
* [ ] Read notifications persist.
* [ ] Audit events persist.

## 18.7 Supporting Screens QA

* [ ] CAPA list works.
* [ ] Corrective Action list works.
* [ ] Preventive Action list works.
* [ ] Consolidated Action Plan works.
* [ ] Similarity Explorer works.
* [ ] Topics Grouping works.
* [ ] Audit Trail works.
* [ ] Notifications work.
* [ ] Settings/Persona page works or has clear demo placeholder.

---

# 19. Final Definition of Done

The prototype is done only when:

* [ ] All three golden cases work end-to-end.
* [ ] All routes render safely.
* [ ] Dashboard looks realistic.
* [ ] CAPA workflow D1–D7 works.
* [ ] Nova suggestions work.
* [ ] Accept/Edit/Replace works.
* [ ] Quality score updates.
* [ ] Score >= 80 enables Audit Ready.
* [ ] Score < 80 blocks sign-off.
* [ ] E-signature approval works.
* [ ] Audit trail updates.
* [ ] Notifications update.
* [ ] Runtime state persists after refresh.
* [ ] Reset Demo Data works.
* [ ] No backend exists.
* [ ] No real API calls exist.
* [ ] No real AI calls exist.
* [ ] No dead primary buttons exist.
* [ ] No raw JSON is visible.
* [ ] No lorem ipsum remains.
* [ ] UI copy is English-first.
* [ ] Build passes.

---

# 20. Recommended Execution Instruction for AI Agent

Follow this todo list in order.

Do not jump directly into polishing.

Implementation order:

1. Foundation
2. Types
3. Mock Data
4. Utilities
5. Services
6. Stores
7. Shared Components
8. Dashboard
9. Findings Flow
10. CAPA Intake
11. CAPA Detail
12. 8D Workflow
13. Global Screens
14. Nova Panels
15. Polish
16. Manual QA

After completing each phase:

* run the app,
* check for TypeScript errors,
* check for console errors,
* verify acceptance criteria,
* commit or summarize completed work before moving to next phase.

Prioritize a working deterministic demo over architectural perfection.
