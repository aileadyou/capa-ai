# AGENTS_HANDOFF.md

## Purpose

This document defines the required workflow for any AI agent working on this project.

Every agent must follow this handoff process before starting work, while working, and after finishing work.

This project is a frontend-only demo prototype for **AI Coach Nova**.

The goal is to build a polished, deterministic CAPA demo based on the project plan and task list.

---

## Required Files

The agent must use these files:

```txt
TO_DOS.md
PLANS.md
RULES.md
BUILD_LOGS.md
```

### File Responsibilities

| File            | Purpose                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| `TO_DOS.md`     | Main execution checklist. Use this to decide what to work on next.                        |
| `PLANS.md`      | Source of truth for product plan, demo flow, screens, data models, and project direction. |
| `RULES.md`      | Hard constraints and implementation rules. Must be followed at all times.                 |
| `BUILD_LOGS.md` | Work history. Every completed work session must be recorded here.                         |

---

## Core Agent Workflow

Every agent must follow this workflow:

1. Check `TO_DOS.md`.
2. Find unfinished tasks.
3. If the task is unclear, check `PLANS.md`.
4. Before coding, check `RULES.md`.
5. Start implementation.
6. After finishing, update `TO_DOS.md`.
7. After finishing, write a dated work log in `BUILD_LOGS.md`.

Do not skip these steps.

---

## Step 1 — Read TO_DOS.md First

Before doing any implementation, open:

```txt
TO_DOS.md
```

Find the next unfinished task.

Unfinished tasks are marked like this:

```md
- [ ] Task name
```

Finished tasks are marked like this:

```md
- [x] Task name
```

The agent should prioritize tasks in the order written in `TO_DOS.md`.

Do not jump to later phases unless earlier required phases are already complete or explicitly blocked.

---

## Step 2 — Identify the Next Work Item

When selecting a task, the agent must identify:

* which phase the task belongs to,
* what files are likely affected,
* what acceptance criteria must pass,
* whether the task depends on another unfinished task.

Before starting, the agent should be able to summarize:

```txt
I am working on: [task name]
Source checklist: TO_DOS.md
Relevant plan section: [section in PLANS.md if needed]
Expected output: [what should exist after implementation]
```

---

## Step 3 — Use PLANS.md When Confused

If the agent is confused about product direction, screen behavior, data shape, demo flow, or business logic, open:

```txt
PLANS.md
```

Use `PLANS.md` as the source of truth for:

* product purpose,
* demo scenario,
* golden demo flow,
* screen inventory,
* CAPA workflow,
* data models,
* mock JSON plan,
* Nova behavior,
* scoring rules,
* approval flow,
* design direction,
* route structure.

Do not invent product behavior if it already exists in `PLANS.md`.

If `TO_DOS.md` and `PLANS.md` conflict, follow this priority:

```txt
RULES.md > PLANS.md > TO_DOS.md
```

Reason:

* `RULES.md` contains hard constraints.
* `PLANS.md` contains product truth.
* `TO_DOS.md` contains execution order.

---

## Step 4 — Check RULES.md Before Coding

Before making changes, open:

```txt
RULES.md
```

The agent must follow all rules in this file.

Important rules include:

* no backend,
* no database,
* no real AI API,
* no real external integration,
* no real authentication,
* no real email,
* no real file upload service,
* no unnecessary dependencies,
* English-first UI copy,
* React Router must be used,
* Zustand must be used for runtime state,
* mock JSON must be used for initial data,
* localStorage must be used for demo persistence.

If a task seems to require breaking `RULES.md`, do not break the rule.
Instead, implement a mocked or frontend-only version.

---

## Step 5 — Start Implementation

After checking `TO_DOS.md`, `PLANS.md`, and `RULES.md`, start implementation.

Implementation principles:

* prioritize working demo flow over architectural perfection,
* keep changes small and focused,
* avoid unrelated refactors,
* do not modify files unrelated to the task unless necessary,
* do not add hidden features,
* do not over-engineer,
* keep UI copy English-first,
* keep data in JSON files when data is mock data,
* avoid hardcoding large domain data inside components.

---

## Step 6 — Validate the Work

After implementation, validate the task.

At minimum, run:

```bash
npm run build
```

If available, also run:

```bash
npm run lint
```

If the project does not have lint configured, do not add lint just for this task unless explicitly required.

Also manually verify:

* the route renders,
* no runtime crash occurs,
* primary buttons work or show mocked toast,
* the implemented behavior matches `TO_DOS.md`,
* the implementation does not violate `RULES.md`.

---

## Step 7 — Update TO_DOS.md

After completing a task, update `TO_DOS.md`.

Change completed tasks from:

```md
- [ ] Task name
```

to:

```md
- [x] Task name
```

Only mark a task as done if it is actually implemented and validated.

Do not mark a whole phase as done if only part of it is complete.

If a task is partially complete, leave it unchecked and add a note below it:

```md
- [ ] Task name
  - Progress: [what has been completed]
  - Remaining: [what still needs to be done]
```

---

## Step 8 — Update BUILD_LOGS.md

After finishing work, the agent must update:

```txt
BUILD_LOGS.md
```

Every work session must be logged with the date.

Use this format:

