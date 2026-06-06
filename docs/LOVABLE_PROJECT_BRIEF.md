# AI Coach Nova — Project Brief for a Fresh Prototype

> **Use this document as a build prompt for Lovable (or any web-design / UI tool).**
> It describes *what the product is, who uses it, and how it behaves* — the domain, the
> screens, the flows, the data, and the AI behavior. It intentionally says **nothing about
> visual design**. Bring your own design language: choose the colors, typography, spacing,
> layout system, iconography, and overall aesthetic. Do **not** try to match any existing
> look. The goal is a fresh visual perspective on the same product.

---

## 1. What you are building

**AI Coach Nova** is a web application for managing **CAPA** (Corrective and Preventive Action)
investigations in a **pharmaceutical quality** environment. It is aimed at a pharma
manufacturer's Quality Assurance (QA) organization.

The product's promise, in one line:

> **Nova turns quality findings into structured, audit-ready CAPA workflows — guiding the
> user at every step and keeping a complete, defensible audit trail.**

A "finding" is a quality problem that comes from one of three sources (a manufacturing
deviation, an audit observation, or a customer complaint). The app imports that finding,
then walks the user through a disciplined investigation: state the problem, contain it,
find the root cause, define corrective and preventive actions, verify they worked, and get
the whole thing signed off. The three sources share that investigation backbone but each
follows its **own approval shape** — a deviation's single severity-gated sign-off, an audit's
two-phase plan/actual lifecycle, and a complaint's two-round flow around a customer-response
loop (see §6). Throughout, an embedded AI assistant called **Nova** suggests content, scores
the quality of the work, cites similar historical cases, and logs every decision.

**Important framing:** this is a **deterministic demo prototype**, not production software.
There is no real backend, database, AI service, or external integration. All data is mock
JSON; all "AI" and "integration" actions are simulated with short, fake loading delays and
pre-written responses. Build it the same way — everything runs in the browser against
seeded mock data. (See §11 for the full prototype-behavior rules.)

The product name is **AI Coach Nova**. The AI assistant is always called **Nova**. All
user-facing text is **English-first**. (Indonesian personal names, departments, and company
context are fine, since the customer is Indonesian.)

---

## 2. Who uses it (personas & access model)

There are **five personas**. In the prototype there is no real authentication — instead a
**persona switcher** lets the user instantly "become" any of them to show how the experience
changes by role. Each approval chain is **three approvers deep**, but every CAPA type draws
those three from this same five-person roster — the *role label* each wears changes by workflow
(see the context-dependent note below), so no extra personas are needed to model the audit and
complaint governance.

| Persona ID | Name (example) | Role | Department | What they do |
|---|---|---|---|---|
| `initiator` | Andi Wijaya | Senior Operator (the **Auditee** on audits) | Fill-Finish | Reports findings and **fills in** the CAPA investigation (the 8D work) |
| `qa_deviation` | Siti Rahmawati | QA Deviation / QA Compliance / QA Complaint | Quality Assurance | Reviews, classifies (disposition / accept-gate), approves at the QA tier of every chain, and runs final QA closure |
| `head_of_dept` | Bambang Saputra | Department Head (the **QA Head of Department** on complaints) | Production / Fill-Finish | Opens every approval chain as the department-level gate |
| `head_of_qa` | Dewi Anggraini | Head of QA Division (the **QA Division / Head of Division** on audits & complaints) | QA Division | Senior approval — closes the chain |
| `sme` | Dr. Ahmad Pratomo | Subject-Matter Expert (Microbiology); the **Lead Auditor** on internal audits | QA / Microbiology | Co-approval, gated to **Major / Critical** deviations |

**Roles are context-dependent.** The *same person* can carry a different role label depending
on the CAPA type — the persona switcher still switches the human, but the label adapts to the
workflow. The key relabels:

- `qa_deviation` → *QA Deviation* on a deviation, *QA — GMP & DIRA Compliance* on an audit,
  *QA — Complaint Handling* on a complaint.
- `head_of_dept` → *Department Head* on a deviation/audit, *QA Head of Department* on a complaint.
- `head_of_qa` → *Division Head — QA* on a deviation, *QA Division Head* on an audit,
  *QA Head of Division* on a complaint.
- `initiator` → the *Auditee* when the finding came from an audit.
- `sme` → the *Lead Auditor* when reviewing an internal-audit finding up front.

**Access rules that shape the UI:**

