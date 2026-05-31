# LEAD AI — Platform UI Kit

High-fidelity recreation of the **LEAD AI** product, an original interpretation of the brand's Design DNA (dark, premium AI-infrastructure aesthetic). Two surfaces in one interactive prototype.

## Run
Open `index.html`. It boots on the **marketing site**; "Open console" / "Sign in" switches to the **product console**. "Exit" in the console returns to the site.

## Surfaces
1. **Marketing site** (`Marketing.jsx`) — sticky glass nav, hero with animated gradient glow + proof metrics, customer logo strip, 6-up feature grid, glowing CTA, footer. Scroll-reveal on `opacity + translateY`.
2. **Product console** (`Console.jsx`) — app shell with sidebar nav + plan widget, glass topbar with search / deploy / notifications / avatar, an **Overview** dashboard (metric cards, p99 latency area chart, active-deployments table with status pills), a deploy modal, and structural placeholders for the other nav sections.

## Files
| File | Contents |
|---|---|
| `index.html` | Entry — loads React/Babel, mounts `<App>`, toggles site ↔ console |
| `kit.css` | Kit-local styles: buttons, glow field, reveal, cards |
| `icons.jsx` | `window.Icons` — Lucide-style 1.75px stroke icon set |
| `Marketing.jsx` | `MarketingSite`, nav/hero/proof/features/CTA/footer |
| `Console.jsx` | `Console`, sidebar/topbar/metrics/chart/table/modal |

Foundations (color, type, spacing, motion) come from the root `colors_and_type.css`; fonts from root `fonts/`; logos from root `assets/`.

## Notes
- Cosmetic recreation — no real data or routing. Charts/tables are illustrative.
- Components export to `window` for cross-file sharing under Babel.
- Built from the Design DNA brief only (no source codebase/Figma). Logos are proposed and flagged for replacement.
