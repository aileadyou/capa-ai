# RULES.md — AI Coach Nova Prototype Rules

## 1. Project Identity

This project is a frontend-only demo prototype named:

**AI Coach Nova**

The AI assistant inside the product must always be called:

**Nova**

Do not rename the product or AI assistant.

---

## 2. Primary Objective

The goal is to build a polished, deterministic demo prototype for a 15–20 minute stakeholder pitch.

The goal is **not** to build a production-ready CAPA system.

Prioritize:

1. working demo flow,
2. clear UI,
3. reliable navigation,
4. realistic mock data,
5. smooth Nova interactions,
6. complete three end-to-end CAPA cases,
7. no broken screens,
8. no dead primary buttons.

---

## 3. Tech Stack Rules

Use the approved stack only:

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* Zustand
* Recharts
* Radix UI primitives where needed
* Lucide icons
* JSON mock data

Do not replace React Router with state-based navigation.

Do not introduce Next.js.

Do not introduce a backend framework.

Do not introduce a database.

Do not add new dependencies unless clearly necessary.

If a dependency is added, document why it is needed.

---

## 4. Data Rules

All initial data must come from JSON files inside:

```txt
src/mock-data/
```

Allowed:

* route config,
* label mappings,
* status color mappings,
* small UI constants.

Not allowed:

* large mock data hardcoded inside React components,
* full CAPA cases hardcoded inside pages,
* Nova scripts hardcoded inside components,
* dashboard analytics hardcoded inside components.

Runtime state should be managed through Zustand and persisted with localStorage.

---

## 5. No Real Integration Rules

Do not build or call:

* backend API,
* database,
* real AI API,
* real LLM endpoint,
* real Bizzmine integration,
* real Q100+ integration,
* real MES integration,
* real authentication,
* real SSO,
* real e-signature provider,
* real file upload storage,
* real email sending,
* real notification service.

All integrations must be simulated with mock JSON and deterministic delays.

---

## 6. Language Rules

The prototype must use **English-first UI content**.

Use English for:

* navigation labels,
* buttons,
* form labels,
* table columns,
* toast messages,
* blocker messages,
* Nova responses,
* audit trail events,
* notifications,
* empty states.

Indonesian names, departments, personas, and company context may remain Indonesian.

Examples:

| Wrong                       | Correct                |
| --------------------------- | ---------------------- |
| Tanya Nova                  | Ask Nova               |
| Ditransfer dari Bizzmine    | Imported from Bizzmine |
| Nova sedang menganalisis... | Nova is analyzing...   |
| Setujui                     | Approve                |
| Tolak                       | Reject                 |
| Siap Audit                  | Audit Ready            |

---

## 7. Demo Scope Rules

The prototype must support three end-to-end CAPA cases:

| Type          | Finding ID    | CAPA ID        | Source             | RCA Method    |
| ------------- | ------------- | -------------- | ------------------ | ------------- |
| Deviation     | DEV-2026-0341 | CAPA-2026-0341 | Bizzmine           | 5-Whys        |
| Audit Finding | AUD-2026-0089 | CAPA-2026-0089 | Q100+              | Fishbone      |
| Complaint     | CMP-2026-0112 | CAPA-2026-0112 | Bizzmine Complaint | Decision Tree |

All three primary demo cases must use **Major** severity.

Critical cases may exist as secondary mock data, but they are not the primary demo flow.

---

## 8. Routing Rules

Use URL-based navigation with React Router.

Required routes:

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

Rules:

* `/` must redirect to `/dashboard`.
* Every route must render safely.
* Invalid routes must show a clean not-found page.
* Invalid IDs must show a clean not-found state.
* Browser back/forward must work.

---

## 9. State Persistence Rules

Use Zustand for runtime state.

Persist demo progress to localStorage.

The following must persist after refresh:

* active persona,
* CAPA workflow progress,
* current 8D step,
* accepted/edited/replaced Nova suggestions,
* corrective actions,
* preventive actions,
* verification data,
* approval status,
* CAPA status,
* audit trail events,
* notification read/unread state.

Add a `Reset Demo Data` button.

Reset behavior:

1. show confirmation modal,
2. clear demo localStorage keys,
3. reload initial mock JSON state,
4. show success toast.

---

## 10. Nova Rules

Nova is a simulated AI coach.

Nova must feel:

* professional,
* concise,
* audit-aware,
* quality-minded,
* helpful,
* structured.

Nova must not feel:

* magical,
* overly verbose,
* too casual,
* too salesy,
* like a generic chatbot.

Nova responses should usually follow this structure:

```txt
Observation:
...

Recommendation:
...

Audit Rationale:
...
```

Nova suggestions must support:

* Accept
* Edit
* Replace

Every Nova-related decision should be reflected in the audit trail.

---

## 11. Mock AI Rules

All AI interactions must use mock JSON and deterministic delay.

Use a utility similar to:

```ts
async function mockAICall<T>(responseKey: string, delayMs = 2000): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return mockResponse as T
}
```

Do not call real AI APIs.

Do not require API keys.