```md
## YYYY-MM-DD — Short Work Summary

### Completed
- ...

### Changed Files
- `path/to/file.tsx`
- `path/to/file.ts`

### Validation
- `npm run build` — passed/failed
- `npm run lint` — passed/failed/not available
- Manual check — passed/failed

### Notes
- ...

### Next Recommended Task
- ...
```

If build or validation fails, write the failure honestly.

Do not hide failed validation.

Example:

```md
## 2026-05-30 — Added Routing Foundation

### Completed
- Added React Router setup.
- Created placeholder pages for all required routes.
- Redirected `/` to `/dashboard`.
- Added clean Not Found page.

### Changed Files
- `src/router.tsx`
- `src/App.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/NotFound.tsx`

### Validation
- `npm run build` — passed
- Manual route check — passed

### Notes
- Pages are still placeholders.
- Sidebar navigation is not implemented yet.

### Next Recommended Task
- Build layout shell: TopBar, Sidebar, PageWrapper.
```

---

## Required BUILD_LOGS.md Behavior

The agent must update `BUILD_LOGS.md` after every completed work session.

A work session means:

* one coding pass,
* one completed phase,
* one completed feature,
* one debugging session,
* one refactor,
* one documentation update.

The log must include:

* date,
* summary,
* completed work,
* changed files,
* validation result,
* notes,
* next recommended task.

Do not simply write:

```txt
Updated files.
```

Be specific.

---

## What To Do If BUILD_LOGS.md Does Not Exist

If `BUILD_LOGS.md` does not exist yet, create it.

Initial content:

```md
# BUILD_LOGS.md

This file records all completed work sessions for the AI Coach Nova prototype.

Every AI agent must append a dated entry after finishing work.
```

Then append the first work log entry below it.

---

## What To Do If TO_DOS.md Is Missing

If `TO_DOS.md` is missing, stop implementation.

Do not guess the task list.

Report that `TO_DOS.md` is required before work can continue.

---

## What To Do If PLANS.md Is Missing

If `PLANS.md` is missing, continue only if the task in `TO_DOS.md` is very clear and does not require product interpretation.

If product behavior is unclear, stop and ask for `PLANS.md`.

Do not invent product flow.

---

## What To Do If RULES.md Is Missing

If `RULES.md` is missing, continue cautiously only for documentation or harmless setup tasks.

For implementation tasks, stop and ask for `RULES.md`.

Reason:

`RULES.md` contains hard constraints that prevent over-engineering and wrong implementation direction.

---

## Conflict Resolution

If documents conflict, use this priority:

```txt
1. RULES.md
2. PLANS.md
3. TO_DOS.md
4. Existing codebase
5. Agent judgment
```

Examples:

### Example 1

If `TO_DOS.md` suggests adding a real API but `RULES.md` says no backend:

Follow `RULES.md`.

Use mock JSON instead.

### Example 2

If existing code uses state-only navigation but `RULES.md` says React Router is required:

Follow `RULES.md`.

Migrate to React Router.

### Example 3

If `TO_DOS.md` is vague about screen behavior:

Check `PLANS.md`.

---

## Coding Standards

Follow these standards:

* Use TypeScript.
* Prefer clear types over `any`.
* Keep components focused.
* Keep mock data outside components.
* Use reusable UI components when practical.
* Avoid premature abstraction.
* Use meaningful file names.
* Use English UI copy.
* Use stable deterministic mock behavior.
* Add safe fallbacks for missing data.
* Do not leave broken imports.
* Do not leave unused major code.
* Do not leave console errors.

---

## UI Standards

The UI should feel like an enterprise medical SaaS demo.

Prioritize:

* clarity,
* clean spacing,
* readable tables,
* useful badges,
* clear workflow steps,
* visible score sidebar,
* smooth Nova interactions,
* obvious CTA buttons.

Avoid:

* playful visuals,
* clutter,
* raw technical dumps,
* inconsistent spacing,
* inconsistent copy,
* mixed Indonesian/English UI labels,
* excessive animations.

---

## Mocking Standards

All mocked behavior must be clear but polished.

For AI loading:

```txt
Nova is analyzing...
Nova is importing source data...
Nova is generating suggestions...
Nova is checking audit readiness...
```

For mocked actions:

```txt
Mock evidence uploaded.
Mock email notification sent.
Export will be available in the production version.
```

Do not silently do nothing.

---

## Agent Completion Checklist

Before ending a work session, the agent must confirm:

* [ ] I checked `TO_DOS.md`.
* [ ] I followed the next unfinished task.
* [ ] I checked `PLANS.md` if product behavior was unclear.
* [ ] I checked `RULES.md`.
* [ ] I implemented only relevant changes.
* [ ] I avoided backend/API/real AI work.
* [ ] I kept UI copy English-first.
* [ ] I validated the change.
* [ ] I updated `TO_DOS.md`.
* [ ] I updated `BUILD_LOGS.md`.

---

## Final Reminder

This project is a demo prototype.

The best implementation is not the most abstract or most production-like implementation.

The best implementation is:

* stable,
* clickable,
* polished,
* deterministic,
* easy to demo,
* easy to reset,
* easy for the next agent to continue.

Always leave the project in a better, clearer state than before.
