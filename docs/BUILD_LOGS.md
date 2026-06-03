# BUILD_LOGS.md

This file records all completed work sessions.
Newest entries must stay at the top; add the next entry starting on line 7 using `## YYYY-MM-DD, 12:55 PM — Title`.
Older entries move down unchanged.

## 2026-06-03, 11:45 AM — CAPA intake dual-approval flow, Ungraded severity, D7 comprehensive review

### Prompt
Full CAPA lifecycle redesign:
1. Severity "Ungraded" added for findings before QA approval (pre-CAPA creation)
2. CAPA intake renamed from "disposisi" to "pending_review"; CAPAStatus extended with `revision_requested` and `rejected`
3. Dual intake reviewers: Siti Rahmawati (QA) AND Bambang Saputra (Dept Head) both required to Accept before 8D opens
4. `IntakeReview` type added to `CAPACase`; mock data for CAPA-2026-0275 populated with Siti Accepted + Bambang Pending
5. `IntakeReviewCard` added to CapaDetailPage and MyWorkPage showing per-reviewer decisions
6. D7 Sign-Off: comprehensive review panel with collapsible D1–D6 sections inline so approvers don't navigate away
7. SME approval chain triggered for Major OR Critical severity (previously Critical only)

### Changes
- `src/types/capa.ts` — added `Severity` enum value `"Ungraded"`, extended `CAPAStatus`, added `IntakeDecision` and `IntakeReview` interfaces
- `src/types/finding.ts` — added `"pending_review"` to `FindingStatus`
- `src/utils/formatters.ts` — removed "disposisi", added pending_review/revision_requested/rejected labels; added "Under Review" for finding status
- `src/components/shared/SeverityBadge.tsx` — added Ungraded style (neutral muted)
- `src/components/shared/StatusBadge.tsx` — added pending_review/revision_requested/rejected styles
- `src/mock-data/findings.json` — DEV-2026-0144, AUD-2026-0127, CMP-2026-0098 severity set to Ungraded
- `src/mock-data/capa-cases.json` — CAPA-2026-0275 status→pending_review, added intakeReviews array
- `src/mock-data/topic-clusters.json` — added Ungraded count to all severityDistribution objects
- `src/pages/nova/CapaListPage.tsx` — filter options: added Ungraded severity + pending_review/revision_requested/rejected statuses
- `src/pages/nova/CapaDetailPage.tsx` — replaced DispositionCard with IntakeReviewCard
- `src/pages/nova/MyWorkPage.tsx` — added IntakeReviewCard, pendingIntake filter for QA and DeptHead views
- `src/pages/nova/FindingsListPage.tsx` — added Ungraded severity filter + Under Review status filter
- `src/pages/nova/TopicsGroupingPage.tsx` — Ungraded added to severity distribution loop
- `src/pages/nova/eight-d/D7SignOffPage.tsx` — added ComprehensiveReview component (collapsible D1-D6), fixed SME trigger to Major||Critical

## 2026-06-03, 12:47 AM — My Work-only roles and light table header standard

### Prompt
1. "Role Senior Operator dan SME Microbiology gausah ada dashboard. Fokus di My Work aja" and follow-up: "cek warna header table di http://localhost:8081/capa. Aku pengen di lightmode semua header table di aplikasi ini begitu. Tapi kalo di dark mode, biarin aja kek yg di http://localhost:8081/findings"

### Completed
- Added `isMyWorkOnlyPersona()` for persona access rules: `initiator` (Senior Operator) and `sme` (SME Microbiology) are now My Work-only personas.
- `/dashboard` now redirects to `/` for those two personas; other personas still see Dashboard.
- Removed Dashboard from desktop sidebar and compact mobile nav for Senior Operator + SME Microbiology; the logo also returns them to My Work instead of Dashboard.
- Updated the 404 fallback CTA so My Work-only personas see "Return to My Work" instead of "Return to Dashboard".
- Standardized table header tokens:
  - Dark mode: `--table-head-bg = hsl(var(--elevated))`, `--table-head-fg = hsl(var(--foreground-secondary))` so it keeps the `/findings` dark look.
  - Light mode: `--table-head-bg = hsl(var(--primary) / 0.60)`, `--table-head-fg = hsl(var(--primary-foreground))` so every table header follows the `/capa` light-mode look.
- Updated manual table headers and shadcn table primitives to use `--table-head-bg` + `--table-head-fg`: CAPA list, Findings list, Audit Trail, Corrective Actions, Preventive Actions, Consolidated Action Plan, and the placeholder table primitive path.

### Changed Files
- `src/utils/personaAccess.ts` (added)
- `src/router.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/pages/NotFound.tsx`
- `src/index.css`
- `src/components/ui/table.tsx`
- `src/pages/nova/CapaListPage.tsx`
- `src/pages/nova/FindingsListPage.tsx`
- `src/pages/nova/AuditTrailPage.tsx`
- `src/pages/nova/CorrectiveActionsPage.tsx`
- `src/pages/nova/PreventiveActionsPage.tsx`
- `src/pages/nova/ConsolidatedActionPlanPage.tsx`
- `src/pages/nova/NovaPlaceholderPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit --pretty false` ✅ passes.
- `npm run build` ✅ passes (existing Browserslist staleness + bundle-size warning only).
- `git diff --check` ✅ passes after cleaning two trailing-whitespace spots.
- Static table-header scan ✅ no remaining `/capa`-specific `bg-primary/60 dark:bg-primary/20` header class and no active table header still using the old foreground class where the new header token should be used.

### Notes
- Browser smoke via local dev server was not run because starting Vite on `127.0.0.1:8080` hit sandbox `EPERM`, and the escalation request was not approved in this turn.

---

## 2026-06-03, 12:15 AM — Badge uniform width, Bizzmine rename, sheet close animation, role-based dashboard

### Prompt
Four requests: (1) make all status/severity/type badges in tables a uniform fixed width with centered text; (2) rename "Bizzmine-Complaint" display label to just "Bizzmine" everywhere; (3) add a slide-out animation when closing Sheets (open already animated, close was instant "snap"); (4) make the Dashboard show a different layout per persona role, like MyWork already does.

### Completed
- **Uniform badge widths.** `SeverityBadge` → `w-[76px]`, `TypePill` → `w-[108px]`, `StatusBadge` → `w-[132px]` (fits longest label "CAPA In Progress"); all get `justify-center` so text aligns regardless of content length.
- **Bizzmine rename.** Added `DISPLAY_NAMES` map to `SourceBadge` so `"Bizzmine-Complaint"` and `"Bizzmine Complaint"` both resolve to `"Bizzmine"`. Also updated `getSourceSystem()` in `CapaDetailPage`, `getPrefillSource()` in `CapaIntakePage`, prose in `D1ProblemPage`, and an audit trail JSON entry.
- **Sheet close animation.** Radix sets `data-[state="closed"]` before unmounting and waits for `animationend`. Added `leadSlideOut` / `leadBackdropFadeOut` keyframes and bound them to `[data-state="closed"]` selectors so the panel eases back off-screen instead of snapping.
- **Role-based dashboard.** `DashboardPage` now reads `usePersonaStore` and branches into 5 layout modes via `ROLE_CONFIG`: `executive` (head_of_qa — 4 KPIs, trend+type, root cause+heatmap), `qa_officer` (qa_deviation — same + latest findings), `dept_head` (head_of_dept — 3 KPIs, heatmap full-width, trend+root cause), `operator` (initiator — 2 KPIs, dept summary, latest findings, no date selector), `expert` (sme — 2 KPIs, root cause+type, recurrence trend full-width). Added `RecurrenceTrendChart`, `LatestFindingsList`, and `MyDeptSummary` sub-components using existing service functions.

### Changed Files
- `src/components/shared/SeverityBadge.tsx`, `StatusBadge.tsx`, `TypePill.tsx` (fixed widths)
- `src/components/shared/SourceBadge.tsx` (Bizzmine rename map)
- `src/pages/nova/CapaDetailPage.tsx`, `CapaIntakePage.tsx` (Bizzmine rename)
- `src/pages/nova/eight-d/D1ProblemPage.tsx` (Bizzmine prose)
- `src/mock-data/audit-trail.json` (Bizzmine rename in audit entry)
- `src/index.css` (sheet slide-out keyframes + `[data-state="closed"]` rules)
- `src/pages/nova/DashboardPage.tsx` (role-based layout, 3 new sub-components)

## 2026-06-02, 11:03 PM — Neutral dark rebase, borderless cards, mono stripped from UI

### Prompt
Client feedback: (1) too much monospace text — "Ngeganggu… bikin mata sakit", wants to control mono himself; (2) dislikes the current dark scheme; (3) wants borderless cards that stand out by being *lighter* than the background (reference image), and OK to change the dark base colors.

### Completed
- **Mono stripped from the UI (opt-in only now).** Found the hidden culprit: a global rule in `index.css` forced `font-family: var(--font-mono)` onto *every* `uppercase` + `text-foreground/​muted` element (higher specificity than any `font-*` class), plus `.eyebrow/.kicker/.mono-label` and `.compact-nav-badge`. Removed the global auto-mono rule, switched `.eyebrow/.kicker` and the nav badge to sans, and converted all 189 `font-mono` class usages across 32 `.tsx` files to `font-sans`. Mono is now entirely opt-in: re-add `font-mono` (or the kept `.mono-label` class) wherever you actually want it. Also relaxed the harsh `0.18em` label tracking to `0.08em`.
- **Neutral charcoal dark rebase.** Replaced the blue-tinted grays (hue ~218, sat ~18–20%) with a near-neutral hue 240 / 5–6% sat ramp. Elevation now reads through *lightness*: `--background 240 6% 9%` → `--card 240 5% 13%` → `--elevated 16%` → `--field 20%`. Re-tuned all neutral shadcn tokens (popover/secondary/panel/muted/surface/input/sidebar-*) and text tokens to match. Brand/semantic accents (primary purple, success, warning, severity, status, charts) left unchanged.
- **Borderless cards.** `.lead-card` no longer draws a border — it stands out via the lighter `--card` surface + `--shadow-sm`, and hovers by lifting to `--elevated` instead of changing a border color. Border tokens (`--border*`) and decorative `--line-1/2/3` overlays were dropped to near-surface / very low opacity so any remaining explicit borders read as faint hairlines rather than contrast outlines.

### Changed Files
- `src/index.css` (dark palette surfaces/text/borders/neutrals/lines, `.lead-card`, mono rules)
- 32 `.tsx` files under `src/pages` and `src/components` (`font-mono` → `font-sans`)

### Validation
- `npx tsc --noEmit` ✅ · `npm run build` ✅ (only the pre-existing Browserslist + bundle-size warnings).
- Runtime ✅: page bg `rgb(22,22,24)` vs card `rgb(31,31,35)` — cards are clearly lighter; remaining borders are `rgba(255,255,255,0.05)` hairlines + soft shadow (borderless look). Uppercase label "Management" now computes to Plus Jakarta Sans (was mono). Dashboard and CAPA list verified: badges/accents still pop against the neutral surface, tables stay readable.

### Notes
- Only the dark block changed; light theme is untouched (the `.lead-card` borderless + mono removal apply to both, which is intended).
- The faint hairline on some custom `bg-card` panels comes from explicit `border-[var(--line-2)]` in those components; it's now ~5% white (barely visible). Say the word if you want it fully removed too.
- Mono font picker stays in the customizer — it applies wherever `font-mono` is (re)added.

### Next Recommended Task
- Optional: sweep custom `bg-card` panels to drop their explicit `border-*` classes for a 100% borderless result, and add a soft "lift on hover" to list rows for parity with the card hover.

## 2026-06-02, 10:49 PM — Customization panel expanded to all color tokens + mono font

### Prompt
"Belum semua text udah pake tokenized. ada beberapa text yang aku gonta ganti font malah ga keganti." (contoh `font-mono` "Trend") + "Sama aku mau customizationnya bisa ganti font mono sama sans. Pokoknya semua token warna aku bisa ganti." — make the mono font swappable too (so `font-mono` text reacts), and let the panel edit every color token, not just primary.

### Completed
- Pointed Tailwind `fontFamily.mono` at `var(--font-mono)` in the prior step; this step adds the runtime control: `font-mono` text (e.g. the uppercase "Trend" labels) now re-renders when the mono family changes. Verified in-browser that overriding `--font-mono` switches a live `.font-mono` element from IBM Plex Mono → JetBrains Mono.
- Reworked `src/lib/customization.ts` into a generic token system:
  - `COLOR_GROUPS` registry of every editable token (Brand, Semantic, Severity, Status, Surfaces, Text, Borders, Charts) — each maps 1:1 to a `--<id>` in `index.css`.
  - `applyColorToken(id, hsl)` / `resetColorToken(id)` / `resetAllColors()` persist a JSON override map (`capa-ai-colors`). `primary` still derives `--primary-light/-dark/--ring`; `status-closed` mirrors `--status-ready`.
  - `readTokenHex(id)` reads the live computed value (theme + overrides aware) to seed each picker.
  - Split fonts into sans + mono: `applySansFont` / `applyMonoFont` (+ `FONT_SANS_OPTIONS`, `FONT_MONO_OPTIONS`, separate storage keys `capa-ai-font-sans` / `capa-ai-font-mono`). 6 mono families (IBM Plex Mono default + JetBrains/Fira Code/Roboto/Space/Geist Mono, lazy-loaded from Google Fonts).
  - `applyCustomization()` boot hook now replays the color map + both fonts before paint.