- **Only the `initiator` (the finding's owner / Auditee) can edit/fill the 8D investigation.**
  Every other persona sees the same CAPA workspace **read-only** (they review and approve,
  they don't author).
- **`initiator` and `sme` are "My Work only" personas** — they do **not** get the analytics
  Dashboard; their landing page is the personal **My Work** task list. The QA/management
  approver personas (`qa_deviation`, `head_of_dept`, `head_of_qa`) get the Dashboard.
- Approvals follow **per-type approval cycles** that surface at specific 8D seams (see §5.9 and
  §6). The number of rounds, the stage names, and the role labels differ by CAPA type; on
  **deviations** the chain is additionally **gated by severity** — an SME co-approves
  Major / Critical cases.

---

## 3. Core domain concepts (glossary)

You don't need pharma expertise, but the UI should use these concepts consistently:

- **CAPA** — Corrective and Preventive Action. The investigation record. Each CAPA has an ID
  like `CAPA-2026-0341`.
- **Finding** — the originating quality problem, with an ID like `DEV-2026-0341`. A finding
  becomes a CAPA. Three **types**:
  - **Deviation** — a manufacturing/process excursion. Source system: **Bizzmine**.
  - **Audit Finding** — an observation from an internal/external audit. Source system: **Q100+**.
  - **Complaint** — a customer complaint about a product. Source system: **Bizzmine-Complaint**.
- **Source system / prefill** — when a finding is imported, its data is "pulled" from the
  source system and shown as a read-only **prefill** context (badge: "Imported from Bizzmine"
  etc.). This is simulated.
- **Severity** — `Minor`, `Major`, or `Critical`. On a **deviation** it gates the sign-off
  chain (an SME co-approves Major / Critical); the audit and complaint cycles run regardless of
  severity.
- **8D workflow** — the seven-step investigation backbone: **Problem → Containment → Root
  Cause Analysis → Corrective Action → Preventive Action → Verification → Sign-Off**.
- **Quality Score** — a live 0–100 score measuring how complete/defensible the CAPA is. Four
  sub-scores of 25 each: **Problem Specificity**, **Root Cause Depth**, **Action
  Effectiveness**, **Containment Strength**. A CAPA is **Audit Ready** at **≥ 80**. Sign-off
  is **blocked below 80**.
- **Impact Classification (Impact Score)** — Nova computes a recommended severity from
  weighted factors (e.g., area grade, product type, exposure, recurrence) and explains the
  rationale.
- **RCA methods** — three ways to do Root Cause Analysis: **5-Whys**, **Fishbone**
  (6 categories: Man / Machine / Material / Method / Measurement / Environment), and
  **Decision Tree**.
- **Knowledge-base citation / Similarity** — Nova references **similar historical CAPAs**
  (with a similarity %, the past root cause, the action taken, the year, and the outcome:
  Effective / Recurred / Ongoing). These appear as citation cards next to Nova's suggestions.
- **Disposition (deviations)** — QA's act of confirming a finding's classification and
  assigning the investigation, before any 8D work begins.
- **Accept gate (complaints)** — before any analysis, a QA staffer **accepts or rejects** the
  incoming complaint. A rejected complaint never becomes a full CAPA.
- **Audit schedule context (audits)** — audit CAPAs carry a scheduling header (audit **date
  range**, **auditor team**, **scope**, **auditee**) and run as **internal** or **external**.
  An internal audit adds a front-end **Lead Auditor** finding-review; an external audit adds a
  closing **report-back** to the auditing body.
- **Two-phase audit lifecycle (CAPA Plan → CAPA Actual)** — audit CAPAs are approved **twice**:
  first the **planned** actions, then the **executed** actions, each through the same approver
  cycle, before QA's final verification & closure. The workspace shows a **phase badge**
  (CAPA Plan / CAPA Actual).
- **Approval cycle / round** — a named, ordered chain of approvers attached to a specific point
  in the workflow. Any approver can **reject back** for revision (a reject-loop). Some
  workflows run **multiple rounds**.
- **Customer-response loop (complaints)** — after the Round-1 analysis is approved, a response
  is sent to the customer; the CAPA waits for the customer's **reply** or a **14-day timeout**
  before the Round-2 closure.
- **Closing-completeness check (audits)** — before QA's final verification, the system checks
  that all required closing documents/findings are present.
- **Audit Trail** — an immutable, English-first log of every meaningful action, organized
  into **four domains**: `System`, `AI Decision & Feedback`, `Integration`, and
  `Clear Labeling`. AI events carry a model name, model version, and confidence score.
- **Nova** — the embedded AI coach. It suggests content, scores quality, cites precedents,
  and coaches the user. Every Nova suggestion can be **Accepted, Edited, or Replaced** by the
  human, and that choice is logged.

---

## 4. Information architecture (screens)

All navigation is **URL-based** (deep-linkable, browser back/forward works). Primary nav:

| Route | Screen | Purpose |
|---|---|---|
| `/login` | **Login** | Simulated sign-in / entry to the app |
| `/` | **My Work** | Persona's personal task list (landing page) |
| `/dashboard` | **Dashboard** | Company-wide CAPA analytics (QA/management personas only) |
| `/findings` | **Findings List** | All findings from all sources |
| `/findings/:id` | **Finding Detail** | One finding + its source prefill + linked CAPA |
| `/capa` | **CAPA List** | All CAPAs with status & score |
| `/capa/new` | **CAPA Intake** | Create a new CAPA (pick type → import → classify) |
| `/capa/:id` | **CAPA Detail** | The main workspace / hub for one CAPA |
| `/capa/:id/8d/problem` | **D1 — Problem Statement** | 8D step 1 |
| `/capa/:id/8d/containment` | **D2 — Containment** | 8D step 2 |
| `/capa/:id/8d/rca` | **D3 — Root Cause Analysis** | 8D step 3 |
| `/capa/:id/8d/ca` | **D4 — Corrective Action** | 8D step 4 |
| `/capa/:id/8d/pa` | **D5 — Preventive Action** | 8D step 5 |
| `/capa/:id/8d/verification` | **D6 — Verification** | 8D step 6 |
| `/capa/:id/8d/signoff` | **D7 — Sign-Off** | 8D step 7 |
| `/actions/corrective` | **Corrective Actions** | Global list of all CAs |
| `/actions/preventive` | **Preventive Actions** | Global list of all PAs |
| `/actions/consolidated` | **Consolidated Action Plan** | All actions grouped/clustered across CAPAs |
| `/similarity` | **Similarity Explorer** | Search for similar historical findings/CAPAs |
| `/topics` | **Topics Grouping** | AI clustering of findings into themes |
| `/audit-trail` | **Audit Trail** | Global event log (4 domains) |
| `/notifications` | **Notification Center** | Per-persona notifications |
| `/settings/personas` | **Persona Management** | Manage/switch personas (demo-only RBAC view) |

**Slide-over panels** (overlays, not full pages):
- **Ask Nova** — a context-aware chat panel, openable from any 8D step.
- **Citation Detail** — opens when a similarity/knowledge-base citation is clicked; shows the
  full historical CAPA.

Invalid routes/IDs show a clean **not-found** state. Every screen must render safely even if
optional data is missing.

---

## 5. Screen-by-screen specification

Describe *content and interactions*, design is yours.

### 5.1 Login (`/login`)
A simulated sign-in entry point. On success, enter the app. (No real auth — any submission
"works." You may show the product name, a short value proposition, and the persona concept.)

### 5.2 My Work (`/`)
The personal landing page. Shows the active persona's relevant work: CAPAs assigned to them,
items awaiting their approval, items they initiated, overdue items, and recent activity.
Content is filtered by the active persona. This is the home for the `initiator` and `sme`
personas (who don't see the Dashboard). Each item links to the relevant CAPA.

### 5.3 Dashboard (`/dashboard`)
Company-wide analytics (QA/management personas only; if a "My Work only" persona navigates
here, redirect them to `/`). Contents:
- **Summary cards:** Total Findings (month-to-date), Open CAPAs, Overdue CAPAs, CAPA
  Effectiveness Rate — each with a change-vs-last-month indicator.
- **Charts:**
  - Finding trend over 12 months (line), split by type (Deviation / Audit / Complaint).
  - Breakdown by type (donut or stacked bar).
  - Top 5 root-cause categories (horizontal bar).
  - CAPA completion rate per department (heatmap-style).
  - Recurrence trend (line) — how often findings recur.
- **Recent findings table** (≈5 rows) linking to detail — includes the three "golden" demo
  findings.
- **Alert cards** for CAPAs overdue or approaching their deadline.

### 5.4 Findings List (`/findings`)
A filterable, searchable table of all findings. Columns: ID, Type, Short Description,
Severity, Department, Reported Date, CAPA Status, Action. Filters: Type, Severity, Status,
Department, Date. Per row: "View CAPA" (if one exists) or "Create CAPA." Status values
include: Pending CAPA, CAPA In Progress, CAPA Closed, Overdue, Rejected.

### 5.5 Finding Detail (`/findings/:id`)
Read-only view of one finding. Shows: a source-system badge ("Imported from Bizzmine /
Q100+ / Bizzmine-Complaint"), the full prefill context from that source, severity, a linked
CAPA card (if a CAPA exists), and a simple status timeline (created → assigned → CAPA started
→ closed). Primary action: **"Create CAPA with Nova"** (when no CAPA exists yet), which opens
intake pre-loaded with this finding.

### 5.6 CAPA List (`/capa`)
A filterable, searchable list of all CAPAs. Columns: CAPA ID, Finding ID, Type, Title,
Quality Score, Status, PIC (person in charge), Due Date, Action. Filters: Type, Status,
Department, Severity, Date. Status values: Draft, Disposition, Investigation, Approval,
Closed. The Quality Score is shown with a clear visual tier (below 60 / 60–79 / 80+), and
80+ carries an **"Audit Ready"** indicator. A table view is required; a Kanban/board toggle
is optional.

### 5.7 CAPA Intake (`/capa/new`)
The entry point to create a CAPA. Flow:
1. **Pick a type** — three choices: Deviation, Audit Finding, Complaint.
2. **Import source data** — a button like "Fetch from Bizzmine / Q100+." Show a simulated
   loading state ("Nova is importing source data from Bizzmine…"), then reveal the prefill
   context (read-only, badged with its source).
3. Nova generates: a **suggested CAPA title** (editable), an **initial severity** with an
   **impact rationale**, hints for the gate questions, and an **initial quality score**.
4. **Gate questions** — six framing questions the user answers (Observation, Scope, Impact,
   Containment, Cause Confirmation, Effectiveness Criteria). Each contributes to the score
   and may show an improvement hint.
5. A **live Quality Score sidebar** updates as the form is filled.
6. **Submit to QA** — blocked with a clear message if the score is too low; otherwise creates
   the CAPA and navigates to its detail page.

**Intake differs by type** (the gate that precedes the 8D work):
- **Deviation** → after submit, QA performs a **disposition** (confirm classification + assign
  the investigation).
- **Audit Finding** → intake captures the **audit schedule context** (date range, auditor team,
  scope, auditee) and whether the audit is **internal** or **external**. For an **internal**
  audit, a **Lead Auditor** reviews the finding before the CAPA work begins.
- **Complaint** → intake starts with a QA **accept / reject gate**; only an **accepted**
  complaint proceeds to analysis (a rejected one is recorded and closed, never becoming a CAPA).

### 5.8 CAPA Detail (`/capa/:id`) — the main workspace
The hub for one CAPA. Header shows: CAPA ID, Title, Type, Severity, Status, and the Quality
Score. Tabbed content:
- **Overview:** the imported source prefill, the QA disposition (if done), Nova's AI summary
  of the case, a **similar-cases** panel (historical CAPA citations), a status timeline, and
  a preview of the audit trail. Primary action: **"Start 8D Workflow."** For **audit** CAPAs
  the overview also shows a read-only **audit schedule** card (date range, auditor team, scope,
  auditee; internal / external).
- **8D Workflow:** a 7-step stepper (Problem → … → Sign-Off), the active step's content, a
  sticky Quality Score sidebar, and a **blocker banner** when the step can't yet advance. For
  **audit** CAPAs a **phase badge** (CAPA Plan / CAPA Actual) shows which of the two approval
  phases is in progress.
- **Audit Trail:** the chronological event log for *this* CAPA, filterable by event type.
- **Actions:** this CAPA's corrective and preventive actions, with add buttons.

For non-`initiator` personas this whole workspace is **read-only** (they can review and, where
applicable, approve — but not author).

### 5.9 The 8D step screens
Each step is its own route, shares the stepper + score sidebar, and has **blocker validation**
that prevents advancing until requirements are met. Nova assists on every step.

- **D1 — Problem Statement** (`…/problem`): a rich text editor for the problem statement.
  Nova gives inline tips ("+3 if you add a date/shift", "+3 if you name the equipment ID").
  The score's *Problem Specificity* sub-score updates live. **Blocker:** statement too vague
  (too short, or missing date / equipment / measurable observation).
- **D2 — Containment** (`…/containment`): an immediate containment action with a PIC
  (persona dropdown) and a due date. Nova suggests containment actions (Accept / Edit /
  Replace). Updates *Containment Strength*. **Blocker:** missing action, missing PIC, or a
  past due date.
- **D3 — Root Cause Analysis** (`…/rca`): a method picker — **5-Whys**, **Fishbone**, or
  **Decision Tree**.
  - *5-Whys:* an interactive 5-level chain; Nova suggests each "why," with similar-case
    citations beside each level; user Accepts/Edits/Replaces; user confirms the final root
    cause(s).
  - *Fishbone:* six categories (Man, Machine, Material, Method, Measurement, Environment);
    Nova suggests entries per category.
  - *Decision Tree:* a simple branching node editor.
  Updates *Root Cause Depth*. **Blocker:** no confirmed root cause (and method-specific
  minimums, e.g. ≥4 levels for 5-Whys, ≥3 categories for Fishbone).
- **D4 — Corrective Action** (`…/ca`): a list of corrective actions; each has a description,
  PIC, due date, **linked root cause**, and verification method. Nova suggests multiple CA
  options (Accept / Edit / Replace). Updates *Action Effectiveness*. **Blocker:** at least one
  CA must be linked to a confirmed root cause.
- **D5 — Preventive Action** (`…/pa`): a list of forward-looking preventive actions; each has
  a description, PIC, and target date. Nova suggests PA options. **Blocker:** at least one PA,
  and target dates must be in the future.
  - **First approval cycle (audit & complaint):** once the actions are defined, this seam is
    where the *first* approval cycle surfaces for two of the three types. On an **audit** the
    **CAPA Plan Approval** runs here over the *planned* actions (**Department Head → QA → QA
    Division Head**); on a **complaint** the **Round 1 — Analysis Approval** runs here (**QA
    Head of Department → QA Complaint → QA Head of Division**). Either cycle can be **rejected
    back** for revision. Deviations have no approval at this seam.
- **D6 — Verification** (`…/verification`): a verification method (e.g. re-sampling, process
  review, batch trend, environmental re-test, document review), a result text area, and a
  simulated evidence upload ("Mock evidence uploaded"). Nova can "coach me on verification
  methodology" (opens the Ask-Nova chat). **Blocker:** method, result, and evidence all
  required.
  - **Second approval cycle (audit):** on an **audit**, the **CAPA Actual Approval** runs at
    this seam over the *executed* actions (**Department Head → QA → QA Division Head**) — the
    second of the two audit phases, completing the CAPA Plan → CAPA Actual lifecycle.
- **D7 — Sign-Off** (`…/signoff`): the **closing cycle**. A **score gate** applies — at ≥80
  show an **"Audit Ready"** state, below 80 show a blocker. Each approver gets a simulated
  **e-signature** action (name + timestamp) with a simulated email-notification confirmation;
  approvals can be **Approve** or **Reject (with notes)**. On completion the CAPA status becomes
  **Closed**, and the audit trail records every approval. **The closing chain depends on the
  CAPA type:**
  - **Deviation** — a single classification-gated cascade: **Department Head → QA Deviation →
    Division Head (QA)**, with an **SME co-approval spliced in before the final approver** when
    the case is **Major / Critical**.
  - **Audit** — **QA Final Verification & Closure**: a **closing-completeness check** (all
    closing docs/findings present) → **QA** verification → close. An **external** audit adds a
    final **report-back** to the auditing body.
  - **Complaint** — **Round 2 — Closure Approval** (**QA Head of Department → QA Complaint → QA
    Head of Division**), run only after the **customer-response loop** (customer reply or
    14-day timeout) has resolved.

### 5.10 Corrective Actions (`/actions/corrective`) & Preventive Actions (`/actions/preventive`)
Global lists across all CAPAs. Filter by Status, PIC, Department, Due Date. Columns include
the action description, the owning CAPA (linked), PIC, due date, status (Open / In Progress /
Completed / Overdue / Verified), and effectiveness. The PA list additionally flags actions
that **recurred** (a preventive action that failed to prevent recurrence).

### 5.11 Consolidated Action Plan (`/actions/consolidated`)
Combines every corrective + preventive action from across CAPAs into one view, **grouped** by
root-cause cluster, department, or risk priority. An "AI clustering" button shows a simulated
grouping. Each group shows its actions, a progress indicator, and a PIC. Includes a simulated
"Export to Excel."

### 5.12 Similarity Explorer (`/similarity`)
A search experience: the user types a finding description and runs an "AI Search" (simulated
delay), getting back **similar historical CAPAs** as result cards (similarity %, root cause,
year, outcome: Effective / Recurred). Filters: minimum similarity %, outcome, type, year.
Clicking a result opens the full historical CAPA detail.

### 5.13 Topics Grouping (`/topics`)
An "Analyze Topics" button runs simulated AI clustering and returns **topic clusters** (e.g.
"HEPA Filter Maintenance", "Gowning SOP Compliance", "Documentation", "Cold Chain"). Each
cluster card shows: name, number of findings, trend (up/down/stable), severity distribution,
and a risk level. Expanding a cluster lists its related findings.

### 5.14 Audit Trail (`/audit-trail`)
A global, read-only, chronological event log. Filters: **domain** (System / AI Decision &
Feedback / Integration / Clear Labeling), CAPA/Finding ID, date, and actor. Columns:
timestamp, actor (name + role), action (human-readable English), CAPA/Finding ID, and
before/after values for field changes. AI-decision events additionally show the model
version and confidence score. Includes simulated CSV/PDF export.

### 5.15 Notification Center (`/notifications`)
A per-persona notification list (icon, title, message, time, read/unread). Filters: All /
Unread / CAPA Updates / Approvals / Overdue. Notification types: CAPA needs approval, due
date approaching, CAPA rejected, CAPA closed, action assigned, overdue. Supports mark-as-read
and mark-all-as-read. Each notification links to its CAPA. A settings sub-panel toggles
notification channels (in-app / email / dashboard) — simulated.

### 5.16 Persona Management (`/settings/personas`)
A demo-only RBAC view: list the five personas with their roles/departments and let the user
switch the active persona. (Also available as a quick switcher in the top bar.)

---

## 6. The end-to-end workflow (how it all connects)

All three finding types share the **same 8D investigation spine** and the **same two
continuous mechanics** (live Quality Score + audit trail). What differs is the **intake gate**
and the **approval cycles** layered on top of that spine. Think of it as **one backbone with a
per-type approval layer** — not three separate pipelines, and not one identical pipeline.

**The shared backbone:**

```
Finding (imported from source system)
   → CAPA Intake  (type-specific gate — see below)
   → 8D Investigation:
        D1 Problem → D2 Containment → D3 RCA → D4 Corrective → D5 Preventive → D6 Verification → D7 Sign-Off
   → CAPA Closed / Audit Ready
```

The three types diverge in their gate and their approval cycles:

**① Deviation** *(source: Bizzmine)* — one classification-gated sign-off round.

```
Intake → QA Disposition (classify + assign)
   → 8D D1–D6
   → D7 Sign-Off:  Department Head → QA Deviation → [SME, only if Major/Critical] → Division Head (QA)
   → Closed
```

A single approval round at sign-off; the SME approver is **spliced in before the final
approver** only when severity is Major or Critical.

**② Audit** *(source: Q100+)* — a **two-phase** CAPA Plan → CAPA Actual lifecycle.

```
Schedule (date range, auditor team, scope, auditee; internal vs external)
   → [internal only: Lead Auditor reviews the finding]
   → Intake
   → 8D D1–D5 (Preventive)
   → CAPA PLAN approval   (Department Head → QA → QA Division Head)   ← over the PLANNED actions
   → execute actions → D6 Verification
   → CAPA ACTUAL approval (Department Head → QA → QA Division Head)   ← over the EXECUTED actions
   → D7:  closing-completeness check → QA final verification → close
   → [external only: report back to the auditing body]
   → Closed
```

Two identical approver cycles **bracket execution** (plan, then actual), each able to reject
back for revision; QA performs the final verification and closure.

**③ Complaint** *(source: Bizzmine-Complaint)* — **two approval rounds** around a customer loop.

```
QA accept/reject gate   (reject → recorded & closed, never becomes a CAPA)
   → Intake
   → 8D D1–D5 (Preventive)
   → ROUND 1 — Analysis approval  (QA Head of Dept → QA Complaint → QA Head of Division)
   → send response to customer → wait for reply OR 14-day timeout    ← customer-response loop
   → consolidate → D6 Verification
   → ROUND 2 — Closure approval   (QA Head of Dept → QA Complaint → QA Head of Division)
   → Closed
```

Two approval rounds (analysis, then closure) **sandwich a customer-response loop** that
resolves on the customer's reply or a 14-day timeout.

Two mechanics run *continuously* across every workflow and should feel central:

1. **The live Quality Score** (0–100, four sub-scores). It updates as the user adds
   specificity (dates, areas, equipment IDs, batch/lot numbers, measurable observations,
   confirmed root causes, root-cause-linked corrective actions, preventive actions,
   verification evidence). It visibly gates progress — **sign-off is impossible below 80**,
   and crossing 80 is a moment of "Audit Ready" success.
2. **The audit trail** captures every meaningful action (source imported, Nova classification
   generated, suggestion accepted/edited/replaced, statements updated, root cause confirmed,
   actions added, verification completed, e-signatures, approvals, closure).

Each 8D step has a **blocker** (see §5.9) so the user can't skip the discipline.

---

## 7. Nova — the AI coach behavior

Nova is the product's signature. It must feel **professional, concise, audit-aware, and
structured** — never magical, verbose, casual, or salesy.

- **Where Nova appears:** intake (title/severity/impact/score), every 8D step (suggestions +
  inline tips), the Similarity Explorer, Topics, Consolidated Plan, and a global **Ask Nova**
  chat panel that is context-aware per step.
- **Nova's response shape** (use consistently, especially in chat and rationales):
  ```
  Observation:
  …
  Recommendation:
  …
  Audit Rationale:
  …
  ```
- **Human-in-the-loop is mandatory.** Every Nova suggestion offers **Accept / Edit / Replace**.
  The human is always in control; Nova proposes, the human disposes. The chosen action is
  written to the audit trail.
- **Grounding via citations.** Where relevant (especially RCA and suggestions), Nova shows
  **similar historical CAPA citations** (similarity %, past root cause, action, year, outcome)
  so its advice looks evidence-based. Clicking a citation opens the full historical case.
- **AI transparency.** Nova's audit-trail events carry a model name (e.g. "Nova Mock Engine"),
  a model version (e.g. "nova-demo-v1"), a **confidence score**, and a timestamp. Surface
  confidence in the UI where Nova makes a classification (e.g. "Major severity, 86%
  confidence").

---

## 8. The three golden scenarios (use this concrete content)

Seed the prototype with **three complete, end-to-end demo cases**, one per type, all at
**Major** severity. (On a deviation, Major also exercises the **SME co-approval** gate; the
audit and complaint cases instead run their own **multi-round** cycles, which are independent
of severity.) These give you realistic content to render everywhere (dashboard, lists, detail,
8D, audit trail).

### Case 1 — Deviation (the showcase case, build this most fully)
- **Finding:** `DEV-2026-0341` → **CAPA:** `CAPA-2026-0341`. Source: **Bizzmine**. RCA: **5-Whys**.
- **Scenario:** Environmental-monitoring excursion in a Grade A/B fill suite — elevated
  particle count detected during a vaccine filling operation.
- **Problem statement (target):** "On 8 June 2026 during vaccine filling in Grade A Fill Suite
  Line FILL-02, environmental monitoring detected a particle-count excursion for batch
  VAX-2406-A17. The excursion lasted ~8 minutes and was associated with HEPA unit HEPA-FILL-02."
- **Containment:** Pause filling, quarantine batch VAX-2406-A17, perform additional
  environmental monitoring, notify QA Deviation before disposition.
- **5-Whys → Root cause:** Preventive-maintenance SOP `PM-HEPA-001` used an outdated 18-month
  HEPA replacement interval for Grade A areas (revised guidance requires 12 months).
- **Corrective action:** Replace HEPA-FILL-02, requalify the suite airflow, QA-review the
  affected batch before any release decision.
- **Preventive action:** Revise `PM-HEPA-001` to a 12-month interval for Grade A areas; add
  automated reminders 60 days before the next replacement.
- **Verification:** Post-replacement monitoring within limits for three consecutive checks;
  airflow requalification passed.
- **Sign-off (single round, severity-gated):** Bambang Saputra (Department Head) → Siti
  Rahmawati (QA Deviation) → **Dr. Ahmad Pratomo (SME — spliced in because the case is Major)**
  → Dewi Anggraini (Division Head, QA). Final state: **Closed / Audit Ready**.

### Case 2 — Audit Finding (build the two-phase lifecycle)
- **Finding:** `AUD-2026-0089` → **CAPA:** `CAPA-2026-0089`. Source: **Q100+**. RCA: **Fishbone**.
- **Scenario:** **Internal** GMP audit finds incomplete second-person verification on cleaning /
  material-transfer logbook records.
- **Audit schedule context:** internal audit, **date range** 18–20 May 2026, **auditor team**
  led by Dr. Ahmad Pratomo (Lead Auditor) plus two QA auditors, **scope** "Documentation
  practices — Fill-Finish & Warehouse", **auditee** the Fill-Finish department (contact:
  Bambang Saputra).
- **Lead-auditor review (internal):** before CAPA work begins, the Lead Auditor reviews and
  confirms the finding.
- **Root cause:** The documentation SOP doesn't define ownership for second-person
  verification at shift handover.
- **Corrective action:** Correct affected records, run a data-integrity assessment, retrain
  the involved operators/supervisors.
- **Preventive action:** Revise the documentation SOP, add an end-of-shift verification
  checklist, run weekly QA spot-checks for three months.
- **Two-phase approval lifecycle:**
  - **CAPA Plan approval** (over the *planned* actions): Bambang Saputra (Department Head) →
    Siti Rahmawati (QA — GMP & DIRA Compliance) → Dewi Anggraini (QA Division Head).
  - **execute the actions**, then **CAPA Actual approval** (over the *executed* actions): the
    same chain — Department Head → QA → QA Division Head.
  - **QA Final Verification & Closure:** a **closing-completeness check** (all closing
    documents present) → Siti Rahmawati (QA) verifies → closes. (Were this an **external**
    audit, a final **report-back** to the auditing body would follow.)
- **Final state:** **Closed / Audit Ready**.

### Case 3 — Complaint (build the two-round + customer-loop flow)
- **Finding:** `CMP-2026-0112` → **CAPA:** `CAPA-2026-0112`. Source: **Bizzmine-Complaint**.
  RCA: **Decision Tree**.
- **Scenario:** A **hospital** customer reports visible particulate in one returned vial.
- **Accept gate:** Siti Rahmawati (QA Staff) reviews the incoming complaint and **accepts** it
  (a rejected complaint would be recorded and closed without becoming a CAPA).
- **Root cause:** A visual-inspection rejection trend wasn't escalated after repeated
  borderline observations in the same lot family.
- **Corrective action:** Quarantine and investigate the affected lot family; re-inspect
  retained samples; issue a customer holding response.
- **Preventive action:** Add an escalation rule when borderline visual-inspection rejects
  trend upward within a lot family; add a monthly trend review.
- **Two-round approval with a customer loop:**
  - **Round 1 — Analysis approval:** Bambang Saputra (QA Head of Department) → Siti Rahmawati
    (QA — Complaint Handling) → Dewi Anggraini (QA Head of Division).
  - **Customer-response loop:** a response is sent to the hospital; the CAPA waits for the
    customer's **reply** (or a **14-day timeout**) before proceeding.
  - **Round 2 — Closure approval:** the same chain — QA Head of Department → QA Complaint → QA
    Head of Division.
- **Final state:** **Closed / Audit Ready**.

**Also seed additional CAPAs in mixed statuses** (closed, awaiting approval, in disposition,
recurred, overdue) so the Dashboard and lists look realistic — e.g. a closed-effective
deviation, an audit awaiting Head-of-QA sign-off, a recently disposed complaint, a recurred
deviation (good for the Similarity demo), and an overdue deviation. A few **Critical** cases
may exist in the data for realism, even though the primary walkthroughs are Major.

---

## 9. Data model (entities to back the UI)

You don't need to copy field names exactly, but the UI implies these entities:

- **Persona** — id, display name, role, department, employee number, initials.
- **Finding** — id, type, source system, short description, severity, department, reported
  date, status, linked CAPA id, prefill context.
- **PreFill context** — differs by type:
  - *Deviation (Bizzmine):* deviation id, reported/occurred timestamps, location
    (department/area/line/equipment id), initiator, initial observation, affected batches,
    attachments, SOP references, initial severity.
  - *Audit (Q100+):* finding id, audit id, audit type (internal/external), audit date,
    auditor (name/org), auditee (department/contact), finding category, description,
    regulation references, severity, SOP references.
  - *Complaint (Bizzmine-Complaint):* complaint id, customer (name/type), product
    (name/lot/expiry), complaint type, description, severity, attachments.
- **CAPA case** — id, type, title, prefill, gate answers, quality score (4 sub-scores +
  total + isAuditReady), impact classification, disposition, the 8D data (problem,
  containment, RCA, corrective[], preventive[], verification, sign-off[]), audit events[],
  status, current step, timestamps, created-by, assigned-to, department.
- **Quality Score** — problemSpecificity, rootCauseDepth, effectiveness, containment (each
  0–25), total (0–100), isAuditReady (total ≥ 80).
- **Impact Classification** — recommended severity, total weight, weighted factors (factor /
  value / weight / rationale), Nova's rationale text, computed timestamp.
- **RCA data** — method, plus one of: five-whys nodes (level, question, Nova suggestion, Nova
  citations, user answer, status), fishbone categories (the six categories with Nova/user
  entries), or a decision tree (nodes + root). Plus confirmed root causes[].
- **Corrective / Preventive Action** — id, CAPA id, description, PIC, due/target date, linked
  root cause (CA only), verification method (CA only), status, completed timestamp, whether
  Nova-generated, and the Nova-suggestion status.
- **Nova suggestion** — id, context (e.g. "D3-5whys-level-2"), content, citations, status
  (pending/accepted/edited/replaced), optional user-edited content.
- **Knowledge-base citation** — historical deviation id + CAPA id, similarity score, root
  cause, corrective action, year, outcome (Effective/Recurred/Ongoing), source type.
- **Audit event** — id, timestamp, **domain** (system / ai_decision / integration /
  clear_labeling), actor (persona/name/number), CAPA/Finding id, action text, optional
  field + before/after, and (for AI events) model version + confidence.
- **Notification** — id, recipient persona, type, title, message, CAPA id, read flag, created
  timestamp.
- **Topic cluster** — id, name, finding count, severity distribution, trend, risk level,
  related finding ids, top root causes.
- **Dashboard analytics** — summary stats with month-over-month deltas, 12-month trend points
  (by type), department completion entries, root-cause trend entries.

---

## 10. Behavior rules that define "feel"

- **English-first UI.** Every label, button, column, toast, empty state, blocker, Nova
  response, audit entry, and notification is in English. Indonesian only for names,
  departments, and local regulatory context.
- **No dead ends.** Every primary button either performs an action or shows a clear simulated
  toast (e.g. "Mock email notification sent.", "Export will be available in the production
  version.", "Mock evidence uploaded."). No button does nothing.
- **Clear states everywhere.** Each ID-based page handles loading, found, not-found, empty,
  and validation-blocked states without crashing.
- **Blockers are actionable.** When a step is blocked, say exactly what's missing and how to
  fix it.
- **Progress persists.** Workflow progress, accepted/edited Nova suggestions, actions,
  verification, approvals, statuses, audit events, and notification read-state all survive a
  page refresh (persist to local storage). Include a **"Reset Demo Data"** action that
  confirms, clears state, reloads the seeded data, and toasts success.

---

## 11. Prototype scope — build it as a simulation

This is a **deterministic demo**, not production. Build accordingly:

- **No backend, no database, no real APIs.** All data comes from seeded mock data in the app.
- **No real AI.** Every "Nova" action returns **pre-written content** after a short fake delay
  (≈1.5–3s loading state). Make the loading states feel real ("Nova is analyzing…").
- **No real integrations.** Imports from Bizzmine / Q100+ / Complaint are simulated prefills.
- **No real auth / SSO, e-signature, file upload, email, or notification service** — all
  simulated with toasts and mock confirmations.
- **Deterministic.** The three golden scenarios should play out the same way every time so a
  live demo never surprises the presenter.
- Target a **desktop** screen experience (a laptop/monitor demo); mobile responsiveness is not
  required.

### Out of scope (do not build)
Real source-system integrations, real ML/LLM inference, real OCR, real authentication/SSO,
real e-signature certificate authority, configuration/data-mapping admin, backup/restore, and
any production infrastructure. These may be *named* in the UI as simulated/coming-in-production,
but are not implemented.

---

## 12. Reminder on design freedom

This brief deliberately omits any color palette, typography, spacing system, component
library, layout dimensions, or animation spec. **Those choices are yours.** Design a clean,
credible interface for a pharmaceutical QA audience however you see fit — the only constraints
are the *product behavior, content, and domain logic* described above. Bring a fresh visual
perspective.
