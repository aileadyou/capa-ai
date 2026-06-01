# UI/UX Audit — All Views

> **Audit only — no code changed.** Findings for other agents to execute.
> Scope = the **live** app: `src/pages/nova/*`, `src/pages/LoginPage.tsx`,
> `src/pages/NotFound.tsx`, `src/components/{layout,nova,shared}`, `src/App.tsx`.
> Checked against the Vercel Web Interface Guidelines + visual/UX quality.
>
> Depth/elevation has its own deep-dive: **`docs/DESIGN_DEPTH_AUDIT.md`**.
> This file is the master; depth is summarized in §2 and not repeated in full.
>
> Severity: **P0** = broken/blocking · **P1** = clearly subpar · **P2** = polish.

---

## 0. Headline issues (read this first)

1. **~10k lines of dead code shipping in the bundle** — 19 legacy top-level pages + ~26 legacy root components, none imported. Confuses the codebase and inflates the 765 kB bundle. (§1)
2. **The UI reads flat** — elevation shadows essentially unused (1 of 55 `boxShadow`s is an elevation token); sidebar shares the page's layer. Acute in light mode. (§2 → depth doc)
3. **Custom buttons & clickable rows have no visible focus, and modals aren't announced to AT** — keyboard + screen-reader users are locked out of core flows. (§3)
4. **Heavy copy/paste styling, no shared primitives** — every page re-declares its own card, badge, select, and button inline. Inconsistency is structural, not incidental. (§9)

---

## 1. Architecture hygiene / dead code  *(P1, high-leverage)*

**19 legacy pages, zero imports** (confirmed not referenced by `router.tsx` or anything else):
`Auth, CapaActions, CapaDashboard, CapaDetail, AuditTrail, Deviations, Investigation,
Profile, QualityDashboard, Reports, DataCollection, DataManagement, SelectiveCleaning,
StandardCleaning, FAQ, Glossary, Filtering, GroupingSorting, Index` (all in `src/pages/*.tsx`).

**~26 legacy root components** (old data-pipeline/cleaning app), none used by the live tree:
`AIDataCard, BottomNavigation, Breadcrumbs, CsvPreview, CustomSplitInput, DataQualityReport,
DataSourceCard, DatasetList, EnterpriseLayout, GlossaryTerm, LoadingScreen, NavLink,
ParticleBackground, PipelineCompletionCelebration, ProtectedRoute, Sidebar, SimilarityChart,
SplitOption, StepIndicator, SuccessOverlay, SystemLogToast, ThemeToggle, TutorialButton,
TutorialOverlay, UploadZone, WelcomeModal`.

- **Duplicate `Sidebar`:** `src/components/Sidebar.tsx` (legacy) vs `src/components/layout/Sidebar.tsx` (live). Delete the legacy one to avoid confusion.
- **Action:** delete the legacy pages + components (or move to an `_archive/` folder excluded from build). Verify nothing in `src/components/ui/*` or routes references them first.

---

## 2. Visual depth & hierarchy  *(P0 — see `docs/DESIGN_DEPTH_AUDIT.md`)*

Summary of the three root causes (full detail + per-page table in the depth doc):
- **R1:** elevation shadow tokens (`--shadow-sm/md/lg`) are unused — only 1 occurrence app-wide. Every `--bg-2` card has a border but no shadow → flat. **Fix:** add `--shadow-sm` to cards, `--shadow-md` on hover.
- **R2:** `Sidebar.tsx:132` uses `--bg-1`, identical to the page background. **Fix:** sidebar → `--bg-0`.
- **R3:** in light mode the bg scale is non-monotonic; elevation must come from *white + shadow*, not color. Borders (`--line-1`, 6% alpha) are too faint to carry it alone.

---

## 3. Accessibility  *(P0/P1)*

### Focus visibility
- Global `:focus-visible` exists **only** for `input/textarea/select` (`index.css:567`). **Custom `<button>`s, `<Link>`s, and clickable rows have no focus ring** — there is no `button:focus-visible` rule. Keyboard users can't see where they are.
  **Fix:** add a global `button:focus-visible, a:focus-visible, [role="button"]:focus-visible { box-shadow: 0 0 0 3px var(--accent-soft); border-radius: inherit; }` (or per-component).
- The 30+ inline `outline: "none"` on form controls are *mostly mitigated* by the global ring — but note inline `border` shorthand overrides the focus-visible `border-color: accent`, so focused inputs get the ring without the accent border. Minor; acceptable.

### Non-interactive elements used as buttons  *(P0)*
- Clickable table rows via `<tr onClick>` with no `role`, `tabIndex`, or keyboard handler:
  `FindingsListPage.tsx` (row → opens slide-over), `CapaListPage.tsx` (row → navigate). Not keyboard-reachable.
  **Fix:** make the row a real link target (wrap the primary cell in `<Link>`) or add `role="button" tabIndex={0} onKeyDown` (Enter/Space).