- Rebuilt `src/components/shared/ThemeCustomizer.tsx` as a right-side Sheet (scrollable, more room): Fonts (Sans + Mono selects with in-typeface previews), Brand quick-swatches, then a grouped color editor where each row shows label + hex + a swatch wrapping a native color picker, with per-token reset and a global "Reset all".

### Changed Files
- `src/lib/customization.ts`
- `src/components/shared/ThemeCustomizer.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ no errors.
- `npm run build` ✅ passes (existing Browserslist + bundle-size warnings only).
- Runtime ✅: panel renders all token groups; `--font-mono` override flips computed `.font-mono` font family; non-primary tokens (e.g. `--severity-minor`) read/write through the generic path.

### Notes
- Color overrides are inline on `<html>`, so they apply to both light and dark (one value per token). Per-token and global reset fall back to the theme-aware stylesheet defaults.
- Tailwind `font-sans`/`font-mono` both now resolve through CSS vars, so any tokenized text (sans or mono) follows the panel. Text that still wouldn't react would have to be using a hardcoded inline `font-family` — none found among the migrated components.

### Next Recommended Task
- Optional: add a density/radius control and an export/import of the full token set (JSON) so a finished palette can be promoted back into `index.css` defaults.

## 2026-06-02, 10:11 PM — Runtime customization panel (brand color + UI font)

### Prompt
"Selanjutnya adalah bisakah kamu bikinin aku 'panel khusus' untuk gonta ganti font, dan prime color?" — build a dedicated runtime panel to swap the brand/primary color and the UI font, leveraging the now-unified token system.

### Completed
- Added `src/lib/customization.ts`: persists and applies brand color + font as inline custom properties on `<html>` (inline overrides the canonical `index.css` tokens and survives light/dark toggles). Mirrors the `theme.ts` localStorage pattern (`capa-ai-primary`, `capa-ai-font`).
  - `applyPrimaryColor(hsl)` writes `--primary` and derives `--primary-light` (L+9) / `--primary-dark` (L−7) / `--ring`; soft/line tokens follow automatically because they reference `hsl(var(--primary)/a)`.
  - `applyFont(id)` writes `--font-sans`, lazy-injecting a Google Fonts `<link>` for non-bundled families. Includes `hexToHslTriple` / `hslTripleToHex` for the custom color picker, plus reset helpers and an `applyCustomization()` boot hook.
- Pointed Tailwind `fontFamily.sans`/`.mono` at `var(--font-sans)`/`var(--font-mono)` so the `font-sans`/`font-mono` utility classes (not just raw CSS-var consumers) react to runtime font swaps.
- Wired `applyCustomization()` into `src/main.tsx` (pre-render, flash-safe alongside `applyTheme`).
- Added `src/components/shared/ThemeCustomizer.tsx`: a shadcn Popover with 8 brand swatches + custom hex picker (live preview) and 6 interface-font options (each previewed in its own typeface), an active-state check, and a Reset-to-default control. Hosted in the sidebar footer next to the existing theme toggle.

### Changed Files
- `src/lib/customization.ts` (new)
- `src/components/shared/ThemeCustomizer.tsx` (new)
- `src/main.tsx`
- `src/components/layout/Sidebar.tsx`
- `tailwind.config.ts`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ no errors.
- `npm run build` ✅ passes (existing Browserslist staleness + bundle-size warning only).
- Runtime browser checks ✅: selecting "Blue" set `--primary=217 80% 56%` with derived `--primary-light=217 80% 65%`, `--primary-dark=217 80% 49%`, `--ring` matched, and persisted to `localStorage`. Selecting "Inter" set `--font-sans`, injected the Google Fonts link, persisted `capa-ai-font=inter`, and the `h1` (Tailwind `font-sans`) computed to Inter — confirming the var-backed font wiring. Reset removed both inline props and cleared storage; computed `--primary` fell back to canonical `284 55% 55%`. Popover layout verified visually.

### Notes
- Brand color is intentionally theme-agnostic (set as one inline value, not per `.light`/`.dark`), so a chosen brand stays consistent across the light/dark toggle. Presets are mid-lightness to read acceptably in both themes.
- Only the sans family is user-swappable; `--font-mono` (IBM Plex Mono) is left as-is. Easy to extend later via the same `FONT_OPTIONS` mechanism.

### Next Recommended Task
- Optional: expose a mono-font selector and/or a border-radius / density control through the same panel, and consider a flash-safe inline `<head>` script if customizations should apply before the JS bundle parses.

## 2026-06-02, 08:34 PM — Legacy alias bridge removed (Phase 4 of UI overhaul)

### Prompt
Active goal continuation: "lanjhutin terus sampai selesai" — after completing Phase 3 static-token migration, perform the Phase 4 alias audit/removal and final both-theme validation.

### Completed
- Audited the active `src` tree for exact legacy alias dependencies (`var(--bg-0..4)`, `var(--fg-1..4)`, `var(--accent)`, `var(--accent-hover)`, `var(--accent-press)`, `var(--success)`, `var(--warning)`, `var(--danger)`, `var(--info)`) before removing the bridge.
- Migrated the last exact active dependencies: `src/App.css` `.read-the-docs`, shadcn `Input`, shadcn `SelectTrigger`, and global utility rules in `src/index.css` now reference canonical HSL tokens / Tailwind token classes instead of the legacy alias names.
- Removed the full `INLINE-UI ALIASES` bridge block from `src/index.css`; retheming now runs through the canonical palette + Tailwind/shadcn tokens, with no `--bg-*`, `--fg-*`, or bare semantic alias layer left in the app CSS.
- Preserved canonical decorative/semantic soft tokens (`--accent-soft`, `--accent-line`, `--field-bg`, `--success-soft`, `--warning-soft`, `--danger-soft`) because they are first-class tokens, not the removed alias bridge.
- Ran a browser runtime sweep in both dark and light themes across Dashboard, CAPA list, Findings list, CAPA detail, and Similarity Explorer: old aliases are no longer exposed in computed style, while canonical `--background`, `--primary`, body background, and heading colors resolve correctly.

### Changed Files
- `src/index.css`
- `src/App.css`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- Exact legacy alias scan ✅ no `var(--bg-*)`, `var(--fg-*)`, `var(--accent)`, `var(--success)`, `var(--warning)`, `var(--danger)`, or `var(--info)` dependencies remain in `src`.
- Alias-definition scan ✅ no legacy alias definitions remain in `src/index.css` or `design_system/colors_and_type.css`.
- `npx tsc --noEmit --pretty false` ✅ passes.
- `git diff --check` ✅ passes.
- `npm run build` ✅ passes (1761 modules; existing Browserslist staleness + bundle-size warning only).
- `npm run test:visual` ✅ passes (8/8 desktop + mobile Chrome).
- Runtime dark/light sweep ✅ Dashboard, CAPA list, Findings list, CAPA detail, and Similarity Explorer render with resolved canonical colors in both themes (`dark --primary=284 55% 55%`, `light --primary=275 61% 41%`).

### Notes
- Phase 3 and Phase 4 of the UI-token overhaul are now complete for the active application surfaces. Remaining `style={{...}}` usage is intentionally dynamic (SVG/chart geometry, runtime progress widths, `FilterControls` prop-driven grid template, range slider accent color where native CSS var support is unreliable).
- `design_system/preview/*.html` and historical handoff/docs still mention the old aliases as archived reference material; they are not active app dependencies.

### Next Recommended Task
- Optional cleanup: refresh design-system reference docs/previews to describe the canonical Tailwind/shadcn token workflow, or start a visual design pass now that colors/fonts are centrally rethemeable.

---

## 2026-06-02, 08:28 PM — 8D workflow token migration complete (Phase 3 continuation)

### Prompt
Active goal continuation: "lanjhutin terus sampai selesai" — continue Phase 3 after the intake/shared Nova batch and finish the remaining 8D workflow pages.

### Completed
- Completed static token-style migration for the remaining 8D workflow pages `D3RCAPage`, `D4CorrectiveActionPage`, `D5PreventiveActionPage`, `D6VerificationPage`, and `D7SignOffPage`.
- `D3RCAPage`: converted RCA method picker, 5-Whys chain, Fishbone grid, Decision Tree, Similar CAPA cards, confirmed root cause editor, blocker, quality signals, and footer actions to class-based token styling. Removed similar-card hover DOM mutation.
- `D4CorrectiveActionPage` and `D5PreventiveActionPage`: converted local status badges, action-list cards, add-action forms, native selects/date inputs/textareas, blocker banners, quality-signal cards, and footer actions to token classes. Removed delete-button hover DOM mutation.
- `D6VerificationPage`: converted verification evidence form, method select, result textarea, mock upload input/button, uploaded evidence chip, blocker, quality-signal cards, and footer actions to token classes.
- `D7SignOffPage`: converted the e-signature modal, notes textarea, approve/reject buttons, sign-off header, score blocker, final quality gate, approval-chain rows/status pills/e-sign buttons, and closed-state banner to token classes.
- Confirmed no remaining live-tree DOM style mutation patterns (`onMouseEnter`, `onMouseLeave`, `currentTarget.style`) in the Nova/layout/shared/page surfaces covered by the Phase 3 scans.

### Changed Files
- `src/pages/nova/eight-d/D3RCAPage.tsx`
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx`
- `src/pages/nova/eight-d/D5PreventiveActionPage.tsx`
- `src/pages/nova/eight-d/D6VerificationPage.tsx`
- `src/pages/nova/eight-d/D7SignOffPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit --pretty false` ✅ passes.
- Static mutation/token scan ✅ no `onMouseEnter`, `onMouseLeave`, `currentTarget.style`, or one-line legacy static token `style={{...var(--bg/fg/accent/success/warning/danger)...}}` matches in active Nova/layout/shared surfaces.
- `git diff --check` ✅ passes.
- `npm run build` ✅ passes (1761 modules; existing Browserslist staleness + bundle-size warning only).
- `npm run test:visual` ✅ passes (8/8 desktop + mobile Chrome).

### Notes
- Phase 3 migration is now materially complete for static inline token styling in the active Nova pages and shared components. Remaining inline `style={{...}}` hits are intentionally dynamic layout/data styles such as chart/SVG geometry, runtime progress widths, and `FilterControls` prop-driven grid templates.
- Phase 4 is still separate: remove the legacy alias bridge in `src/index.css` only after a final alias-dependency audit proves no migrated or remaining active surface still depends on it.

### Next Recommended Task
- Phase 4 audit/removal: scan every active route/component for legacy alias-token dependencies, remove the alias bridge from `src/index.css` if safe, then run TypeScript, build, visual tests, and a dark/light browser sweep.

---

## 2026-06-02, 08:14 PM — Intake, Nova, and early 8D token migration (Phase 3 continuation)

### Prompt
"bisa dilanjutkan?" / continue Phase 3: keep migrating static token-based inline styles to Tailwind/shadcn token classes while preserving the current look.

### Completed
- Completed `CapaIntakePage` static token-style migration: wizard shell, step indicator, source cards, gate questions, Nova assessment, severity cards, review/submit summaries, form controls, buttons, and readiness checklist now use class-based token styling. Removed focus/hover DOM style mutation and kept only allowed arbitrary token classes for field/focus/soft surfaces.
- Migrated shared Nova surfaces used across 8D and suggestion flows: `NovaSuggestionBlock`, `NovaChatPanel` suggestion context, `CitationDetailPanel` overscroll handling, and `NovaBlock` skeleton/accepted/idle/editing/reasoning/action states now use token classes. Removed `NovaBlock` hover style mutation and fixed the ambiguous Tailwind `duration-[380ms]` warning.
- Migrated global action table header text tokens in `CorrectiveActionsPage` and `PreventiveActionsPage`.
- Started the dedicated 8D batch by completing D1 Problem and D2 Containment static-token migration: headers, editors, field focus, blocker banners, quality signal cards, score preview, and footer actions now use class-based token styling. Dynamic validation state stays class-driven through `cn`.

### Changed Files
- `src/pages/nova/CapaIntakePage.tsx`
- `src/components/nova/NovaBlock.tsx`
- `src/components/nova/NovaSuggestionBlock.tsx`
- `src/components/nova/NovaChatPanel.tsx`
- `src/components/nova/CitationDetailPanel.tsx`
- `src/pages/nova/CorrectiveActionsPage.tsx`
- `src/pages/nova/PreventiveActionsPage.tsx`
- `src/pages/nova/eight-d/D1ProblemPage.tsx`
- `src/pages/nova/eight-d/D2ContainmentPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit --pretty false` ✅ passes.
- `npm run build` ✅ passes (1761 modules; existing Browserslist staleness + bundle-size warning only).
- `npm run test:visual` ✅ passes (8/8 desktop + mobile Chrome).

### Notes
- Phase 3 is still in progress. Remaining heavy 8D pages: D3 RCA, D4 Corrective Action, D5 Preventive Action, D6 Verification, and D7 Sign-Off. A final scan should separate truly dynamic inline styles (progress widths, SVG/chart geometry) from static token styles before Phase 4 removes the alias bridge.
- Token definition files remain untouched in this batch.

### Next Recommended Task
- Continue Phase 3 8D batch with `D3RCAPage` first, then D4/D5/D6/D7, validating after each pair because those pages have the densest form/checklist surfaces.

---

## 2026-06-02, 05:45 PM — Detail and management token migration (Phase 3 continuation)

### Prompt
"lanjhutin terus sampai selesai" — keep progressing Phase 3 full inline-token migration toward completion.

### Completed
- Completed static token-style migration for `ConsolidatedActionPlanPage`: KPI cards, action kind badges, progress bars, export/AI clustering buttons, group-mode panel, loading state, grouped action cards, tables, hover states, CAPA links, and footer link now use token classes. Remaining inline style is only runtime progress width.
- Completed static token-style migration for `SimilarityExplorerPage`: outcome badges, detail modal/backdrop/panel, meta grid, search card, AI Search button, loading state, filter bar, range slider, result count, result cards, score pills, root-cause/action text, and year badges now use token classes with no DOM hover mutation.
- Migrated the `CapaDetailPage` main hub/read-only surfaces: local primitives (`Pill`, `InfoGrid`, `Card`, `CardLabel`, `EmptyStepState`), left rail overview/8D progress/CAPA info/quality score/lift tips, right-column breadcrumb/badge row/title/CTA, top action bar, and closed-CAPA `StepDetailView` now use class-based token styling. Remaining CAPA detail inline style is limited to runtime score/progress width.
- Kept the dynamic/embedded 8D workflow pages untouched for their dedicated batch; `CapaDetailPage` still renders the existing editable 8D components through `EightDEmbedProvider`.

### Changed Files
- `src/pages/nova/ConsolidatedActionPlanPage.tsx`
- `src/pages/nova/SimilarityExplorerPage.tsx`
- `src/pages/nova/CapaDetailPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ passes (no errors).
- `npm run build` ✅ passes (1761 modules; existing chunk-size warning only).
- `npm run test:visual` ✅ passes (8/8 across desktop + mobile Chrome).
- Extra Playwright smoke for `/actions/consolidated` ✅ authenticated route renders heading and KPI content.
- `git diff --check` ✅ passes.
- Static style scan on the newly migrated files ✅ only allowed arbitrary soft/accent tokens and runtime `style={{ width: ... }}` progress values remain.

### Notes
- Phase 3 is still active. Remaining major surfaces: `CapaIntakePage`, embedded 8D step pages, and Nova suggestion/chat components.

### Next Recommended Task
- Continue Phase 3 with `CapaIntakePage` first, then the 8D step pages (`D1`–`D7`), then shared Nova components (`NovaBlock`, `NovaSuggestionBlock`, `NovaChatPanel`) so the workflow surfaces and AI primitives converge together.

---

## 2026-06-02, 04:06 PM — Batch 2 list migration continued (Phase 3 of UI overhaul)

### Prompt
"bisa dilanjutkan?" — continue Phase 3 Batch 2 from the previous entry. PLANS/pasted migration rules still win.

### Completed
- Finished `FindingsListPage` static token migration: source chips, slide-over panel/backdrop/footer, field pairs, Nova classification block, page header, filter/table shell, table headers, rows, row hover, action buttons, and create/open CAPA links now use Tailwind token classes instead of static inline `var(--...)` styles.
- Finished `MyWorkPage` static token migration: replaced the old `T.cardBase`/`T.monoId`/`T.title`/`T.badgeRow` inline style object with shared class constants; migrated `Eyebrow`, `StepBadge`, `DueBadge`, `LifecyclePill`, `OpenLink`, `Section`, `EmptyCard`, all persona card variants, role info banners, and the greeting header.
- Migrated Dashboard shell/card layer: `DateRangeSelector`, `KpiCard`, `Card`, page header, and responsive dashboard grids now use token classes.
- Completed the focused Dashboard chart-internals pass without regressing SVG rendering: trend SVG presentation styles moved to SVG attributes backed by canonical HSL tokens; donut/root-cause/department chart wrappers, legends, labels, tracks, badges, and static swatches moved to classes. Remaining chart inline styles are only runtime values (`width`, `left`, and computed data color/background).
- Started Batch 3 detail pages and completed `FindingDetailPage`: section cards, info rows, stat strip, source-data grids, timeline, header/back link, Nova classification panel, linked-CAPA card, and summary blocks now use class-based token styling. Only allowed arbitrary soft/accent tokens remain.
- Removed more DOM hover style mutation from the migrated list/dashboard surfaces.

### Changed Files
- `src/pages/nova/FindingsListPage.tsx`
- `src/pages/nova/MyWorkPage.tsx`
- `src/pages/nova/DashboardPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ passes (no errors).
- `npm run build` ✅ passes (1761 modules; existing chunk-size warning only).
- `npm run test:visual` ✅ passes (8/8 across desktop + mobile Chrome).
- Extra Playwright smoke for `/` (My Work), `/audit-trail`, and `/findings/DEV-2026-0341` ✅ authenticated routes render expected content.
- `git diff --check` ✅ passes.
- Static style scan on migrated list/dashboard/detail pages ✅ `CapaListPage`, `FindingsListPage`, `AuditTrailPage`, `MyWorkPage`, `FindingDetailPage`, layout/shared components, and Login have no static `style={{...}}` blocks left except the intentionally dynamic `FilterControls` grid template; `DashboardPage` only retains chart runtime `style={{...}}` values for dynamic dimensions/positions/colors.

### Notes
- Batch 2 is functionally migrated for list pages plus Dashboard shell/charts.
- Batch 3 has started with `FindingDetailPage`; the heavier detail/management pages remain.
- Allowed arbitrary class survivors remain where expected: `--accent-soft`, `--accent-line`, `--warning-soft`, `--danger-soft`, `--line-*`, `--r-*`, and transition vars.

### Next Recommended Task
- Continue Phase 3 with the remaining Batch 3 detail/management pages: `CapaDetailPage`, `CapaIntakePage`, `ConsolidatedActionPlanPage`, `SimilarityExplorerPage`, then the 8D step pages.

---

## 2026-06-02, 03:34 PM — Inline token style migration start (Phase 3 of UI overhaul)

### Prompt
"oke. lanjut kerjakan" — execute pasted Phase 3 instructions: migrate remaining static token-based inline `style={{ ... }}` blocks to Tailwind/shadcn token classes in batches, preserving the current look. Plans/pasted instructions win.

### Completed
- Completed Batch 1 layout/shared migration: converted static token inline styles in the app shell and shared primitives to Tailwind token classes while preserving the same spacing, surface colors, borders, shadows, typography, hover, and focus states.
- Converted `FilterControls` to shared class-based inputs/selects using `bg-[var(--field-bg)]`, `focus:border-primary`, and `focus:shadow-[0_0_0_3px_var(--accent-soft)]`; retained only the dynamic `gridTemplateColumns` inline style because it depends on the `minColumnWidth` prop.
- Converted `EmptyState`, `PageWrapper`, `Sidebar`, `TopBar`, `EightDShell`, and `LoginPage` from static token inline styles to class-based Tailwind token usage. Sidebar nav/user block, TopBar icon buttons, Ask Nova button, login inputs, gradient buttons, and persona-card hover states now use classes instead of DOM style mutation.
- Started Batch 2 list-page migration and completed `/capa` + `/audit-trail`: table shells, table headers, row hover, export buttons, KPI cards, domain badges, inline links, empty states, and metadata/diff cells now use class-based token styling.
- Removed old `onMouseEnter` / `onMouseLeave` style mutation from the migrated shell/list surfaces.

### Changed Files
- `src/components/shared/FilterControls.tsx`
- `src/components/shared/EmptyState.tsx`
- `src/components/layout/PageWrapper.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/EightDShell.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/nova/CapaListPage.tsx`
- `src/pages/nova/AuditTrailPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ passes (no errors).
- `npm run build` ✅ passes (1761 modules; existing chunk-size warning only).
- `npm run test:visual` ✅ passes (8/8 across desktop + mobile Chrome).
- Extra Playwright smoke for `/audit-trail` ✅ — authenticated route loads, heading/filter/table header are visible.
- Token scan on migrated `/capa` + `/audit-trail` ✅ only allowed arbitrary survivors remain (`--accent-soft`, `--accent-line`, `--line-*`, `--r-*`, transition vars).

### Notes
- Phase 3 is not finished. Remaining Batch 2 pages still need migration: `MyWorkPage`, `FindingsListPage`, and `DashboardPage`. Dashboard has many SVG/chart attributes that should be handled separately so dynamic chart styling is not over-converted.
- No token definition files were edited (`src/index.css`, `tailwind.config.ts`, `design_system/colors_and_type.css` untouched).

### Next Recommended Task
- Continue Phase 3 Batch 2: migrate `FindingsListPage` next because it shares the `/capa` table/filter patterns, then `MyWorkPage`, then split `DashboardPage` into shell/cards first and SVG chart attributes second.

---

## 2026-06-02, 03:13 PM — Shared themed badge primitives (Phase 2 of UI overhaul)

### Prompt
"Continue full migration" — proceed from the Phase 1 token foundation into consolidating the duplicated, drifting inline badges/pills into well-tokenized shadcn shared components (single source of truth), preserving the look.

### Completed
- Found the badge logic was copy-pasted with DRIFT across 6 pages: e.g. `SeverityBadge` rendered 3 different colour schemes (Minor=purple vs amber vs cyan), `StatusBadge` carried hand-written labels ("No CAPA"), and `ScorePill`/`TypePill` each had per-page variants — while 5 OTHER pages already imported the canonical shared components. Phase 2 makes all 11 pages share one tokenized set.
- Created `src/components/shared/TypePill.tsx` (the only missing primitive): shadcn `Badge variant="outline"` reading canonical tokens — `deviation→primary`, `audit→success`, `complaint→warning`, plus a `tone="neutral"` variant for the Similarity citation tag. Replaces 4 inline `TypePill`/`TypeBadge` copies.
- Added a `compact` prop to `src/components/shared/ScorePill.tsx`: renders just the animated number (no icon/label) so the dense CAPA-list and Linked-CAPA contexts keep their tight look while still flowing through the same token + count-up logic.
- Added `whitespace-nowrap` to the shadcn `Badge` base so pills never wrap inside narrow table columns (restores the old inline `white-space:nowrap`; fixed "Audit Finding" wrapping in the Type column).
- Migrated 6 pages to import the shared primitives and deleted their inline definitions + colour maps + helper fns (`SEVERITY_COLORS`/`STATUS_COLORS`/`TYPE_COLORS`, `statusColor`/`statusLabel`, etc.): CapaListPage, FindingDetailPage, FindingsListPage, MyWorkPage, ConsolidatedActionPlanPage, SimilarityExplorerPage.
- Net effect: ~12 duplicated badge/pill components removed; status labels normalized to the formatter output ("CAPA In Progress", "Pending CAPA"); severity now consistently Minor=cyan / Major=amber / Critical=red everywhere; trimmed the now-unused imports each page left behind.

### Changed Files
- `src/components/shared/TypePill.tsx` (added)
- `src/components/shared/ScorePill.tsx` (compact mode)
- `src/components/ui/badge.tsx` (whitespace-nowrap)
- `src/pages/nova/CapaListPage.tsx`
- `src/pages/nova/FindingDetailPage.tsx`
- `src/pages/nova/FindingsListPage.tsx`
- `src/pages/nova/MyWorkPage.tsx`
- `src/pages/nova/ConsolidatedActionPlanPage.tsx`
- `src/pages/nova/SimilarityExplorerPage.tsx`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ passes (no errors).
- `npm run build` ✅ passes (1761 modules).
- In-browser sweep on the dev server ✅ — My Work, CAPA list, Findings list, and Finding detail all render the shared badges correctly in BOTH dark and light themes (verified `--primary` = `275 61% 41%` and `--severity-minor` = `199 89% 48%` resolve under `.light`). Compact ScorePill shows the bare number; TypePill stays single-line.

### Notes
- The look is intentionally NORMALIZED, not pixel-frozen: the inline copies disagreed with each other, so consolidating onto the already-canonical shared look (used by 5 prior pages) is the "unify" half of "unify but keep the look."
- ScorePill `compact` keeps tables tight; the verbose "{n} · Audit Ready/Improve Score" default still serves hero/detail slots (e.g. D7 Sign-Off).

### Next Recommended Task
- Phase 3: migrate the remaining inline `style={{var(--…)}}` blocks across the ~33 pages to Tailwind/shadcn in batches (layout shell → lists → details → 8D steps), build-checking each batch. Then Phase 4: remove the alias bridge from `src/index.css` and final both-theme sweep.

---

## 2026-06-02, 02:49 PM — Unified design-token foundation (Phase 1 of UI overhaul)

### Prompt
"Aku pengen rombak ulang UI. UI sekarang ga acceptable. Coba deh kita pake 2 set of Font aja. Dan untuk warna, aku pengen kamu tokenize dengan benar, sama make sure pakai ShadCN yang udah well-tokenized juga. Fungsinya simple, aku pengen kemudahan nantinya untuk ubah2 warna dan font. Clientku ga suka sama UI-nya, jadi aku akan butuh utk bisa gonta ganti secepat dan semudah mungkin." (Decisions: Full shadcn rewrite · Unify but keep current look · Keep Plus Jakarta Sans + IBM Plex Mono.)

### Completed
- Collapsed the THREE drifting token systems (design_system color block, the inline `--bg-*/--fg-*/--accent` block, and the shadcn HSL block) into ONE canonical HSL palette in `src/index.css`: a dark `:root,.dark` block + a `.light` override block, authored as space-separated HSL (shadcn convention). A single edit now retints every shadcn component AND every hand-styled surface.
- Added a thin, theme-independent alias layer mapping legacy inline names (`--bg-0..4`, `--fg-1..4`, `--accent/-hover/-press`, `--success/--warning/--danger`, `--info`) onto canonical tokens via `hsl(var(--token))`. The 33 un-migrated pages keep rendering unchanged; this bridge gets removed page-by-page in later phases.
- Fixed the light/dark brand drift: light-mode primary, accent, and focus ring were Blue-700 while the brand is purple — all now resolve to the canonical purple in BOTH themes.
- Converted current hex values to HSL while preserving the existing look (verified in-browser, both themes).
- Wired the two fonts into Tailwind `fontFamily` (`sans` = Plus Jakarta Sans, `mono` = IBM Plex Mono) and added migration-ready Tailwind tokens (`void/elevated/field`, `foreground-secondary/tertiary/faint`, `border-subtle/strong`).
- Fixed fonts in `index.html`: removed the unused Inter `<link>` and added IBM Plex Mono — it was referenced by `--font-mono` but had NEVER been loaded (silently falling back to system mono). Both families now confirmed loaded.
- Stripped duplicate color + shadow tokens from `design_system/colors_and_type.css`; it now owns only type/spacing/radii/motion primitives + type-role classes.
- Removed dead `--tw-shadow-*` tokens (never referenced).

### Changed Files
- `src/index.css`
- `tailwind.config.ts`
- `index.html`
- `design_system/colors_and_type.css`
- `.claude/launch.json` (added — preview dev-server config)
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes (1760 modules; caught + fixed a CSS bug where a comment string contained `*/` and closed the comment early).
- Manual in-browser check on the running dev server ✅ — Login + My Work dashboard render correctly in BOTH dark and light; aliases resolve through the canonical palette; `document.fonts` confirms IBM Plex Mono (400/500/600) + Plus Jakarta Sans both loaded.

### Notes
- Default theme stays dark (`getInitialTheme()` → dark, applied pre-paint in `main.tsx`), so keeping `:root,.dark` as the canonical default is flash-safe.
- Semantic data tokens (`--severity-*`, `--status-*`, `--chart-*`, `--nova`) were intentionally left at their current values to preserve data semantics; only brand/surface/text/border tokens were unified.
- To retheme now: edit ONLY the two canonical blocks at the top of `src/index.css`.

### Next Recommended Task
- Phase 2: consolidate duplicated inline badges/pills/cards/selects into shadcn-based shared components under `src/components/shared/`.

---

## 2026-06-01, 11:28 AM — Findings filter card and table contrast polish

### Prompt
"Aku pengen semua bagian filter diseragamin. inputan dimasukin ke dalam sebuah card dulu... belum di /findings. Next aku pengen header table tuh warnanya ga nyaru sama background... background warna inputan tuh jujur ga suka aku warnanya di light mode"

### Completed
- Matched `/findings` filter layout to `/capa`: filters now sit inside a raised `--bg-2` card with `--line-2` border, `--shadow-sm`, and responsive grid spacing.
- Added design tokens for cleaner form/table treatment: `--field-bg`, `--field-bg-hover`, and `--table-head-bg`.
- Updated global native inputs/selects plus shadcn `Input`/`SelectTrigger` to use the new field background tokens. Light mode fields are now a cleaner near-white surface instead of the previous gray-blue fill.
- Updated `/capa` and `/findings` native search/select fields to use `--field-bg`.
- Strengthened `/capa` and `/findings` table headers with a dedicated `--table-head-bg`, stronger bottom divider, and `--fg-2` header labels so the header band no longer blends into the page/card background.
- Added Playwright visual coverage for `/capa` and `/findings` list pages across desktop and mobile; added a short settle wait so screenshots happen after page reveal animation.
- Fixed responsive overflow in `/capa` and `/findings` filter grids after mobile screenshots showed the filters forcing page-wide horizontal overflow.

### Validation
- `npm run test:visual` ✅ passes (6/6).
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.

---

## 2026-06-01, 11:18 AM — Playwright visual smoke setup

### Prompt
"install aja playwright biar bisa confirm lebih baik"

### Completed
- Installed `@playwright/test` as a dev dependency and added `npm run test:visual`.
- Added `playwright.config.ts` configured to use system Chrome at `/usr/bin/google-chrome`, because Playwright browser download does not support this environment's `ubuntu26.04-x64` target.
- Added visual smoke coverage for Dashboard and CAPA Detail across desktop Chrome and mobile Chrome, including screenshot artifacts.
- Fixed a semantic heading issue caught by Playwright: TopBar page title no longer renders as a competing heading beside each page's real `<h1>`.
- Adjusted compact navigation from fixed-bottom overlay to a sticky horizontal rail below TopBar after visual screenshot showed it covering chart content.
- Ignored Playwright output folders (`playwright-report`, `test-results`) in `.gitignore`.

### Validation
- `npm run test:visual` ✅ passes (4/4).
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.

### Notes
- `npx playwright install chromium` failed with `Playwright does not support chromium on ubuntu26.04-x64`; the configured workaround is system Chrome. Override with `PLAYWRIGHT_CHROME_PATH=/path/to/chrome npm run test:visual` if needed.

---

## 2026-06-01, 11:13 AM — P1 responsive nav and empty state sweep

### Prompt
"lanjutin lagi"

### Completed
- Added a compact fixed-bottom navigation for tablet/mobile (`< xl`) so primary app navigation remains available when the desktop sidebar is hidden.
- Moved main content padding into `.app-main` and added mobile bottom safe-area spacing so the compact nav does not cover page content.
- Made the TopBar notification bell navigate to `/notifications` instead of being a labelled-but-inert button.
- Upgraded the shared `EmptyState` component to use the design-system surface tokens, `surface-card`, `btn-brand`, and polite status announcement.
- Replaced ad-hoc empty states with the shared `EmptyState` in Notifications, CAPA list, Findings list, Audit Trail, and Similarity Explorer.
- Started responsive grid reflow on high-impact views: Dashboard KPI/chart rows, Consolidated Action Plan KPI/group selector, Similarity filters/results, and Finding Detail body now use `auto-fit/minmax` instead of fixed desktop columns.

### Validation
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.
- Playwright visual screenshot was not run because Playwright is not installed in this repo.

### Notes
- Remaining P1: continue responsive reflow through the 8D form grids and CAPA detail hub, then extract more shared primitives if we want to reduce inline-style drift further.

---

## 2026-06-01, 11:09 AM — P1 audit pass: legacy cleanup, form a11y, motion copy

### Prompt
"cek UI_UX_AUDIT.md dan DESIGN_DEPTH_AUDIT.md. P0 udah dikerjain claude, next kerjain yang P1"

### Completed
- Removed the verified-dead legacy app cluster: 19 old top-level pages, 26 old root components, plus the unused legacy `components/capa/CapaSidebar.tsx`. Router/live Nova pages remain unchanged.
- TopBar P1 polish: stronger sticky separation (`--line-2` + `--shadow-sm`), `aria-label`s for icon buttons, decorative icons hidden from AT, and ellipsis copy fixed.
- LoginPage form a11y: associated labels with inputs, added `name`/`autoComplete`, replaced password-dot placeholder, added `--shadow-lg`, and aligned the mono divider tracking to the eyebrow/kicker spec.
- Motion/copy cleanup: removed the remaining `transition: all` spots found in the live tree and replaced loading `...` with `…` in Nova search/clustering/chat/loading states.
- Notification Center a11y: added settings expanded state, tab pressed state, search label, list live region, and labels for icon-only notification actions.
- Depth/token cleanup: upgraded `.surface-card` edge from `--line-1` to `--line-2` and added default tabular numeric rendering for tables/time/mono contexts.

### Validation
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.
- Targeted grep confirms no remaining live-tree matches for `transition: all` or the old loading-copy strings covered in this pass.

### Notes
- P1 items still intentionally deferred: full responsive reflow/sub-xl nav, EmptyState standardization across every view, and deeper shared primitive extraction.

---

## 2026-06-01, 11:00 AM — P0 fixes from UI/UX audit (depth, focus, a11y, dialogs)

### Prompt
"Boleh tolong handle ya sekaliann" → scope confirmed via question: "P0 dulu" — commit the 2 audit docs, then execute all P0: depth (card shadows + sidebar bg-0), focus ring buttons/links, keyboard access table rows, and dialog semantics for modals.

### Completed
- Committed `docs/UI_UX_AUDIT.md` + `docs/DESIGN_DEPTH_AUDIT.md` to main (commit `7ef8ca4`).
- **Depth (global):** added `.surface-card` / `.surface-raised` / `.surface-overlay` utility classes (bg-2 + sm/md/lg shadow) to `index.css`; moved Sidebar onto `--bg-0` with a `--line-2` right border so it reads as a distinct trough behind the page.
- **Depth (cards):** applied `boxShadow: var(--shadow-sm)` to primary card/panel containers across Dashboard, My Work, All CAPAs (filter + table), Findings list (table) + slide-over, CAPA Detail (Card/info/score primitives), Consolidated Action Plan (KPI/group-mode/group cards), Audit Trail (KPI/filter/table), Finding Detail (section/stat/Nova cards), CAPA Intake wizard, Similarity Explorer (search/filter/result cards, with hover bump to `--shadow-md`), and the 8D step pages D2/D4/D5/D6/D7. Recessive info banners were intentionally left flat.
- **Focus ring (a11y):** added a keyboard-only `:focus-visible` ring (`outline: 2px solid var(--accent)` + offset) for `button`, `a`, `summary`, `[role="button"|"link"|"tab"|"menuitem"|"option"]`, and `[tabindex]` — closing the gap where only form inputs had a visible focus state.
- **Keyboard access (a11y):** clickable `<tr>` rows in Findings list and All CAPAs now have `role`, `tabIndex={0}`, `aria-label`, and Enter/Space `onKeyDown` handlers.
- **Dialog semantics (a11y):** added shared `useDialog` hook (Escape close, focus-trap, focus restore, body-scroll lock) and wired it into the D7 e-signature modal, Similarity detail modal, Findings slide-over, Nova chat panel, and Citation detail panel — each now carries `role="dialog"`, `aria-modal`, `aria-labelledby`/`aria-label`, `overscroll-behavior: contain`, and an overlay shadow. Fixed a buggy `useState`-based Escape handler in Similarity. Added `aria-label`s to the Nova/Citation close buttons and `aria-live="polite"` to the Nova message list.

### Validation
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes (767 kB bundle, existing chunk-size warning only).

### Files Touched
- `src/hooks/use-dialog.ts` (new)
- `src/index.css`
- `src/components/layout/Sidebar.tsx`
- `src/components/nova/NovaChatPanel.tsx`, `src/components/nova/CitationDetailPanel.tsx`
- `src/pages/nova/DashboardPage.tsx`, `MyWorkPage.tsx`, `CapaListPage.tsx`, `FindingsListPage.tsx`, `CapaDetailPage.tsx`, `ConsolidatedActionPlanPage.tsx`, `AuditTrailPage.tsx`, `FindingDetailPage.tsx`, `CapaIntakePage.tsx`, `SimilarityExplorerPage.tsx`
- `src/pages/nova/eight-d/D2ContainmentPage.tsx`, `D4CorrectiveActionPage.tsx`, `D5PreventiveActionPage.tsx`, `D6VerificationPage.tsx`, `D7SignOffPage.tsx`
- `docs/UI_UX_AUDIT.md`, `docs/DESIGN_DEPTH_AUDIT.md`, `docs/BUILD_LOGS.md`

### Notes
- P1/P2 items remain deferred (dead-code deletion, remaining aria-labels, LoginPage form a11y, `transition: all`, tabular-nums/ellipsis, EmptyState adoption, responsive, shared primitives, Title Case, shadcn migration).

---

## 2026-06-01, 03:05 AM — Login page + auth guard + persona picker + logout

### Prompt
"Tolong tambahin halaman login sederhana. Di halaman login tersebut, tetep munculin inputan email/password, tapi di bawahnya tambahin card helper gitu yang isinya 5 personas kita. Karena ini buat demo, user tinggal milih aja mau login as persona yg mana. Make sure juga si persona ini ke-save di localstorage, dan punya functionality untuk logout ya."

### Completed
- Created `useAuthStore` (Zustand + persist, localStorage key `capa-ai-auth`) with `isLoggedIn`, `login(personaId)`, and `logout()`. `login` switches persona via `usePersonaStore`, `logout` resets persona to default.
- Created `LoginPage.tsx`: full-screen branded page with email/password form (submit defaults to qa_deviation for demo) and 5 interactive persona cards (avatar, name, role, arrow, accent hover highlight per persona color). Footer notes it's a demo environment. Design-system inline styles throughout.
- Added `AuthGuard` component inside `App.tsx` wrapping `BrowserRouter` — renders `<LoginPage />` when not logged in, full app otherwise. `PageWrapper`/`NovaChatPanel`/`CitationDetailPanel` only mount when authenticated.
- Added `LogOut` icon button to sidebar user block (bottom-right of persona row). Hover turns danger-red; click calls `logout()` which clears auth state and shows login page.

### Validation
- `npx tsc --noEmit` ✅ passes.
- `npm run build` ✅ passes (764 kB bundle, existing chunk size warning only).

### Files Touched
- `src/store/useAuthStore.ts` (new)
- `src/pages/LoginPage.tsx` (new)
- `src/store/index.ts`
- `src/App.tsx`
- `src/components/layout/Sidebar.tsx`

---

## 2026-06-01, 03:10 AM — Findings Detail page rewrite

### Prompt
"Aku butuh ada halaman Findings Detail. Tolong buatkan ya. rancang dan langsung buatkan aja"

### Completed
- Rewrote `FindingDetailPage.tsx` (was shadcn `Button`/`Card`/`Separator` + shared badge components + `text-muted-foreground` utility classes) to the inline-style + design-system token approach, consistent with `FindingsListPage.tsx` and the rewritten 8D pages.
- Page layout: back link to `/findings`; header with eyebrow, mono finding ID, Type/Severity/Status badge row, short description, and gradient primary action (`Open linked CAPA` vs `Create CAPA with Nova`).
- 4-card stat strip (Type, Department, Reported, Linked CAPA).
- Two-column body — left: adaptive "Imported source data" grid per source variant (`Bizzmine` / `Q100+` / `Bizzmine-Complaint`) from `capa.preFill`, plus Nova classification block (accent border + Sparkles); right: Linked CAPA card (id, title, status, ScorePill, View CAPA), Finding summary, and Timeline (reported → linked → investigation → Audit Ready closure).
- Reused local badge/pill components (Severity/Status/Type/Score) matching the list page for visual parity; preserved store access (`findings` + `capas` matched via `linkedCapaId` or `findingId`) and `NotFound` fallback.

### Validation
- `npx tsc --noEmit` ✅ passes.
- Router named import `{ FindingDetailPage }` still resolves; route `/findings/:id` unchanged.

### Files Touched
- `src/pages/nova/FindingDetailPage.tsx`

---

## 2026-06-01, 02:29 AM — Nova Suggestion Discuss Flow

### Prompt
"Di Nova suggestion, hilangin tombol Edit First. Tombol Skip ilangin, tapi diganti dengan Discuss with Nova yang ngelempar ke Ask Nova tentang konteks yang ditekan. User tetap bisa masukin pertanyaannya. Di 5 Whys, setelah Use this suggestion show textnya apa."

### Completed
- Removed visible `Edit first` and `Skip` actions from Nova suggestion components.
- Added `Discuss with Nova` action to both `NovaSuggestionBlock` and `NovaBlock`.
- `Discuss with Nova` now opens the Ask Nova side panel with a suggestion context card and an editable prefilled draft question, so user can revise the question before sending.
- Extended `novaChatContext` with suggestion metadata: source, suggestion id, context label, suggestion text, and initial draft.
- Updated accepted suggestion state to show the applied text, so 5 Whys still displays the answer after `Use this suggestion`.

### Validation
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.
- Nova suggestion scan ✅ no visible `Edit first`, `Skip`, skipped state, or old skip handlers remain; `Discuss with Nova` and `Suggestion context` are present.

### Files Touched
- `src/components/nova/NovaSuggestionBlock.tsx`
- `src/components/nova/NovaBlock.tsx`
- `src/components/nova/NovaChatPanel.tsx`
- `src/store/useUIStore.ts`

---

## 2026-06-01, 02:17 AM — Soft-Gate 8D Continue Warnings

### Prompt
"Bikin aku tetep bisa continue ke step 8D selanjutnya, tapi kasih warning."

### Completed
- Changed D1-D3 Continue behavior from hard blocker to soft warning: incomplete problem statement, containment, or RCA now shows `toast.warning(...)` and still advances to the next 8D step.
- Changed D4-D5 Continue behavior so missing/incomplete action forms warn and still advance; valid draft actions are still added before advancing.
- Changed D6 Continue behavior so incomplete verification warns and still advances to D7; complete verification still saves evidence/result and score as before.
- Kept Save Draft / Add Action validation stricter, so manual save/add still protects data quality while workflow navigation stays flexible.

### Validation
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.
- Soft-gate scan ✅ D1-D6 Continue paths now use `toast.warning(...)` for incomplete steps.

### Files Touched
- `src/pages/nova/eight-d/D1ProblemPage.tsx`
- `src/pages/nova/eight-d/D2ContainmentPage.tsx`
- `src/pages/nova/eight-d/D3RCAPage.tsx`
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx`
- `src/pages/nova/eight-d/D5PreventiveActionPage.tsx`
- `src/pages/nova/eight-d/D6VerificationPage.tsx`

