# TODO — Wireframe Implementation Tasks
> Generated from `docs/wireframe.html` · 2026-05-31

---

## NAVIGATION & SHELL

- [ ] **Persistent sidebar** — replace current per-page nav with a fixed left sidebar (My Work, Dashboard, Findings, All CAPAs, Reports, Settings)
- [ ] **My Work / Inbox as default landing** — change `/` route from Dashboard to My Work page
- [ ] **Top bar** — breadcrumb + notification bell + Nova AI button + user avatar. No primary actions in top bar.

---

## SCREEN 03 · My Work / Inbox

- [ ] New page at `/` (or `/my-work`)
- [ ] "Needs Attention" section — overdue CAPAs, highlighted with left border
- [ ] "My Active CAPAs" section — sorted by due date
- [ ] "Pending My Review" section — CAPAs awaiting the logged-in user's sign-off
- [ ] "Recently Closed" section — faded, last 1–3 closed CAPAs
- [ ] Personalized greeting with date and active CAPA count

---

## SCREEN 04 · Dashboard

- [ ] Move Dashboard from default landing to `/analytics`
- [ ] KPI cards: Total Findings, Open CAPAs, Overdue CAPAs, Effectiveness Rate
- [ ] Finding Trend line chart (12 months)
- [ ] Breakdown by Type donut chart
- [ ] Top Root Cause Categories bar chart
- [ ] Dept Completion Heatmap (dept row with % bar + open count)
- [ ] Drill-down: clicking KPI card → CAPA List pre-filtered

---

## SCREEN 05 · Findings List + Slide-over

- [ ] **Slide-over panel** for finding detail (right panel, ~400px wide, list stays visible behind)
- [ ] Slide-over: Finding ID, Reported, Area/Equipment, Affected Batches, Initial Observation, Nova Classification
- [ ] "Create CAPA" button **only** on Findings page (remove from CAPA List)
- [ ] Finding rows show CAPA status inline (`[CAPA In Progress]` / `[No CAPA]`)
- [ ] Source system tag on each finding ID (Bizzmine, Q100+)

---

## SCREEN 06 · CAPA List

- [ ] Remove "New CAPA" button from this page (single entry point = Findings)
- [ ] Add **Step** column to table showing current 8D step (D4 CA, D5 PA, etc.)
- [ ] Status filter tabs: All / In Progress / Overdue / Closed
- [ ] Export list button (top bar)

---

## SCREEN 07 ★ · New CAPA Intake — 4-Step Wizard

- [ ] Replace single-page intake form with a 4-step wizard
  - Step 1: Source Import (from EQMS system or manual)
  - Step 2: Gate Questions (3 textarea Q&A)
  - Step 3: Impact Assessment (Nova suggests severity)
  - Step 4: Review & Submit
- [ ] Stepper component with done/active/pending states
- [ ] Nova tip box at top of each step
- [ ] Step-level validation before "Continue" is enabled
- [ ] "Back" nav between steps without losing data

---

## SCREEN 08 ★ · CAPA Hub (Reworked Detail Page)

- [ ] Replace 4-tab layout (Overview / 8D Workflow / Audit Trail / Actions) with new layout:
  - **Left panel** (always visible): 8D progress tracker, CAPA Info, Quality Score
  - **Main area**: Source Data, QA Disposition, Nova Summary
- [ ] 8D progress panel: D1–D7 steps with done/active/locked states, clickable to navigate
- [ ] Quality Score shown as large number in left panel (click → score breakdown modal)
- [ ] "Continue Working on Dx →" CTA in bottom-right of main area
- [ ] Audit Trail accessible from top bar link, not a tab

---

## SCREEN 09 ★ · D1 Problem Statement (8D Step Pattern)

This screen defines the layout pattern for **all 8D steps (D1–D7)**:

- [ ] Three-zone layout: left progress panel + main form + Nova inline suggestion
- [ ] Nova suggestion block at **top of form** (not a sidebar)
  - "Use this suggestion" / "Edit first" / "Skip" actions
  - Collapsible "Show reasoning" section
- [ ] Validation checklist below form (contains date, measurable obs, affected area, min chars)
- [ ] "Save Draft" + "Continue to Dx →" buttons
- [ ] Apply this same shell pattern to D2, D3, D4, D5, D6 (only form fields change)

---

## SCREEN 10 · D3 Root Cause Analysis

- [ ] 5-Whys chain: 5 labeled inputs stacked with left border, Why 5 styled as root cause
- [ ] RCA Method dropdown (5-Whys, Fishbone, FMEA, Manual)
- [ ] "Confirmed Root Cause Summary" textarea
- [ ] **Similar Past CAPAs** section (Nova-powered): 2-column card list with similarity %

---

## SCREEN 11 · D4 Corrective Action

- [ ] Action card list (not a simple textarea)
- [ ] Each card: title, owner, target date, status badge, evidence status
- [ ] "+ Add Action" button
- [ ] Nova suggests a list of actions → "Add all" or "Pick individually"

---

## SCREEN 12 · D6 Verification

- [ ] Verification Method dropdown
- [ ] Verification Result textarea (min 30 chars validation)
- [ ] Evidence upload: filename input + Upload button + uploaded file display
- [ ] Completion checklist: Method selected / Result documented / Evidence uploaded

---

## SCREEN 13 · D7 Sign-Off

- [ ] Full 8D summary: one collapsible card per D-step (D1–D6) showing key text + checkmark
- [ ] Sign-off form: Reviewing QA, Role, Comments
- [ ] GMP/ALCOA+ compliance confirmation text above the button
- [ ] "Approve & Close CAPA" (primary) + "Return for Revision" (secondary) buttons
- [ ] Final Quality Score shown in left progress panel

---

## SCREEN 14 · Quality Score Breakdown

- [ ] Modal (or dedicated page) showing score per dimension
- [ ] Table: Dimension / Score / Max / Bar visualization
- [ ] "How to reach 90+" section with specific improvement suggestions linked to D-step
- [ ] "Go to Dx →" shortcut button from the modal

---

## SCREEN 15 · Audit Trail

- [ ] Accessible from top bar link (not buried in tab)
- [ ] Timestamped event table: Timestamp / Actor / Event type / Detail
- [ ] Export to PDF button
- [ ] Track: CAPA created, QA disposition, each D-step completed, AI suggestion used, sign-off

---

## SCREEN 16 · Nova AI — Unified Pattern

- [ ] Remove the 4 inconsistent Nova patterns (header branding, inline blocks, sidebar tips, chat button)
- [ ] Replace with **one inline Nova panel** at top of form area on each 8D step
  - "Use this" (primary) / "Edit first" / "Skip" (ghost)
  - Collapsible reasoning
- [ ] **Nova Chat** as slide-over (secondary, context-aware of current CAPA + step)
  - Triggered from Nova AI button in top bar
  - Shows current CAPA + step as context header
- [ ] Define exactly when Nova appears per screen (see wireframe section 16 table)

---

## CROSS-CUTTING

- [ ] **RBAC**: QA Analyst can edit 8D steps; QA Manager can approve/return at D7
- [ ] **Overdue indicators**: red/bold due dates, "Overdue Xd" label
- [ ] **Single entry point rule**: audit code to ensure "Create CAPA" only exists on Findings page
- [ ] **Breadcrumb**: top bar shows current path (e.g. `CAPAs / CAPA-2026-0341 / D4 Corrective Action`)