### Icon-only buttons missing `aria-label`  *(P1)*
- `TopBar.tsx:143, 172, 215` — 3 buttons, 0 `aria-label` (bell / reset / etc.).
- `NovaChatPanel.tsx:123` — button, no `aria-label` (close).
- `NotificationCenterPage.tsx` — 1 button, 0 `aria-label`.
  **Fix:** add `aria-label` to every icon-only control; add `aria-hidden="true"` on the decorative icon inside.

### Modal / dialog semantics  *(P1)*
- Portaled overlays missing `role="dialog"` + `aria-modal="true"`: `D7SignOffPage.tsx` (e-signature modal), `SimilarityExplorerPage.tsx` (detail modal). Only `FindingsListPage` slide-over sets them.
- `CitationDetailPanel.tsx` and `NovaChatPanel.tsx` — verify dialog role, labelled title, focus trap, and **Escape to close** (FindingsList slide-over has Escape; others likely don't).
- No modal sets `overscroll-behavior: contain` → background scrolls behind the overlay. Add to every overlay panel.
- No focus trap / focus-return on close in the e-sig and chat panels.

### Live regions  *(P1)*
- **Zero `aria-live`** in the app. Async results aren't announced: Nova "thinking" → answer, AI search/clustering completion, score changes, toast notifications.
  **Fix:** wrap async result containers (Nova chat stream, search results count, score pill) in `aria-live="polite"`.

---

## 4. Forms  *(P1)*

- **`LoginPage.tsx`**:
  - Email/password inputs have **no `autoComplete` and no `name`** → password managers and autofill won't work. Add `name="email" autoComplete="email"` and `name="password" autoComplete="current-password"`.
  - **Labels aren't associated** — `<label>` has no `htmlFor` and inputs have no `id` (the `<label>` is a sibling, not wrapping). Clicking the label doesn't focus the field. Add `id`+`htmlFor` or wrap.
  - Email input has no `inputMode`; fine since `type="email"` covers it.
- **Placeholders** don't follow the "end with `…` + example pattern" guideline consistently — e.g. password placeholder is `••••••••`. Search placeholders are good (descriptive).
- **Native `<select>`** across D2/D4/D5/D6 use `appearance:none` with a custom chevron — verify `color`/`background-color` are set explicitly for the dropdown popup (dark-mode native menus). Mostly set via `--bg-4`/`--fg-1`; OK.
- **Unsaved-changes warning:** 8D forms and intake collect edits but don't warn on navigation away. Consider a guard on dirty forms (P2).

---

## 5. Animation  *(P1/P2)*

- **`transition: "all …"`** (WIG: never animate `all`) at:
  `CapaIntakePage.tsx:728, 1054`, `D3RCAPage.tsx:775`. List explicit properties.
- `prefers-reduced-motion` **is** handled globally (`index.css`, `App.css`) ✓ — but verify JS-driven animations (confetti in D7, slide-overs, `motion-*` classes) also respect it; CSS media query won't stop `fireConfetti()`.
- Confirm overlay/panel animations are interruptible (open→close mid-animation).

---

## 6. Typography & copy  *(P1/P2)*

- **Literal `...` instead of `…`** in loading/UI copy:
  `ConsolidatedActionPlanPage.tsx:387` ("Clustering..."), `SimilarityExplorerPage.tsx:463` ("Searching..."), `TopicsGroupingPage.tsx:116` ("…clustering findings…"), `NovaChatPanel.tsx:144` (placeholder "Ask Nova…").
- **`font-variant-numeric: tabular-nums` only in `ScorePill` + `CapaDetailPage`.** Number/date columns elsewhere misalign: FindingsList/CapaList/AuditTrail tables (dates, IDs), Dashboard stat numbers, action due-dates. Add tabular-nums to all numeric columns and stat figures.
- **Title Case on buttons/headings** is inconsistent (mix of "Save Draft" vs "Continue to D5 Preventive Action"). Pick one (WIG prefers Title Case for buttons).
- Curly quotes: check user-facing strings use `"` `"`/`'` not straight quotes (several inline strings use straight quotes).
- Headings: verify a single `<h1>` per view and hierarchical order — many pages render the title as a styled `<p>`/`<h1>` inconsistently; the TopBar also renders an `<h4>` page title (`TopBar.tsx:82`) which competes with the page's own heading.

---

## 7. Content & state handling  *(P1)*

- **`EmptyState` component exists but is used by zero nova pages.** Empty states are ad-hoc or missing: FindingsList has an inline "No findings" row; CapaList / MyWork / Notifications / Similarity / Topics need verified empty states. Standardize on `EmptyState`.
- **Loading states** are inconsistent: some use `AILoadingSpinner`, some inline "Searching..." text. Unify, and ensure each ends with `…` and has `aria-live`.
- **Long-content handling:** confirm `min-w-0` on flex children that truncate (inline `flex:1` text blocks without `minWidth:0` will overflow rather than ellipsize). Spot-checked several cards rely on `minWidth:0` correctly; audit the rest.
- **Error states:** form validation uses toasts/inline danger borders (8D soft-gate) — good — but no inline error *text next to the field* per WIG; the red border alone isn't announced. Add field-level error text + `aria-describedby`.

---

## 8. Responsiveness  *(P1)*

- **No responsive logic in content** — zero `useMediaQuery`/`matchMedia`; all multi-column layouts use hardcoded px `gridTemplateColumns` (e.g. `minmax(0,1fr) 320px` in FindingDetail, fixed 2–3 col grids across 8D pages, Dashboard, Similarity). Below the sidebar's `xl` breakpoint the content doesn't reflow → horizontal overflow / cramped columns on laptops < 1280px.
- The sidebar is `hidden xl:flex` (only shows ≥1280px) but there is **no mobile/tablet nav replacement** — between the breakpoints the app has no primary navigation visible.
  **Fix:** add CSS-based responsive collapse for the main grids (move inline grids to classes with media queries) and a compact nav for < xl.

---

## 9. Consistency & maintainability  *(P1 — root cause of much of the above)*

- **No shared surface/card/button/input primitives.** Each page re-declares the same inline styles. Evidence: `--bg-2` card pattern duplicated 43×; `StyledSelect`, `SeverityBadge`, `StatusBadge`, `TypePill`, `SourceChip`, `ScorePill` are **re-defined locally** in multiple pages (FindingsList, FindingDetail, etc.) instead of importing the shared versions in `src/components/shared`.
- **Two badge systems:** `src/components/shared/{SeverityBadge,StatusBadge,SourceBadge,ScorePill}` exist, but pages ship their own copies → drift in colors/labels.
  **Fix:** extract `.surface-card/.surface-raised/.surface-overlay` utility classes (also fixes depth, §2) and a small set of shared `Badge`, `Select`, `Button` components; replace the per-page copies.
- **Inline `style={{…}}` everywhere** makes `:hover`/`:focus-visible`/media-queries impossible without JS handlers (hence the onFocus/onMouseEnter sprawl: 25 inline `onFocus` handlers). Moving to classes enables real CSS states.

---

## 10. Per-view quick notes

| View | Notable issues |
|------|----------------|
| `LoginPage` | form a11y (§4): no autocomplete/name, labels unassociated; login card needs `--shadow-lg`; password placeholder dots. |
| `MyWorkPage` (812 ln) | empty states; card shadows; tabular-nums on counts. |
| `DashboardPage` (921 ln) | only page using a shadow token — use as reference; stat cards still flat; tabular-nums on figures. |
| `FindingsListPage` | `<tr onClick>` keyboard access; rows don't lift on hover; slide-over good (has Escape/aria-modal) but needs `overscroll-behavior`. |
| `FindingDetailPage` | responsive grid (`minmax(0,1fr) 320px`) no reflow; section cards need shadow. |
| `CapaListPage` | `<tr onClick>` navigation needs keyboard/Link; `<td onClick stopPropagation>` (454) ok. |
| `CapaDetailPage` (1349 ln) | densest view; 5 flat cards merge; embedded 8D panels need elevation separation; has tabular-nums ✓. |
| `CapaIntakePage` (1406 ln) | `transition: all` ×2; largest file — split + extract form primitives. |
| `D1–D7` 8D pages | repeated inline select/textarea with `outline:none` (mitigated); `transition:all` in D3; inline danger borders lack field error text; fixed grids. |
| `SimilarityExplorerPage` | 6 flat cards (worst density); detail modal missing dialog semantics; "Searching..." copy. |
| `ConsolidatedActionPlanPage` | "Clustering..." copy; 4 flat cards. |
| `NotificationCenterPage` | icon button missing aria-label; verify empty state + `aria-live` on new notifications. |
| `NovaChatPanel` | close button no aria-label; needs dialog role + focus trap + Escape + `aria-live` on stream; placeholder `…`. |
| `CitationDetailPanel` | verify dialog semantics, Escape, focus return. |
| `TopBar` | 3 icon buttons no aria-label; competes with page `<h1>`; weak separation from content (§2 S2). |
| `Sidebar` (live) | bg-0 fix (§2); logo `<img>` has alt ✓ but no width/height. |

---

## 11. Priority matrix

**P0 — do first**
- §3 add `button/a:focus-visible` ring; make `<tr onClick>` rows keyboard-accessible (FindingsList, CapaList).
- §2 card shadows + sidebar `--bg-0` (depth doc).
- §3 dialog semantics (`role`/`aria-modal`/Escape/focus-trap) on e-sig, chat, citation, similarity modals.

**P1**
- §1 delete dead pages/components (incl. duplicate Sidebar).
- §3 `aria-label` on all icon buttons; `aria-live` on async regions.
- §4 LoginPage form a11y (autocomplete/name/label association).
- §5 replace `transition: all` (3 spots).
- §6 `…` not `...`; tabular-nums on number/date columns.
- §7 standardize `EmptyState` + loading states.
- §8 responsive reflow + sub-xl nav.
- §9 extract shared surface/badge/select/button primitives.

**P2**
- Title Case consistency; curly quotes; unsaved-changes guard; hover-lift on interactive cards; confetti reduced-motion guard; LoginPage `--shadow-lg`.

---

*Method: WIG ruleset fetched fresh; findings verified by grep across the live tree
(file:line cited where exact). No files modified.*