---

## 2026-06-01, 02:11 AM — CAPA Hub Editable Inline 8D Forms

### Prompt
"Aku bisa pindah-pindah 8D Progress, tapi saat ini nggak bisa ngisi 8D progress karena nggak ada inputannya. Cek lagi view-view 8D sebelumnya."

### Completed
- Reconnected the CAPA hub inline 8D Progress panel to the existing editable 8D step pages instead of the read-only summary cards.
- Added `EightDEmbedProvider` / `useEightDEmbed()` so the old 8D pages can render inside `/capa/{id}` without duplicating the standalone `EightDShell` sidebar.
- Preserved read-only summary mode for closed CAPAs, so the previous “finished CAPA” view still works when everything is done.
- Updated D1-D6 Continue actions: when embedded, they switch the local CAPA hub selected step instead of navigating to `/capa/{id}/8d/{step}`; standalone routes still navigate as before.
- Updated sign-off notification URLs to point back to `/capa/{id}`.

### Validation
- `npm run build` ✅ passes.
- `git diff --check` ✅ passes.
- CAPA detail smoke check ✅ `http://127.0.0.1:8081/capa/CAPA-2026-0341` returns `200 OK`.
- `npx tsc -p tsconfig.app.json --noEmit` ❌ still fails on existing strict-mode debt, especially nullable `capa` in the legacy 8D pages; no production build failure.