Do not add environment variables for AI.

---

## 12. Quality Score Rules

Quality score is rule-based and computed in the frontend.

Total score:

```txt
0–100
```

Score breakdown:

| Category             | Max Score |
| -------------------- | --------: |
| Problem Specificity  |        25 |
| Root Cause Depth     |        25 |
| Action Effectiveness |        25 |
| Containment Strength |        25 |

Audit readiness rule:

```txt
score >= 80 = Audit Ready
score < 80 = Not Audit Ready
```

Sign-off must be blocked if score is below 80.

Score should improve when the user adds:

* date,
* location/area,
* equipment ID,
* batch/lot number,
* measurable observation,
* confirmed root cause,
* corrective action linked to root cause,
* preventive action,
* verification evidence.

---

## 13. Audit Trail Rules

Every meaningful action must create an audit event.

Required audit events include:

* source data imported,
* Nova severity classification generated,
* Nova suggestion accepted,
* Nova suggestion edited,
* Nova suggestion replaced,
* problem statement updated,
* containment action added,
* root cause confirmed,
* corrective action added,
* preventive action added,
* verification completed,
* e-signature submitted,
* CAPA approved,
* CAPA closed.

Audit trail text must be English-first.

Example:

```txt
Nova generated Major severity classification with 86% confidence.
Siti Rahmawati approved CAPA-2026-0341 with electronic signature.
CAPA-2026-0341 was marked as Audit Ready and Closed.
```

Nova audit events should include:

* model name: `Nova Mock Engine`,
* model version: `nova-demo-v1`,
* confidence score,
* timestamp.

---

## 14. Notification Rules

Notifications are mocked but must behave consistently.

Required notification triggers:

| Trigger                            | Recipient             |
| ---------------------------------- | --------------------- |
| CAPA submitted                     | QA reviewer           |
| CAPA ready for department approval | Department Head       |
| Department approved                | QA reviewer           |
| QA review approved                 | Head of QA            |
| CAPA rejected                      | Initiator             |
| Action due soon                    | PIC                   |
| CAPA closed                        | All involved personas |

Notifications must support:

* read/unread state,
* mark as read,
* mark all as read,
* filtering by active persona,
* link to related CAPA.

---

## 15. UI Stability Rules

Every primary button must either:

1. perform an action, or
2. show a mocked toast explaining the simulated action.

Do not leave dead buttons.

For mocked actions, use clear toast copy:

```txt
Mock email notification sent.
```

```txt
Export will be available in the production version.
```

```txt
Mock evidence uploaded.
```

---

## 16. Validation Rules

Each 8D step must have blocker validation.

Required blockers:

| Step            | Blocker                                |
| --------------- | -------------------------------------- |
| D1 Problem      | statement too vague                    |
| D2 Containment  | missing action, PIC, or valid due date |
| D3 RCA          | no confirmed root cause                |
| D4 CA           | no CA linked to root cause             |
| D5 PA           | no PA or invalid target date           |
| D6 Verification | missing method, result, or evidence    |
| D7 Sign-Off     | score below 80 or missing approvals    |

Blocker messages must be clear and actionable.

---

## 17. Design Rules

Use the existing design direction:

* enterprise medical SaaS look,
* clean dashboard,
* professional spacing,
* card-based layout,
* clear badges,
* visible score sidebar,
* Nova accent color,
* readable tables.

Use Tailwind CSS and CSS variables.

Do not use ShadCN CLI.

Do not add a separate design system library.

---

## 18. Component Rules

Prefer reusable components for:

* badges,
* score display,
* Nova suggestion cards,
* tables,
* blocker banners,
* empty states,
* modals,
* slide-over panels,
* action forms.

Avoid excessive abstraction before the UI works.

Do not create unnecessary generic frameworks.

---

## 19. Error Handling Rules

Every ID-based page must handle missing data safely.

Required states:

* loading,
* found,
* not found,
* empty,
* validation blocked.

The app must not crash when optional mock fields are missing.

---

## 20. Build Order Rules

Follow this order:

1. foundation,
2. types,
3. mock data,
4. utilities,
5. services,
6. stores,
7. shared components,
8. dashboard,
9. findings flow,
10. CAPA intake,
11. CAPA detail,
12. 8D workflow,
13. global screens,
14. Nova panels,
15. polish,
16. QA.

Do not jump to polish before the core demo flow works.

---

## 21. Definition of Done

The prototype is done only when:

* all three golden cases work end-to-end,
* all routes render safely,
* dashboard looks realistic,
* CAPA workflow D1–D7 works,
* Nova suggestions work,
* Accept/Edit/Replace works,
* quality score updates,
* score >= 80 enables Audit Ready,
* score < 80 blocks sign-off,
* e-signature approval works,
* audit trail updates,
* notifications update,
* runtime state persists after refresh,
* Reset Demo Data works,
* no backend exists,
* no real API calls exist,
* no real AI calls exist,
* no dead primary buttons exist,
* no raw JSON is visible,
* no lorem ipsum remains,
* UI copy is English-first,
* build passes.

