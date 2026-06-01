# Design Depth Audit — Token Layering & Elevation

> **Purpose:** This file documents *why the UI feels flat* (everything reads at the
> same z-index, especially in light mode) and *exactly what to change*. It is an
> audit only — no code was modified. Another agent should execute the fixes.
>
> **Core complaint:** Cards, sidebar, top bar, and page background all read as the
> same plane. The token scale (`--bg-0..4`, `--shadow-*`, `--line-*`) already
> encodes depth, but the components don't use it. Light mode is the acute case.

---

## 0. TL;DR — the three root causes

| # | Root cause | One-line fix |
|---|------------|--------------|
| **R1** | **Elevation shadows are essentially unused.** 55 `boxShadow` usages exist, but **only 1** is a design-system elevation token (`--shadow-lg`, in `DashboardPage`). The other 54 are focus glows / scrims. | Every raised surface (card, popover, slide-over, top bar) must carry `--shadow-sm` (resting) or `--shadow-md` (raised/hover). |
| **R2** | **The sidebar uses the same layer as the page.** `Sidebar.tsx` root = `--bg-1`; `PageWrapper` page = `--bg-1`. Identical color → no separation, in *both* themes. | Sidebar → `--bg-0` (the token literally means "sidebar trough / page void"). |
| **R3** | **In light mode, color delta alone can't carry elevation, and the scale is non-monotonic.** `--bg-1` (#F1F4FA) → `--bg-2` (#FFFFFF) is a ~3% lightness step; borders are 6–10% alpha. With no shadow, a white card on a near-white page disappears. Meanwhile `--bg-3`/`--bg-4` are *darker* than `--bg-2`, so naive stacking inverts. | Light mode depth = **white surface + shadow**, not "lighter color". Shadows are mandatory, not optional. |