### Files Touched
- `src/components/layout/EightDShell.tsx`
- `src/pages/nova/CapaDetailPage.tsx`
- `src/pages/nova/eight-d/D1ProblemPage.tsx`
- `src/pages/nova/eight-d/D2ContainmentPage.tsx`
- `src/pages/nova/eight-d/D3RCAPage.tsx`
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx`
- `src/pages/nova/eight-d/D5PreventiveActionPage.tsx`
- `src/pages/nova/eight-d/D6VerificationPage.tsx`
- `src/pages/nova/eight-d/D7SignOffPage.tsx`

---

## 2026-06-01, 02:07 AM — Dark/Light Theme Toggle Foundation

### Prompt
"Siap jalan full untuk bikin toggle dark mode / light mode, toggle tersedia di sidebar sudut kiri bawah."

### Completed
- Added persistent theme initialization through `src/lib/theme.ts`, using fail-safe `localStorage` persistence with OS preference fallback.
- Replaced forced dark boot in `src/main.tsx` with `applyTheme(getInitialTheme())`, so the app can start in either `dark` or `light`.
- Added full direct design-system theme tokens for `.dark` and `.light` in `src/index.css`, covering backgrounds, foregrounds, borders, accent, semantics, glass, scrims, and shadows.
- Split shadcn/Tailwind HSL tokens into `--tw-*` names to avoid collisions with direct CSS tokens like `--accent`, `--success`, and `--warning`.
- Updated HSL-only usages to `--tw-*` so chart/confetti/status code keeps rendering valid colors.
- Added a bottom-left sidebar theme toggle with Sun/Moon icon styling and persistent switching.

### Validation
- `npm run build` ✅ passes.
- Dev server ✅ running at `http://127.0.0.1:8081/`; local HTTP smoke check returned `200 OK`.
- Theme scan ✅ no remaining forced `classList.add("dark")` boot path and no stale `hsl(var(--accent/success/warning/info))` usages.
- `npx tsc -p tsconfig.app.json --noEmit` ❌ still fails on existing strict-mode debt already logged earlier; no new errors from the theme/sidebar files.
- `npm run lint` ❌ still fails on existing lint debt (`any` usage, hook deps, fast-refresh warnings) across legacy/touched surfaces.

