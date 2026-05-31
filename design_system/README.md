# LEAD AI — Design System

> Serious, intelligent, precise, trustworthy. This is the visual and verbal language for **LEAD AI** — an AI-infrastructure product, not a generic productivity SaaS.

---

## What LEAD AI is

LEAD AI presents as **enterprise-grade AI infrastructure**: research-backed, reliable, calm, and high-trust. The interface should read like serious tooling that mission-critical teams depend on — closer to an observability/data platform than a colorful consumer dashboard.

The visual tone communicates **reliability, clarity, and operational confidence**. The system is *futuristic but restrained*: dark, minimal, editorial typography, abstract gradient accents used sparingly, and slow confident motion.

### Personality keywords
Reliable · Intelligent · Calm · Enterprise-grade · Research-backed · High-trust · Minimal · Futuristic but restrained

### Explicitly avoid
- Playful SaaS aesthetics, cartoon illustrations, mascots
- Overly colorful dashboards / rainbow data viz
- Bouncy, springy, or attention-seeking animation
- Bluish-purple "AI startup" gradients as a crutch; emoji décor

---

## Sources & provenance

This system was built from a **written Design DNA brief** plus the brand typeface. No production codebase or Figma file was provided, so the UI kit and components below are an **original interpretation** of the stated direction (dark premium AI-infrastructure interface), not a recreation of an existing product.

| Source | Provided | Notes |
|---|---|---|
| Design DNA brief | ✅ | Personality, visual direction, motion DNA |
| Brand typeface | ✅ | `Plus_Jakarta_Sans.zip` → self-hosted in `fonts/` |
| Codebase | ❌ | None — components are an original interpretation |
| Figma | ❌ | None |
| Logo / brand assets | ❌ | Wordmark + mark generated as part of this system (see `assets/`) — **flagged for review** |

> ⚠️ **Because no logo was supplied, the wordmark/mark in `assets/` are a proposed interpretation.** Replace with official brand assets when available.

---

## Index / manifest

| File / folder | What's in it |
|---|---|
| `README.md` | This file — context, content & visual foundations, iconography |
| `colors_and_type.css` | All CSS custom properties: color, type roles, spacing, radii, shadows, motion |
| `SKILL.md` | Agent Skill front-matter for use in Claude Code |
| `fonts/` | Plus Jakarta Sans (variable + static weights), OFL license |
| `assets/` | Logo wordmark + mark (SVG); `media/` — `stock-*` (Unsplash placeholders) + `abstract-*` (on-brand defaults) |
| `preview/` | Design System tab cards (color, type, spacing, components, glass, media) |
| `ui_kits/platform/` | UI kit: the LEAD AI console (marketing hero + product app) |

---

## CONTENT FUNDAMENTALS

**Voice:** Calm, declarative, expert. LEAD AI speaks like a senior systems engineer who is certain but never loud. Sentences are short and load-bearing. No hype words ("revolutionary", "magical", "supercharge"), no exclamation points.

**Person:** Address the customer as **you**; refer to the product as **LEAD AI** or **the platform** (third person). Avoid "we" in product UI; reserve "we" for marketing/about copy.

**Casing:** Sentence case everywhere — headings, buttons, menu items, labels. Reserve ALL-CAPS for the **mono eyebrow/kicker** label only (e.g. `INFRASTRUCTURE`, `99.99% UPTIME`), tracked wide. Never Title Case UI strings.

**Tone in numbers:** Lead with evidence. Proof-driven sections cite concrete, specific metrics (latency in ms, uptime %, throughput) rather than vague superlatives. Numbers are set in tabular figures.

**Punctuation & symbols:** No emoji, anywhere. Use the mono font for identifiers, versions, latencies, and code-like tokens. Em dashes for asides. Avoid Oxford-comma-heavy marketing run-ons.

**Examples**
- Eyebrow: `RESEARCH-BACKED` · `SOC 2 TYPE II`
- Hero: "Intelligence you can operate." / "Run AI you can trust in production."
- Sub: "LEAD AI gives engineering teams the infrastructure to deploy, observe, and govern models at scale."
- Button: "Start a deployment" · "Read the architecture" · "Talk to engineering"
- Empty state: "No models deployed yet. Connect a registry to begin."
- Metric caption: "p99 latency, last 30 days"

**Don't write:** "🚀 Supercharge your workflow!" · "The magical AI platform!" · "Sign Up Now!"
**Do write:** "Deploy in minutes. Observe everything. Govern with confidence."

---

## VISUAL FOUNDATIONS

**Overall:** A dark premium interface. Sparse, confident layouts with generous negative space. High contrast between near-white text and a cool near-black ground. Restraint is the brand — one accent color, used as signal.

**Color.** Cool near-black backgrounds layered by elevation (`--bg-0` void → `--bg-4` input). Primary text is near-white (`#F3F5F7`, never pure white). Secondary copy is muted gray (`--fg-2`), tertiary fainter still. A single **electric azure** accent (`#4D86F7`) is the trust/signal color — used for primary actions, focus, active states, and as the seed of abstract glows. Semantic colors (success/warning/danger) are desaturated to sit calmly on dark. Never introduce a second bright hue as decoration.