**Why dark mode looks less broken:** in dark mode the scale is monotonic
(`bg-0` #060709 darkest → `bg-4` #1D222A lightest), so `bg-1→bg-2` is a visible
step and cards read even without shadows. The same components in light mode
collapse. Fixing for light mode (shadows + correct layer assignment) also
improves dark mode.

---

## 1. Reference — the intended depth ladder

This is what each token is *for*. Executor should treat this as the contract.

| Token | Dark | Light | Intended role |
|-------|------|-------|---------------|
| `--bg-0` | `#060709` | `#E8EDF5` | **Deepest.** Sidebar trough, page void, behind-everything frame. |
| `--bg-1` | `#0A0C0F` | `#F1F4FA` | **Base page background** (the `<main>` canvas). |
| `--bg-2` | `#101318` | `#FFFFFF` | **Card / primary surface.** Pops off bg-1 (in light, via white + shadow). |
| `--bg-3` | `#161A20` | `#EAEEF6` | **Recessed/inset field, popover, hover panel.** In light this is *darker* than a white card → reads as a well, not a raise. |
| `--bg-4` | `#1D222A` | `#E2E7F2` | **Input fill / deep interactive hover.** |

Light-mode lightness order (high→low): `bg-2` (white) > `bg-1` > `bg-3` > `bg-0` > `bg-4`.
**Implication:** "elevation" in light mode is *not* a color step — it's `bg-2` white +
shadow lifting off the `bg-1` page. `bg-3`/`bg-4` are intentionally *recessed* tints.

Elevation shadow tokens (already defined, both themes — see `index.css`):
- `--shadow-sm` — resting cards.
- `--shadow-md` — raised cards, hover state, dropdowns.
- `--shadow-lg` — modals, slide-overs, floating panels.
- `--shadow-glow` / `--shadow-grad-glow` — accent emphasis only.

---

## 2. Evidence (measured across `src/pages` + `src/components`)

- `boxShadow` occurrences: **55** total. Elevation-token usages: **1**
  (`var(--shadow-lg)` in `DashboardPage`). Everything else is
  `0 0 0 3px var(--accent-soft)` focus glows or `0 0 0 9999px var(--glass-dark)` scrims.
- Files that use **any** `--shadow-*` elevation token: **1** (`DashboardPage.tsx`).
- `--bg-2` (card surface) usages: **43** across **16** files — none of which pair it with an elevation shadow.
- `--bg-0` (deepest frame) usages across all pages/components: **1** (LoginPage). The framing layer is effectively unused.
- Border weights: `--line-1` ×68, `--line-2` ×161, `--line-3` ×12. Borders are
  currently doing 100% of the elevation work; in light mode `--line-1` (6% alpha)
  is too faint to define a card edge on its own.

---

## 3. Structural shell findings

### S1 — Sidebar shares the page layer  *(P0)*
- **File:** `src/components/layout/Sidebar.tsx:132` — `background: "var(--bg-1)"`.
- **Problem:** `PageWrapper` (`src/components/layout/PageWrapper.tsx:12`) sets the
  page to `--bg-1` too. Sidebar and content canvas are the *same* color → the rail
  has no presence. `borderRight` is `--line-1` (6%), far too faint to compensate.
- **Fix:** Sidebar background → `--bg-0`. Bump `borderRight` to `--line-2`. In light
  mode this seats the rail in a subtle trough; in dark mode it deepens it.

### S2 — Top bar barely separates from content  *(P1)*
- **File:** `src/components/layout/TopBar.tsx:71` — `background: var(--glass-dark)` +
  `borderBottom: 1px solid var(--line-1)`.
- **Problem:** In light mode `--glass-dark` = `rgba(255,255,255,0.82)` over a
  near-white page, divided by a 6% border → the bar dissolves into the canvas when
  content scrolls under it.
- **Fix:** Add a downward elevation shadow (`--shadow-sm`, or a custom
  `0 1px 0 var(--line-2)` hairline + soft blur) so the sticky bar floats above
  scrolling content. Consider strengthening the border to `--line-2`.

### S3 — `<main>` canvas is correct, keep it
- `PageWrapper.tsx:12` page = `--bg-1` is right. Do **not** change the page; fix the
  things sitting *on* it (sidebar → bg-0, cards → bg-2 + shadow).

---

## 4. Surface-level findings (apply to every page)

### C1 — Cards have no elevation shadow  *(P0, systemic)*
- **Pattern in use everywhere:** `background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r-lg);` with **no `boxShadow`**.
- **Where:** all 16 card files (see table in §5). Worst offenders by card density:
  `SimilarityExplorerPage` (6), `CapaDetailPage` (5), `ConsolidatedActionPlanPage` (4),
  `DashboardPage`/`D7SignOffPage`/`MyWorkPage`/`FindingDetailPage`/`AuditTrailPage` (3 each).
- **Fix:** Add `boxShadow: var(--shadow-sm)` to the standard card. For interactive
  cards (rows, clickable tiles), raise to `var(--shadow-md)` on hover. This single
  change is the biggest depth win.

### C2 — Recessed vs raised confusion in nested surfaces  *(P1, verify per page)*
- In light mode `--bg-3` (#EAEEF6) and `--bg-4` (#E2E7F2) are **darker** than the
  white `--bg-2` card. That's correct *only* when the inner element is meant to be a
  **recessed field** (input, well, table-header). It is **wrong** when `--bg-3` is
  used for something meant to read as *raised* (a callout/badge sitting on top).
- **Action:** On each page, confirm every `--bg-3`/`--bg-4` block is semantically a
  *well/input*, not a *raised callout*. Raised callouts on a white card should stay
  `--bg-2` and lean on a border/accent line or a `--shadow-sm`, not a darker fill.

### C3 — Borders are over-relied on for separation  *(P1)*
- `--line-1` (6–7% alpha) is used 68× as the sole separator. On a white card edge in
  light mode it's nearly invisible.
- **Fix:** Where `--line-1` defines a *surface edge* (card border, sidebar edge,
  topbar divider), upgrade to `--line-2` and/or pair with a shadow. Keep `--line-1`
  only for *internal* hairlines (list-row dividers inside a card).

### C4 — Hover states don't lift  *(P2)*
- Interactive rows/cards change `background` on hover (e.g. FindingsListPage rows
  → `--bg-3`) but never change shadow. A hover that only darkens reads as "pressed",
  not "raised".
- **Fix:** On hover for clickable cards, transition `box-shadow` from `--shadow-sm`
  → `--shadow-md` (and optionally a 1px translateY) so it lifts.

---

## 5. Per-page checklist

Each card-bearing page needs the same treatment: **add `--shadow-sm` to bg-2 cards,
verify bg-3/bg-4 are recessed-only, upgrade surface-edge `--line-1`→`--line-2`.**

| Page / file | bg-2 cards | Shadow today | Specific notes |
|-------------|-----------:|:------------:|----------------|
| `nova/SimilarityExplorerPage.tsx` | 6 | 0 | Highest card density — most to gain. Comparison cards must lift to read as separate objects. |
| `nova/CapaDetailPage.tsx` | 5 | 0 | Hub + inline 8D panels; the embedded panels currently merge with the hub card. |
| `nova/ConsolidatedActionPlanPage.tsx` | 4 | 0 | Action tables/cards flatten together. |
| `nova/DashboardPage.tsx` | 3 | 1 | Only page using a shadow token; use it as the reference for the rest. Stat cards still need `--shadow-sm`. |
| `nova/eight-d/D7SignOffPage.tsx` | 3 | 0 | Final quality-gate card + approval chain; gate card should be the most elevated element. |
| `nova/MyWorkPage.tsx` | 3 | 0 | Inbox/queue cards. |
| `nova/FindingDetailPage.tsx` | 3 | 0 | Stat strip + section cards + Nova block; section cards need shadow, Nova block (accent border) is fine. |
| `nova/AuditTrailPage.tsx` | 3 | 0 | Timeline/table surface. |
| `nova/eight-d/D5PreventiveActionPage.tsx` | 2 | 0 | Form card + action list. |
| `nova/eight-d/D4CorrectiveActionPage.tsx` | 2 | 0 | Form card + action list. |
| `nova/FindingsListPage.tsx` | 2 | 0 | Table container + slide-over. Slide-over should use `--shadow-lg`; rows lift on hover (C4). |
| `nova/CapaListPage.tsx` | 2 | 0 | List/table container. |
| `LoginPage.tsx` | 2 | 0 | Login card should clearly float over `--bg-0` page — give it `--shadow-lg`. |
| `nova/eight-d/D6VerificationPage.tsx` | 1 | 0 | Form card. |
| `nova/eight-d/D2ContainmentPage.tsx` | 1 | 0 | Form card. |
| `nova/CapaIntakePage.tsx` | 1 | 0 | Intake form card. |
| `nova/eight-d/D1ProblemPage.tsx` / `D3RCAPage.tsx` | — | 0 | Use EightDShell; cards inside need the same shadow pass. |
| `components/nova/NovaBlock.tsx`, `NovaSuggestionBlock.tsx` | — | glow only | Accent suggestion blocks; keep accent line, but they should still sit on a shadowed surface. |

---

## 6. Recommended approach for the executor

To avoid editing 16 files by hand and drifting, prefer **codifying the depth model
once**:

1. **Add reusable elevation utility classes** in `index.css` (e.g. `.surface-card`,
   `.surface-raised`, `.surface-overlay`) that bundle
   `background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r-lg); box-shadow: var(--shadow-sm);`
   and a `.surface-card:hover { box-shadow: var(--shadow-md); }` variant. Then point
   pages at the class instead of repeating inline styles.
2. **Fix the shell first** (S1 sidebar→bg-0, S2 topbar shadow) — biggest perceived
   change for two edits.
3. **Sweep cards** page-by-page using §5, applying the utility class / `--shadow-sm`.
4. **Light-mode pass:** with shadows in, re-check every `--bg-3`/`--bg-4` block (C2)
   to confirm it's a recessed field, not an inverted "raise".
5. **Verify in both themes** — toggle dark/light on Dashboard, CapaDetail,
   FindingsList, and a form 8D page. Depth should now be obvious without changing any
   token *values* (the values are fine; only their *application* was wrong).

**Do not** change the token definitions in §1 — they're well-designed. The whole fix
is about *applying* them: shadows where elevation is meant, `bg-0` for the sidebar,
and trusting white+shadow (not color) for elevation in light mode.

---

## 7. Priority summary

- **P0 (do first):** R1/C1 add elevation shadows to all cards · R2/S1 sidebar → `--bg-0`.
- **P1:** S2 topbar shadow · C2 recessed-vs-raised audit · C3 surface-edge borders `--line-1`→`--line-2`.
- **P2:** C4 hover lift · LoginPage `--shadow-lg` · convert to shared `.surface-*` utility classes.