### Files Touched
- `src/lib/theme.ts`
- `src/main.tsx`
- `src/index.css`
- `tailwind.config.ts`
- `src/components/layout/Sidebar.tsx`
- `src/pages/QualityDashboard.tsx`
- `src/components/SimilarityChart.tsx`
- `src/components/PipelineCompletionCelebration.tsx`
- `src/components/DataQualityReport.tsx`

---

## 2026-06-01, 12:42 AM — CAPA Hub Overview Shortcut

### Prompt
"Di atas 8D Progress, tambahin tombol kecil Overview."

### Completed
- Added a small `Overview` button above the `8D Progress` list in the CAPA detail left rail.
- The button clears the inline selected 8D step and returns the right column to the original CAPA overview view without changing the URL.
- Added active styling when the overview is selected, matching the existing accent-soft/accent selected state.

### Validation
- `npm run build` ✅ passes.

### Files Touched
- `src/pages/nova/CapaDetailPage.tsx`

---

## 2026-06-01, 12:37 AM — CAPA Hub Inline 8D Step Views

### Prompt
"On `/capa/CAPA-2026-0341`, clicking 8D Progress entries should keep the URL on the CAPA hub and swap the right-side content area into each 8D view instead of navigating to `/capa/{id}/8d/{step}`."

### Completed
- Converted `CapaDetailPage` 8D Progress entries from route links into local in-page selectors.
- Added `selectedStep` state on the CAPA hub so the URL remains `/capa/{id}` while the right content column changes context.
- Added inline 8D step views for D1-D7 inside the existing right column: problem statement, containment, RCA, corrective actions, preventive actions, verification, and sign-off chain.
- Kept a CAPA Overview breadcrumb/back control inside the inline step view.
- Changed the overview "Continue working on D*" CTA to open the inline step view instead of routing away.

### Validation
- `npm run build` ✅ passes.
- `CapaDetailPage` scan ✅ no remaining `/8d/` route links or `window.location` navigation in the CAPA hub.
- `CapaDetailPage` visual-token scan ✅ clean for hardcoded hex, `rgba(...)`, black/white utility colors, zoom/bounce classes, and old motion names.
- `npx tsc -p tsconfig.app.json --noEmit` ❌ still fails on existing strict-mode debt already logged earlier.

### Files Touched
- `src/pages/nova/CapaDetailPage.tsx`

---

## 2026-06-01, 12:33 AM — Dashboard Dot, Findings Sheet, CAPA Detail Fixes

### Prompt
"Dashboard trend dots jadi hitam; Findings table sheet keluar dari main div bukan top layer; klik /capa/{id} dari /capa flashing; score breakdown di /capa/{id} harus kelihatan semua."

### Completed
- Fixed `FindingTrendChart` SVG token rendering by moving accent/grid/text colors into SVG `style` props, preventing chart dots/line from falling back to black.
- Portaled `FindingSlideOver` to `document.body` and raised its z-index so it behaves like the global Ask Nova sheet instead of being constrained by the animated main content container.
- Replaced CAPA row navigation from `window.location.href` to React Router `navigate()`, removing the full-page reload flash when opening `/capa/{id}` from `/capa`.
- Replaced the clickable/toast-only Quality Score block in `/capa/{id}` with a permanently visible full breakdown: total score, audit-ready state, four `/25` category bars, and score lift tips.

### Validation
- `npm run build` ✅ passes.
- Active routed surface visual-token scan ✅ still clean for hardcoded hex, `rgba(...)`, black/white utility colors, zoom/bounce classes, and old motion names.
- `npx tsc -p tsconfig.app.json --noEmit` ❌ still fails on existing strict-mode debt already logged earlier: nullable `capa` in 8D pages, legacy `ParticleBackground` canvas nullability, legacy unknown `error`, `NovaPlaceholderPage` route type, and `PersonaManagementPage` dialog props.
- Existing Vite dev server picked up HMR updates at `http://127.0.0.1:8081/`.

### Files Touched
- `src/pages/nova/DashboardPage.tsx`
- `src/pages/nova/FindingsListPage.tsx`
- `src/pages/nova/CapaListPage.tsx`
- `src/pages/nova/CapaDetailPage.tsx`

---

## 2026-06-01, 12:20 AM — All Active Views Visual Polish + shadcn Token Bridge