**Type.** Plus Jakarta Sans for everything structural — large editorial headings set tight (negative tracking, `-0.02` to `-0.035em`), semibold (600) for headings, regular (400) for body. **IBM Plex Mono** is the infrastructure signature: used for eyebrows/kickers (uppercase, wide-tracked), identifiers, versions, latencies, and metric captions. The mono/sans pairing is the core typographic move.

**Spacing.** 4px base scale. Layouts breathe — section padding is large (`--sp-9`/`--sp-10`), component padding moderate. Density is low; whitespace signals confidence.

**Backgrounds.** Flat near-black is the default. Accent visuals are **abstract gradient glows** — soft radial blooms of azure/cyan at low opacity, heavily blurred, placed behind hero content or off-canvas edges. Never busy patterns, never photographic hero images as a rule. Optional very-fine grid or noise texture at <4% opacity for depth. Gradients are atmosphere, not surface fills.

**Borders.** Hairline, low-contrast: `rgba(255,255,255,0.07–0.18)`. Borders define cards and inputs more than shadows do. A subtle inset top-light (`inset 0 1px 0 rgba(255,255,255,0.05)`) gives surfaces a faint bevel.

**Shadows / elevation.** On dark, elevation reads through **border contrast + soft ambient shadow**, not heavy drop shadows. Popovers/menus get `--shadow-lg`. The accent gets a dedicated glow shadow (`--shadow-glow`) for emphasis only.

**Cards.** Two families. **Solid surface cards** — `--bg-2`, 1px `--line-2` border, `--r-md`/`--r-lg` radius, optional inset top-light — for dense UI on flat ground. **Glass cards** — for layering text *over imagery/media*: a frosted film (`--glass-light`) or smoked film (`--glass-dark`) with `backdrop-filter: blur(22px) saturate(1.3)`, a `--glass-border` with a brighter top-edge highlight (`inset 0 1px 0 var(--glass-border-top)`), over a media well. Use frosted glass over dark/abstract media, smoked glass over bright/busy media for legibility. No colored left-border accents on either.

**Media & imagery.** The system is media-forward — large abstract visuals carry the brand. Imagery is **cool, dark, abstract**: topographic line fields, gradient blooms (azure/cyan), node particles on near-black — never warm stock photos of people. Media wells are rounded (`--r-lg`/`--r-xl`), bordered with `--line-2`, and almost always carry a **protection scrim** (`--scrim-bottom`/`--scrim-full`) so glass cards and text stay legible. Place glass stat cards and content panels floating over hero/showcase media (cohere / scale / world / apple lineage). Drop real product shots or demo video into these wells; the abstract images are on-brand defaults.

**Corner radii.** Moderate, consistent: `--r-md` (14px) for cards/buttons, `--r-sm` (10px) for inputs/chips, `--r-full` for pills/avatars. Never sharp 0px (too brutal), never very round (too friendly).

**Motion.** Slow, confident, smooth — never springy. Prefer `opacity` + `translateY(8–16px)` reveals on scroll. Durations 500–900ms (`--dur-base`/`--dur-slow`), easing `cubic-bezier(0.22,1,0.36,1)`. Subtle glow drift on hero accents. No bounce, no overshoot, no attention-grabbing loops. Use motion sparingly.

**Hover states.** Surfaces: border brightens + one elevation step up. Text links: `--fg-2 → --fg-1`. Accent buttons: → `--accent-hover`. Transitions `--dur-fast` (220ms).

**Press states.** Subtle: accent buttons darken to `--accent-press`; a slight `scale(0.99)` is acceptable but no big squish.

**Transparency & blur.** Used for layered glass on overlays (`backdrop-filter: blur(20px)` over `bg` at ~70% alpha) and for the protection gradient at the top/bottom of scrollable regions. Glows always live on translucent layers. Don't over-glass; reserve blur for true overlays (modals, sticky headers).

**Imagery vibe.** When imagery is needed it is **cool, dark, abstract** — gradient fields, data-viz fragments, wireframe 3D — never warm stock photography of people smiling at laptops. Monochrome-to-azure tinting keeps everything on-palette.

---

## ICONOGRAPHY

**System:** [**Lucide**](https://lucide.dev) — thin, consistent 1.5–2px stroke, rounded joins. It matches the calm, precise, engineered tone and is CDN-available, so it's used directly rather than vendoring a custom set.

> ⚠️ **Substitution flagged:** no brand icon set was provided. Lucide is the closest match to the stated tone (minimal, futuristic-but-restrained, technical). Swap for an official set if one exists.

**Load (web):**
```html
<script src="https://unpkg.com/lucide@latest"></script>
<!-- then: lucide.createIcons(); -->
```
Or per-icon SVG from `https://lucide.dev`.

**Usage rules**
- Stroke width **1.75px**, sized **16 / 20 / 24px**. Don't mix fill and stroke styles.
- Icons inherit `currentColor`; default to `--fg-2`, brighten to `--fg-1` on hover/active, `--accent` only for active/selected signal.
- Icons support text — they don't replace labels in primary navigation.
- **No emoji** as icons, ever. **No multicolor icons.** Unicode arrows (→ ↗) are acceptable inline in editorial copy and buttons.
- Logo/mark lives in `assets/`; never recolor the mark outside its approved azure/white treatments.
