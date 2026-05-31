# Lead.AI Design System — Claude Code Context

> Paste this at the start of every Claude Code session:
> "Read design-system/CLAUDE_CONTEXT.md to orient yourself for this session."

---

## What we're building

**CAPA AI** — pharma QA compliance app. Core user: QA Analyst (daily 8D CAPA workflow) + QA Manager (monitoring, sign-off). The app has a persistent sidebar, a CAPA Hub with 8D progress panel, and a unified Nova AI assistant embedded inline in all step screens.

Key screens (see wireframe.html for full layouts):
- App Shell: persistent sidebar (240px) + sticky glass topbar
- My Work / Inbox: urgency-sorted CAPA list, default landing
- Dashboard: KPI cards + charts + department heatmap
- Findings List: table + slide-over detail
- CAPA List: all CAPAs, filter tabs, 8D step column
- New CAPA Intake: 4-step progressive wizard
- CAPA Hub ★: overview + persistent 8D progress panel (left)
- 8D Step screens (D1–D7) ★: 3-zone layout (progress + form + Nova inline)
- Nova AI component ★: reusable inline suggestion block

---

## Design system rules — do not deviate

Read the full system from: `design-system/README.md` and `design-system/colors_and_type.css`

### Non-negotiables

**Colors**
- All backgrounds: CSS vars `--bg-0` through `--bg-4` (near-black layered)
- Primary text: `--fg-1` (#F3F5F7). Secondary: `--fg-2`. Captions/mono: `--fg-3`
- Brand accent: `--grad-brand` = `linear-gradient(135deg, #9B3AC5, #C4688C, #E07D60)`
- Primary buttons: `background: var(--grad-brand)`, `color: var(--on-accent)`
- Interactive accent (links, active states, focus): `--accent` = `#A94DCC`
- No pure white. No pure black. No hardcoded hex colors.

**Typography**
- All UI: Plus Jakarta Sans (`--font-sans`), self-hosted in `fonts/`
- Eyebrows / metrics / code / identifiers: IBM Plex Mono (`--font-mono`)
- Headings: font-weight 600 (semibold), letter-spacing -0.02em to -0.035em
- Copy casing: sentence case everywhere. No ALL CAPS except eyebrow/kicker labels.

**Components**
- Cards: `background: var(--bg-2)`, `border: 1px solid var(--line-2)`, `border-radius: var(--r-lg)`
- Inputs: `background: var(--bg-4)`, `border: 1px solid var(--line-2)`, `border-radius: var(--r-sm)`
- Focus state: `border-color: var(--accent)`, `box-shadow: 0 0 0 3px var(--accent-soft)`
- Glass cards (over imagery): `background: rgba(255,255,255,0.07)`, `backdrop-filter: blur(22px)`
- Icons: Lucide, 1.75px stroke, 16–24px size, `currentColor`

**Motion**
- Reveals: `opacity 0→1` + `translateY(12px→0)`, 500–800ms, `cubic-bezier(0.22,1,0.36,1)`
- Hover: 180ms (`--dur-fast`). No bounce. No spring physics.
- Slide-overs: `translateX(100%→0)`, 380ms, same easing

**Content voice**
- Sentence case. No emoji. No exclamation marks.
- Calm, declarative, expert. Short sentences.
- Eyebrow labels: MONO FONT · UPPERCASE · WIDE TRACKED · `--fg-3`

---

## Reference files

| File | Purpose |
|---|---|
| `design-system/README.md` | Full brand context, visual foundations, content rules |
| `design-system/colors_and_type.css` | All CSS vars: color, type, spacing, radii, shadow, motion |
| `design-system/wireframe.html` | UX wireframes for all 16 screens — layouts are authoritative |
| `design-system/ui_kits/platform/kit.css` | Utility classes: `.glass`, `.glow-field`, `.btn-*`, `.grad-text` |
| `design-system/ui_kits/platform/Console.jsx` | Reference: sidebar, topbar, metric cards, data table |
| `design-system/ui_kits/platform/Marketing.jsx` | Reference: glass cards, media wells, reveal animations |
| `design-system/assets/logo-real.png` | Brand logo — use at 26–28px height in nav |
| `design-system/fonts/` | Self-hosted Plus Jakarta Sans (variable + static weights) |

---

## Quick token reference

```css
/* Most-used */
--bg-1: #0A0C0F;   --bg-2: #101318;   --bg-3: #161A20;   --bg-4: #1D222A;
--fg-1: #F3F5F7;   --fg-2: #A2A9B4;   --fg-3: #6A7280;
--line-1: rgba(255,255,255,0.07);
--line-2: rgba(255,255,255,0.11);
--line-3: rgba(255,255,255,0.18);
--accent: #A94DCC;
--accent-soft: rgba(169,77,204,0.13);
--grad-brand: linear-gradient(135deg, #9B3AC5, #C4688C, #E07D60);
--r-sm: 10px;   --r-md: 14px;   --r-lg: 20px;   --r-xl: 28px;
--success: #3FB984;   --warning: #E0A33E;   --danger: #E5575C;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
```