### Prompt
"Do a visual polish pass on ALL VIEWS: text colors, card borders, button states, heading tracking, no hardcoded hex, eyebrow/kicker labels. Also remap shadcn HSL variables to the design-system colors and add a gradient button override."

### Completed
- Remapped `.dark` shadcn HSL variables in `src/index.css` to the Lead.AI dark design-system palette and forced dark mode at boot in `src/main.tsx`.
- Added shared polish utilities: `.btn-brand`, `.lead-card`, `.lead-popover`, `.lead-overlay`, `.eyebrow`, `.kicker`, `.mono-label`, plus heading negative tracking.
- Updated shared shadcn primitives (`Button`, `Card`, `Input`, `Textarea`, `Select`, `Badge`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`, etc.) to use design-system tokens, `--grad-brand` primary buttons, `brightness(1.1)` hover, `scale(0.99)` active, and no zoom/bounce animation classes.
- Tokenized hardcoded active-view status colors across Nova pages and 8D pages; active routed surfaces now scan clean for hardcoded hex, `rgba(...)`, `bg-black/bg-white/text-white`, shadcn zoom classes, and old motion names.
- Normalized inline mono/uppercase label tracking in active Nova surfaces to `0.18em`.
- Removed the stale `jsx-a11y/no-autofocus` lint-disable comment and cleaned two empty-interface lint issues in shared UI helpers.

### Validation
- `npm run build` ✅ passes.
- Active routed surface scan ✅ no matches for hardcoded hex, `rgba(...)`, `bg-black/bg-white/text-white`, `zoom-in/zoom-out`, `animate-bounce`, `duration-[...]`, `ease-[...]`, `fadeInUp`, or `slideInRight`.
- Repo-wide hex scan only reports text IDs in legacy copy: `Audit Trail #99281`, `Audit Trail #99282`.
- `npx tsc -p tsconfig.app.json --noEmit` ❌ still fails on existing strict-mode debt: nullable `capa` in 8D pages, legacy `ParticleBackground` canvas nullability, legacy unknown `error`, `NovaPlaceholderPage` `To`, and `PersonaManagementPage` `ConfirmDialog` props.
- `npm run lint` ❌ still fails on existing lint debt, mostly `no-explicit-any` in legacy pages/components plus `CapaDetailPage`, with fast-refresh warnings.

### Files Touched
- `src/index.css`, `src/main.tsx`
- `src/components/ui/*` shared primitives
- `src/components/layout/*`, `src/components/nova/*`, `src/components/shared/*`
- Active Nova pages under `src/pages/nova/**`
- Small legacy static hex cleanup in `src/App.css`, `src/components/SplitOption.tsx`, `src/components/TutorialOverlay.tsx`, `src/pages/CapaDashboard.tsx`, `src/pages/QualityDashboard.tsx`

---

## 2026-05-31, 11:19 PM — D2, D4, D6, D7: Rewrite to EightDShell pattern

### Prompt
"Make sure all 8D workflow page looks good. Now, D1 and D3 is already good, But D2, D4, D6, and D7 still looking like the old layout"

### Completed
- **D2 ContainmentPage** — full rewrite. `EightDShell` (`activeStep="containment"`), `NovaSuggestionBlock` with containment suggestion + reasoning, native `<textarea>`/`<select>`/`<input type="date">` with accent focus glow, 4-check quality signals grid, containment score preview, Save Draft + Continue footer.
- **D4 CorrectiveActionPage** — full rewrite. `EightDShell` (`activeStep="ca"`), inline `ActionList` with Trash2 remove, `NovaSuggestionBlock`, full add-CA form (description, PIC, due date, linked root cause from D3 confirmed causes, verification method), 5-check quality signals grid, Add CA + Continue footer.
- **D6 VerificationPage** — full rewrite. `EightDShell` (`activeStep="verification"`), method select, result textarea, mock evidence input + Upload button with green confirmation chip, 3-column quality signals grid, Save Draft + Continue to Sign-Off footer.
- **D7 SignOffPage** — full rewrite. `EightDShell` (`activeStep="signoff"`), custom `ESignatureModal` (fixed overlay, blur backdrop — no shadcn Dialog), 3-column quality gate card, approval chain list with CheckCircle2/XCircle/Circle icons + timestamps, per-approver action buttons. `confetti()` retained on full closure.
- All four: zero `@/components/ui/*` imports, `npx tsc --noEmit` clean.

### Files Touched
- `src/pages/nova/eight-d/D2ContainmentPage.tsx` — full rewrite
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx` — full rewrite
- `src/pages/nova/eight-d/D6VerificationPage.tsx` — full rewrite
- `src/pages/nova/eight-d/D7SignOffPage.tsx` — full rewrite

---

## 2026-05-31, 11:16 PM — CapaListPage visual polish pass

### Prompt
"Do a visual polish pass on /capa: fix text colors, card borders, button states, heading letter-spacing, no hardcoded hex, eyebrow labels"

### Completed
- Replaced all shadcn imports with local inline-styled `SeverityBadge`, `StatusBadge`, `TypePill`, `ScorePill` components using CSS vars.
- h1: `letterSpacing: "-0.025em"`, `color: var(--fg-1)`.
- TH eyebrows: `--font-mono`, uppercase, `letterSpacing: "0.08em"`, `--fg-3`.
- New CAPA button: `--grad-brand` + `brightness(1.1)` hover.
- Open button: `--accent-soft` bg + `--accent` text.
- Overdue dates rendered in `--danger`.
- Row click navigates to CAPA hub.

### Files Touched
- `src/pages/nova/CapaListPage.tsx` — visual polish pass

---

## 2026-05-31, 11:11 PM — Section 19: Consolidated Action Plan page

### Prompt
"Oke lanjut dulu section 19 ya. make sure you didnt forgot @design_system/CLAUDE_CONTEXT.md for the context"

### Completed
- Full rewrite of `ConsolidatedActionPlanPage.tsx` (wireframe section 19). No shadcn.
- `ProgressBar` color-coded (≥80 success, ≥50 warning, <50 accent).
- `KindBadge` (CA = accent-soft/accent, PA = success tint), `StatusBadge` per `ActionStatus`.
- Group cards: header with progress bar + PIC list + count badge, then inline CA/PA table.
- AI Clustering button: `--grad-brand`, 2.2s mock delay, groups reorganize on completion.
- Footer link to All CAPAs.

### Files Touched
- `src/pages/nova/ConsolidatedActionPlanPage.tsx` — full rewrite

---

## 2026-05-31, 11:08 PM — Section 18: Similarity Explorer page

### Prompt
"make sure you didnt forgot @design_system/CLAUDE_CONTEXT.md for the context. oke. lanjut ke section 18 ya"

### Completed
- Full rewrite of `SimilarityExplorerPage.tsx` (wireframe section 18). No shadcn.
- Search card with grad-brand AI Search button + Loader2 spinner.
- Native range slider with `accentColor: "#A94DCC"` (intentional hex exception — CSS vars don't work in `accentColor` property).
- 2-col result cards: `OutcomeBadge`, `TypeBadge`, year badge.
- `DetailModal`: fixed centered overlay, blur backdrop, `fadeInUp` animation, accent left-border disclaimer. Outcome colors: Effective=success, Recurred=danger, Ongoing=blue.

### Files Touched
- `src/pages/nova/SimilarityExplorerPage.tsx` — full rewrite

---

## 2026-05-31, 11:03 PM — Section 17: Audit Trail page

### Prompt
"make sure you didnt forgot @design_system/CLAUDE_CONTEXT.md for the context. Terus bisa ga kita lanjut kerjakan revampnya? kerjakan halaman di section 17 itu"

### Completed
- Full rewrite of `AuditTrailPage.tsx` (wireframe section 17). No shadcn.
- `KpiCard`: `--bg-2`, `--r-lg`, mono metrics.
- `DomainBadge`: color-coded per domain (system=blue, ai_decision=accent, integration=success).
- `StyledSelect`: native `<select>` with appearance:none + SVG chevron.
- Filter bar: 6 dropdowns + search input with accent focus glow.
- Table: `--bg-3` header, mono uppercase TH, hover `--bg-3`, CAPA links in `--accent`.
- Nova metadata cell: `--accent-soft` background.
- Before/After diff: `--bg-4` code blocks.

### Files Touched
- `src/pages/nova/AuditTrailPage.tsx` — full rewrite

---

## 2026-05-31, 11:06 PM — Sidebar: add Management nav section

### Prompt
"make sure si sidebarnya di update untuk munculin navigations. soalnya sekarang cuma sisa 5."

### Completed
- Added `navManagement` group to `Sidebar.tsx` with 3 items: Action Plan (`/actions/consolidated`, ClipboardList), Similarity (`/similarity`, Search), Audit Trail (`/audit-trail`, ScrollText).
- New "Management" eyebrow section rendered between primary nav and System section.
- Updated `isActive()` helper: `/actions/consolidated` now matches all `/actions/*` routes.
- Total nav: 4 primary + 3 management + 2 system = 9 items.

### Files Touched
- `src/components/layout/Sidebar.tsx` — Management section added

---

## 2026-05-31, 10:52 PM — Wireframe: sections 17–19 + section 08 Actions tab

### Prompt
"gue tuh udah ngelakuin revamp lah ya soal layout di branch refactor/revamp-layout. Tapi... proses revampnya tuh ngilangin beberapa halaman... Lu tambahin dah tuh insighnya dalam bentuk wireframe, sesuai dengan yang ada di folder design_system/wireframe.html"

### Completed
- Analysed missing pages: Audit Trail, Similarity Explorer, Corrective Actions, Preventive Actions. Decided CA/PA merge into CAPA Hub Actions tab (user confirmed "Tab di CAPA Hub").
- Updated TOC in wireframe (sections 17–19 added).
- **Section 08 update** — new Actions tab showing CA+PA table inside CAPA Hub; callout explaining merge decision.
- **Section 17** — Global Audit Trail: KPI row (total events, Nova decisions, integrations, data corrections), filter bar, 7-column event table.
- **Section 18** — Similarity Explorer: search input, threshold slider, 2-col result card grid, detail modal with outcome + CA summary.
- **Section 19** — Consolidated Action Plan: KPI row, group mode selector, AI Clustering section, group cards with CA+PA sub-tables.

### Files Touched
- `design_system/wireframe.html` — sections 17–19 added, section 08 updated
- `docs/wireframe.html` — mirrored

---

## 2026-05-31, 06:10 PM — NovaBlock unified AI suggestion component + intakeHelpers fix

### Prompt
"make sure you didnt forgot @design_system/CLAUDE_CONTEXT.md for the context. Build the unified NovaBlock component used across all 8D step screens and the CAPA intake wizard. Wireframe: section 16."

### Completed
- **`src/utils/intakeHelpers.ts`** — new file, fixed broken import in `CapaIntakePage.tsx`. Exports `getSuggestedTitle`, `getPrefillSummary`, `computeIntakeScore`. Score function uses `computeProblemSpecificity` then estimates root cause depth, effectiveness, containment from gate answers.
- **`src/index.css`** — added `@keyframes spin` (required for `animation: "spin 1s linear infinite"` inline style; Tailwind's `animate-spin` class doesn't work with inline `animation` property).
- **`src/components/nova/NovaBlock.tsx`** — new canonical unified AI suggestion component (wireframe section 16). 4-state machine (`idle → editing → accepted → skipped`), confidence badge (≥85 success, ≥65 warning, <65 danger), loading skeleton with `animate-shimmer`, reasoning expand/collapse via `max-height` CSS transition, 380ms accept flash via `isFlashing`, primary button uses `--grad-brand`.

### Files Touched
- `src/utils/intakeHelpers.ts` — new file
- `src/index.css` — `@keyframes spin` added
- `src/components/nova/NovaBlock.tsx` — new file

---

## 2026-05-31, 12:59 PM — My Work / Inbox screen (Revamp Phase 1)

### Prompt
"Continue on this: Build the My Work / Inbox screen. Wireframe reference: section 03."

### Completed
- **My Work / Inbox page** (`src/pages/nova/MyWorkPage.tsx`) — fully persona-aware, 5 distinct views:
  - `initiator`: Findings from their area + CAPA tracking, no approval actions
  - `qa_deviation`: Full operational view — overdue/active/closed CAPAs
  - `head_of_dept`: Overdue escalations + active investigations + pending approval queue
  - `head_of_qa`: Approval queue (primary) + org-wide overdue + assigned CAPAs
  - `sme`: CAPAs needing RCA consultation + role explanation panel
- **4-stage CAPA lifecycle** model — visible on every card via `LifecyclePill`: Finding open → In progress → Pending approval → Closed
- **Badge system** — SeverityBadge (Major=danger, Minor=warning), StepBadge (D1–D7, accent), DueBadge (colour-coded by urgency), LifecyclePill (4-segment bar)
- **Router** updated: `/` → `MyWorkPage`, `/my-work` → redirect
- **CSS** — `.sidebar-nav-item` hover/active rules added to `index.css`

### Files Touched
- `src/pages/nova/MyWorkPage.tsx` — new file
- `src/router.tsx` — `/` route updated
- `src/index.css` — sidebar nav CSS

---

## 2026-05-31, 12:54 PM — App Shell (Sidebar + TopBar) (Revamp Phase 1)

### Prompt
"read @design_system/CLAUDE_CONTEXT.md first for the context then start revamp by doing this: Build the app shell component (sidebar + topbar)..."

### Completed
- **Sidebar rewrite** — 240px, `--bg-1`, logo-real.png, 5 nav items + system section, CSS-driven hover/active states, user block with gradient avatar, persona switcher.
- **TopBar rewrite** — 60px glass sticky, page title per route, search bar with ⌘K pill, bell badge with unread count, "Ask Nova" button, avatar.
- **PageWrapper** simplified.
- `src/assets/logo-real.png` copied from `design_system/assets`.

### Files Touched
- `src/components/layout/Sidebar.tsx` — full rewrite
- `src/components/layout/TopBar.tsx` — full rewrite
- `src/components/layout/PageWrapper.tsx` — simplified
- `src/assets/logo-real.png` — added

## 2026-05-31, 04:15 AM — Structural HTML Wireframe (Corrected)

### Completed
- **Rewrote `docs/wireframe.html`**: Grayscale structural wireframe document (1140 lines, single long-scroll HTML)
  - Follows kitchain-full-wireframes.html reference style: `.section` cards, `.wf-screen` layouts, `.box` placeholders, `.note`/`.callout` annotations, `.flow` diagrams
  - No JavaScript, no colors, no interactivity — pure structure & layout documentation
  - 16 sections covering all screens:
    - **Foundation**: 01 App Structure & Navigation (sitemap), 02 User Flow Diagrams (4 role-based flows)
    - **Core Screens**: 03 My Work/Inbox, 04 Dashboard, 05 Findings List + slide-over, 06 CAPA List, 07 ★ New CAPA Intake (4-step wizard)
    - **8D Workflow**: 08 ★ CAPA Hub, 09 ★ D1 Problem Statement, 10 D3 RCA (5-Whys + Similar CAPAs), 11 D4 Corrective Action, 12 D6 Verification, 13 D7 Sign-Off
    - **Supporting**: 14 Quality Score Breakdown, 15 Audit Trail, 16 Nova AI Unified Pattern
  - Yellow callout annotations explain key design decisions and changes from current app
  - ★-marked sections have the most detailed wireframes (highest-leverage screens)
- **Verified in browser**: All 16 sections render correctly at localhost:9999

## 2026-05-31, 03:28 AM — System Analysis, RFI Gap Analysis & Wireframe Spec

### Completed
- **Read entire RFI**: Bio Farma TOR 03710/TOR/02/2026 (76 pages) — understood AS-IS process, TO-BE architecture, all 30 system requirements, 3 implementation phases, deliverables, and timeline.
- **Live app screenshots**: Navigated running app at localhost:8080 and captured Dashboard, Findings List, CAPA List, CAPA Detail, New CAPA Intake, and D1 Problem Statement pages.
- **Created `docs/WIREFRAME_SPEC.md`**: Comprehensive 16-screen wireframe specification including:
  - Section 1: Plain-language explanation of CAPA/8D for non-industry readers
  - Section 2: Current app user flow documented screen-by-screen
  - Section 3: 9 identified UX problems (no sidebar nav, unclear Finding→CAPA relationship, redundant entry points, scattered Nova AI patterns, etc.)
  - Section 4: Full gap analysis — 13/30 req fully covered, 9/30 partial, 8/30 missing
  - Section 5: Recommended new architecture (persistent sidebar, My Work inbox, CAPA Hub with 8D left panel, unified Nova AI)
  - Section 6: Wireframe specs for 16 screens with layout, components, and interactions

## 2026-05-30, 06:04 PM — Infinite Loop Fix (Zustand Selector Stability)

### Completed
- **Root cause**: `getCAPAById` calls `attachActions` which does `{ ...capa, correctiveActions: [].filter(...) }` — returns a new object reference on every render, causing Zustand's `useSyncExternalStore` to think state changed → infinite re-render loop.
- **Fix applied to 8 files**: replaced `useCapaStore((state) => state.getCAPAById(id))` with stable selectors (`state.capas.find(...)`, `state.correctiveActions`, `state.preventiveActions`) + `useMemo` to derive the enriched CAPA only when underlying data changes.
- Added `useMemo` import to `D5PreventiveActionPage` and `D6VerificationPage` where it was missing.
- TSC clean.

### Files Touched
- `src/pages/nova/CapaDetailPage.tsx`
- `src/pages/nova/eight-d/D1ProblemPage.tsx`
- `src/pages/nova/eight-d/D2ContainmentPage.tsx`
- `src/pages/nova/eight-d/D3RCAPage.tsx`
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx`
- `src/pages/nova/eight-d/D5PreventiveActionPage.tsx`
- `src/pages/nova/eight-d/D6VerificationPage.tsx`
- `src/pages/nova/eight-d/D7SignOffPage.tsx`

---

## 2026-05-30, 5:45 PM — Nova Chat Quick Prompts + Intake Labels + Impact Rationale

### Completed
- **Nova Chat quick-prompt chips** — `NovaChatPanel` now shows clickable suggested prompts above the textarea when only the initial Nova message is visible. Chips disappear after the first user message. `getChatPrompts(step)` exported from `novaService.ts`.
- **Chat responses expanded** — `chat-responses.json` rewritten from 1 Q&A pair for 3 steps to 3 Q&A pairs for all 7 steps (problem, containment, rca, ca, pa, verification, signoff). Fuzzy matching added to `getChatResponse` so partial prompt text still matches scripted responses.
- **Start 8D Workflow label** — `CapaDetailPage` header CTA now shows "Start 8D Workflow" for brand-new CAPAs (`gateAnswers.length === 0`) and "Continue Workflow" for in-progress ones. Matches PLANS.md sections 18/19/20 click-by-click flows.
- **Submit button per-type labels** — `CapaIntakePage` submit button now uses `submitLabelByType` map: deviation → "Submit to QA", audit → "Submit to QA Compliance", complaint → "Submit to QA Complaint". Matches PLANS.md sections 18/19/20.
- **Impact rationale values** — Updated all 3 golden cases in `capa-cases.json` with PLANS.md-exact Nova rationale messages. Previous values were generic placeholders.
- TSC clean.

### Files Touched
- `src/components/nova/NovaChatPanel.tsx` — quick-prompt chips, Enter key shortcut, updated initial message
- `src/services/novaService.ts` — fuzzy matching in `getChatResponse`, new `getChatPrompts` export
- `src/mock-data/nova-scripts/chat-responses.json` — 3 Q&A pairs per step, all 7 steps, updated fallback
- `src/pages/nova/CapaDetailPage.tsx` — "Start 8D Workflow" vs "Continue Workflow" CTA
- `src/pages/nova/CapaIntakePage.tsx` — per-type submit button labels
- `src/mock-data/capa-cases.json` — PLANS.md-exact `impact.rationale` for CAPA-2026-0341, -0089, -0112

---

## 2026-05-30, 5:34 PM — Dead Import Cleanup + Final Gap Scan

### Completed
- **Removed dead `NovaPlaceholderPage` import** from `router.tsx` — imported but never used in any route.
- **Full PLANS.md gap scan complete** — all PLANS.md sections 1–28 reviewed. No remaining structural gaps found.
- TSC clean, `npm run build` passes.

### Files Touched
- `src/router.tsx` — removed unused `NovaPlaceholderPage` import

---

## 2026-05-30, 5:30 PM — TypeScript Strict + Guardrail Checkbox Cleanup

### Completed
- **`strict: true`** — enabled in `tsconfig.app.json`. TSC passes cleanly (zero errors).
- **TO_DOS.md bulk cleanup** — 22 guardrail/stability items checked off (sections 1.1 and 1.2), plus TypeScript item at line 178.
- **PLANS.md gap scan (sections 5.2, 21–28)** — all screen acceptance criteria verified as satisfied: CAPA Detail has DispositionCard, SimilarCases, Timeline, NovaSummary; Dashboard has all 5 charts + latest findings + CAPA alerts; AuditTrailPage, ConsolidatedActionPlanPage, PreventiveActionsPage, SimilarityExplorerPage, TopicsGroupingPage all fully implemented.

### Files Touched
- `tsconfig.app.json` — `strict: true`, removed redundant `noImplicitAny: false`
- `docs/TO_DOS.md` — 22 items checked off

---

## 2026-05-30, 5:25 PM — Remove CA/PA (PLANS.md Gap Resolution)

### Completed
- **`removeCA` / `removePA` store methods** — added to `CapaStore` interface and implementation in `useCapaStore.ts`. Each filters the respective array and requires no audit event (demo-level fidelity).
- **D4 remove button** — `ActionList` in `D4CorrectiveActionPage` now accepts `onRemove` prop; trash icon button per row calls `removeCA`, recalculates effectiveness score, and fires a toast. Satisfies PLANS.md §`/capa/:id/8d/ca` "add/edit/remove action".
- **D5 remove button** — same pattern in `D5PreventiveActionPage` with `removePA`.
- TSC clean.

### Files Touched
- `src/store/useCapaStore.ts` — `removeCA` and `removePA` added to interface + implementation
- `src/pages/nova/eight-d/D4CorrectiveActionPage.tsx` — Trash2 icon, `onRemove` prop, `handleRemoveCA`
- `src/pages/nova/eight-d/D5PreventiveActionPage.tsx` — Trash2 icon, `onRemove` prop, `handleRemovePA`

---

## 2026-05-30, 5:22 PM — TO_DOS.md Bulk Checkbox Cleanup + FindingsListPage Date Filter

### Completed
- **FindingsListPage date filter** — added date range Select (All Dates / Last 7/30/90 days / Last 12 months) as 6th filter column. Updated grid to `lg:grid-cols-[minmax(240px,1.4fr)_repeat(5,minmax(140px,1fr))]`. Filter hooks into `filteredFindings` useMemo via `isWithinRange()`.
- **Bulk TO_DOS.md checkbox cleanup** — 40+ items that were marked "Progress: X exists / Remaining: wire UI" but whose UIs were already fully built got checked off. Affected items across phases 3–16: persona switcher, golden case wiring, CAPA detail, RCA acceptance criteria, CA/PA/SignOff acceptance criteria, Nova chat panel, citation panel, export menu, slide-over panels, toasts, audit trail, notifications, global action lists.
- TSC clean, `npm run build` passes.

### Files Touched
- `src/pages/nova/FindingsListPage.tsx` — date range Select added
- `docs/TO_DOS.md` — 40+ items checked off

---

## 2026-05-30, 5:15 PM — PLANS.md Gap Resolution (Recurrence Trend, Score Hints, CAPA Quick View)

### Completed
- **Dashboard: Recurrence Trend chart** (PLANS section 5.2 — 5th required chart was missing). Added `recurrenceTrend` array to `dashboard-stats.json`, created `RecurrenceTrendChart.tsx` (Recharts LineChart with dashed red "Recurred" line and solid blue "New Findings" line + legend), added `RecurrenceTrendPoint` type to `types/dashboard.ts`, exported `getRecurrenceTrend()` from `dashboardService.ts`, and wired into `DashboardPage` after the root cause / heatmap row.
- **D1 Problem Statement: score-lift hints** (PLANS section 5.2 — "Nova inline tips +3 if you add date/shift"). Each failing check now shows a purple hint line with point gain (e.g. "+3 pts — add exact date, shift, or audit reference") so users know exactly how to improve their problem specificity score.
- **CAPA Quick View** (PLANS section 5.3 — "Hover/click from Findings List, preview CAPA status without navigating away"). Added `CapaQuickViewDialog` component inline in `FindingsListPage`. When a finding has a linked CAPA, the Action column now shows an "Quick View" button (eye icon) that opens a Dialog with: CAPA ID, status badge, score pill, current 8D step, type, title, and an "Open Full CAPA" button.
- TSC clean, `npm run build` passes.

### Files Touched
- `src/types/dashboard.ts` — added `RecurrenceTrendPoint` interface
- `src/mock-data/dashboard-stats.json` — added `recurrenceTrend` array (12 months)
- `src/mock-data/index.ts` — updated type cast and import
- `src/services/dashboardService.ts` — added `getRecurrenceTrend()`
- `src/components/charts/RecurrenceTrendChart.tsx` — new file
- `src/pages/nova/DashboardPage.tsx` — imported and rendered `RecurrenceTrendChart`
- `src/pages/nova/eight-d/D1ProblemPage.tsx` — added `hint` to each check, rendered hint when check fails
- `src/pages/nova/FindingsListPage.tsx` — added `CapaQuickViewDialog`, Quick View button per row
- `docs/TO_DOS.md` — checked off recurrence trend item

---

## 2026-05-30, 5:02 PM — Phase 18 & 19 Manual QA + Final Definition of Done

### Completed
- `npm run build` passed with no errors (1072 kB bundle, gzip 296 kB).
- `npx tsc --noEmit` passed — zero TypeScript errors.
- No `console.log`/`warn`/`error` calls found in any Nova page or component.
- No Bahasa Indonesia UI strings found in labels, buttons, or toast messages (names/departments exempt per spec).
- All 21 routes verified in `router.tsx` — every page component exists and exports correctly.
- Invalid route wildcard `path="*"` → `<NotFound />` confirmed.
- All 3 golden case IDs (DEV-2026-0341, AUD-2026-0089, CMP-2026-0112) present in `findings.json` and `capa-cases.json`.
- D7 score gating verified: `isAuditReady = capa.score.total >= 80`; `BlockerBanner` shown when score < 80; approval buttons disabled when `!isAuditReady`.
- `NovaChatPanel` and `CitationDetailPanel` confirmed as global overlays in `App.tsx`.
- Zustand store initializes from mock data via `structuredClone(initialCapaCases/Findings/etc.)`.
- `resetCAPAStore` confirmed in `TopBar.tsx` — Reset Demo Data button functional.
- All 8 nova-scripts and 3 prefill files present for golden cases.
- Phase 18 and Phase 19 checklists fully checked off in `TO_DOS.md`.

### Files Touched
- `docs/TO_DOS.md` — all Phase 18 and Phase 19 checklist items checked

---

## 2026-05-30, 4:42 PM — Phase 16 Polish

### Completed
- Added `animate-page-enter` CSS keyframe; applied to `<main>` in `PageWrapper` keyed by `location.pathname` — every route change fades in.
- Added `animate-shimmer` CSS keyframe for loading skeleton states.
- Added `animate-shake` CSS keyframe; applied to `BlockerBanner` — triggers on mount so blockers physically shake when they appear.
- Added CSS `confetti-particle` animation with `--spin`, `--fall`, `--duration` CSS vars.
- Created `src/utils/confetti.ts` — `fireConfetti()` spawns 72 colored particles from the viewport center.
- Wired `fireConfetti()` in `D7SignOffPage` when the last approver signs off and CAPA closes as Audit Ready.
- Added count-up animation to `ScorePill` using `requestAnimationFrame` ease-out — score animates from previous value to new value over 600ms.
- Fixed Bahasa Indonesia strings: "Analisis Topik" → "Analyze Topics" (button + empty state in `TopicsGroupingPage`), placeholder in `SimilarityExplorerPage`, "Notifikasi dikirim ke" → "Notification sent to" in `D7SignOffPage`.
- No console.log found in Nova/component/store/service files — legacy-only (not touched per lint baseline rule).
- Updated `TO_DOS.md` with Phase 16 completed items.

### Changed Files
- `src/index.css`
- `src/components/layout/PageWrapper.tsx`
- `src/components/shared/BlockerBanner.tsx`
- `src/components/shared/ScorePill.tsx`
- `src/utils/confetti.ts` (new)
- `src/pages/nova/eight-d/D7SignOffPage.tsx`
- `src/pages/nova/TopicsGroupingPage.tsx`
- `src/pages/nova/SimilarityExplorerPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed (existing bundle-size warning).
- `npm run lint` — baseline 34 errors / 16 warnings from legacy files only.

### Notes
- Phase 16 Polish is complete.
- NovaThinkingDots was already implemented in Phase 7; verified it's used in NovaChatPanel.
- Shimmer CSS class is available via `animate-shimmer`; can be applied to any loading skeleton in future.

### Next Recommended Task
- Manual QA Checklist (Phase 18).

---

## 2026-05-30, 4:15 PM  — Phase 15 Nova Chat, Citation Panel, Export Menu

### Completed
- Made NovaChatPanel a global overlay in App.tsx — no longer rendered per-page.
- Updated useUIStore.openNovaChat() to accept { capaId, step } context; NovaChatPanel reads context from store.
- Created CitationDetailPanel.tsx — slide-over showing similarity score, root cause, corrective action, outcome, year, and source type for a selected KG citation. Also rendered globally in App.tsx.
- Added Ask Nova button (opens NovaChatPanel with step context) to D1 Problem, D2 Containment, D3 RCA, D4 Corrective Action, D5 Preventive Action, and D7 Sign-Off.
- Removed locally-rendered NovaChatPanel from D6VerificationPage (now global).
- Added Export dropdown menu to CapaDetailPage: PDF, Word, Excel, JSON, Share Link, Send to Bizzmine — all mocked with toast.

### Changed Files
- src/store/useUIStore.ts
- src/components/nova/NovaChatPanel.tsx
- src/components/nova/CitationDetailPanel.tsx (new)
- src/App.tsx
- src/pages/nova/CapaDetailPage.tsx
- src/pages/nova/eight-d/D1ProblemPage.tsx
- src/pages/nova/eight-d/D2ContainmentPage.tsx
- src/pages/nova/eight-d/D3RCAPage.tsx
- src/pages/nova/eight-d/D4CorrectiveActionPage.tsx
- src/pages/nova/eight-d/D5PreventiveActionPage.tsx
- src/pages/nova/eight-d/D6VerificationPage.tsx
- src/pages/nova/eight-d/D7SignOffPage.tsx

### Validation
- npx tsc -p tsconfig.app.json --noEmit — passed.
- npm run build — passed (existing bundle-size warning).
- npm run lint — failed with baseline 34 errors / 16 warnings from legacy files.

### Notes
- Phase 15 Nova Chat and Slide-over Panels is now complete.
- Citation panel is wired via UIStore activeCitationId — pages can call openCitationPanel(capaId) to open it.

### Next Recommended Task
- Start Phase 16 Polish.

## 2026-05-30, 3:43 PM — Build Log Ordering Update

### Completed
- Reordered `BUILD_LOGS.md` so the newest work session appears at the top.
- Added the convention that future entries should be inserted starting on line 7, pushing older entries down.
- Normalized separators between entries for easier scanning by future AI agents.

### Changed Files
- `docs/BUILD_LOGS.md`

### Validation
- Documentation-only change; no build required.

### Notes
- The newest implementation entry before this formatting change is Phase 14.4 Notification Center.

### Next Recommended Task
- Start Phase 15 with Nova Chat Panel (global slide-over panel).

---

## 2026-05-30, 3:30 PM — Phase 14.4 Notification Center

### Completed
- Replaced `/notifications` placeholder with a real Notification Center page.
- Added notification list filtered by active persona from persisted `useNotificationStore`.
- Added tab filters for All, Unread, CAPA Updates, Approvals, Overdue, Rejected, and Closed.
- Added search across notification title, description, and CAPA ID.
- Added read/unread visual state with unread indicator dot and left border accent.
- Added Mark as Read per notification and Mark All as Read with toast feedback.
- Added mocked notification settings toggles panel (CAPA Updates, Approval Requests, Overdue Alerts, Closure Notifications, Email Digest, Desktop Notifications).
- Added CAPA links for each notification with navigation to related CAPA detail.
- Added summary stat cards for total, unread, approvals, and overdue counts.
- Added empty state for no notifications.
- Updated `TO_DOS.md` with completed Phase 14.4 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/NotificationCenterPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Notifications read from persisted `useNotificationStore`, so seed notifications and workflow-generated notifications are shown together.
- Settings toggles are purely visual/mocked — no real notification delivery exists.
- Phase 14 (Similarity, Topics, Audit Trail, Notifications) is now complete.

### Next Recommended Task
- Start Phase 15 with Nova Chat Panel (global slide-over panel).

---

## 2026-05-30, 3:24 PM — Phase 14.3 Global Audit Trail

### Completed
- Replaced the `/audit-trail` placeholder with a real global audit event table.
- Added filters for search, event domain, CAPA ID, finding ID, actor, and date window.
- Added domain badges for system, AI decision, integration, and clear labeling events.
- Added before/after field diffs, Nova model metadata, and clickable CAPA/finding references.
- Added mocked CSV/PDF export with toast feedback.
- Updated `TO_DOS.md` with completed Phase 14.3 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/AuditTrailPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Audit trail reads from persisted `useAuditTrailStore.events`, so seed events and workflow-generated events are shown together.

### Next Recommended Task
- Continue Phase 14 with Notification Center at `/notifications`.

---

## 2026-05-30, 2:44 PM — Topics Grouping

### Completed
- Replaced `/topics` placeholder with a real Topics Grouping page.
- Added Analisis Topik button with mocked 3s AI loading state.
- Added cluster cards from `topic-clusters.json`.
- Cards show cluster name, finding count, CAPA count, severity distribution, trend, risk level, summary, and related findings.
- Added linked related findings to `/findings/:id`.
- Added summary metrics for total findings, CAPA-linked findings, high-risk topics, and recurring clusters.
- Updated `TO_DOS.md` with completed Phase 14.2 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/TopicsGroupingPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- CAPA count is derived from related findings with `linkedCapaId` because topic clusters currently store finding IDs only.

### Next Recommended Task
- Continue Phase 14 with Global Audit Trail at `/audit-trail`.

---

## 2026-05-30, 2:41 PM — Similarity Explorer

### Completed
- Replaced `/similarity` placeholder with a real Similarity Analysis screen.
- Added search input with the `PLANS.md` prompt.
- Added AI Search button with mocked 2.5s loading state.
- Added historical CAPA similarity result cards.
- Cards show similarity score, root cause, year, outcome, source type, and corrective action.
- Added filters for minimum similarity, outcome, source type, and year.
- Added historical CAPA detail modal.
- Search accepts any text and falls back to relevant historical CAPA results if no direct text match is found.
- Updated `TO_DOS.md` with completed Phase 14.1 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/SimilarityExplorerPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Results come from `kg-citations.json`, with fallback ranking to keep arbitrary demo searches useful.

### Next Recommended Task
- Continue Phase 14 with Topics Grouping at `/topics`.

---

## 2026-05-30, 2:39 PM — Consolidated Action Plan

### Completed
- Replaced `/actions/consolidated` placeholder with a real management overview.
- Consolidates corrective and preventive actions into one grouped view.
- Added grouping by root cause cluster, department, and risk priority.
- Added mocked AI Clustering button with 2.5s loading state.
- Added grouped results with progress bars, action counts, PIC summary, CAPA links, and status badges.
- Added mocked Export Excel button with toast feedback.
- Updated `TO_DOS.md` with completed Phase 13.3 items.

### Changed Files
- `src/router.tsx`
- `src/pages/nova/ConsolidatedActionPlanPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Root cause clusters and risk priority are derived locally from existing CAPA/action data because no dedicated clustering result model exists yet.
- Phase 13 Global Action Screens is now completed.

### Next Recommended Task
- Start Phase 14 with Similarity Explorer at `/similarity`.

---

## 2026-05-30, 2:36 PM — Global Preventive Action List

### Completed
- Replaced `/actions/preventive` placeholder with a real global preventive action table.
- Added search across PA ID, CAPA ID, description, PIC, department, and CAPA title.
- Added filters for status, PIC, department, and target date.
- Added CAPA links for each preventive action row.
- Added recurrence indicator badges: Monitoring, Recurrence Risk, and No Recurrence.
- Added overdue badge for open/in-progress actions past target date.
- Added Mark Completed action with toast feedback.
- Added persisted PA status update method to `useCapaStore`.
- Shows workflow-added PA records because the page reads the same persisted preventive action store.
- Updated `TO_DOS.md` with completed Phase 13.2 items.

### Changed Files
- `src/router.tsx`
- `src/store/useCapaStore.ts`
- `src/pages/nova/PreventiveActionsPage.tsx`
- `docs/TO_DOS.md`
- `docs/BUILD_LOGS.md`

### Validation
- `npx tsc -p tsconfig.app.json --noEmit` — passed.
- `npm run build` — passed with the existing bundle-size warning.
- `npm run lint` — failed with 34 errors and 16 warnings from existing legacy/template files.

### Notes
- Recurrence indicator is derived from action status, target date, and CAPA closure state because the current mock model has no dedicated recurrence-failure field.

### Next Recommended Task
- Continue Phase 13 with `/actions/consolidated`.

---

## 2026-05-30, 2:27 PM — Global Corrective Action List

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

---

## 2026-05-30, 2:23 PM — 8D D7 Sign-Off

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

---

## 2026-05-30, 2:20 PM — 8D D6 Verification

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

---

## 2026-05-30, 2:18 PM — 8D D5 Preventive Action

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

---

## 2026-05-30, 2:15 PM — 8D D4 Corrective Action

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

---

## 2026-05-30, 2:12 PM — 8D D3 Root Cause Analysis

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

---

## 2026-05-30, 2:03 PM — 8D D2 Containment

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

---

## 2026-05-30, 1:38 PM — 8D D1 Problem Statement

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

---

## 2026-05-30, 1:35 PM — CAPA List and Detail

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

---

## 2026-05-30, 1:28 PM — CAPA Intake Flow

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

---

## 2026-05-30, 1:25 PM — Findings List and Detail Flow

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

---

## 2026-05-30, 1:21 PM — Shared Layout, Nova Components, and Dashboard

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

---

## 2026-05-30, 1:15 PM — Services and Zustand Persistence

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

---

## 2026-05-30, 1:07 PM — Mock Data and Utility Foundation

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

---

## 2026-05-30, 12:55 PM — Nova Foundation Routing and Domain Types

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

---

## 2026-05-30, 12:45 PM — Existing Project Audit

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
