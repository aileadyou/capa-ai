/**
 * Runtime theming controls — swap any brand/semantic color token plus the
 * sans & mono UI fonts without touching source. Values are written as inline
 * custom properties on <html>, which override the canonical tokens in
 * `src/index.css` (inline styles beat stylesheet rules) and survive light/dark
 * toggles. Persisted to localStorage so choices survive reloads.
 *
 * Mirrors the persistence pattern in `src/lib/theme.ts`.
 */

export const COLORS_STORAGE_KEY = "capa-ai-colors";
export const FONT_SANS_STORAGE_KEY = "capa-ai-font-sans";
export const FONT_MONO_STORAGE_KEY = "capa-ai-font-mono";

/* ----------------------------------------------------------------------------
 * Color tokens
 * --------------------------------------------------------------------------*/

/** Space-separated HSL triple, e.g. "284 55% 55%" — matches token format. */
export type HslTriple = string;

export type ColorToken = {
  /** CSS custom-property name without the leading `--`. */
  id: string;
  label: string;
};

export type ColorGroup = {
  title: string;
  tokens: ColorToken[];
};

/**
 * Every user-editable color token, grouped for the panel. Each maps 1:1 to a
 * `--<id>` custom property defined in `src/index.css`. `primary` and
 * `status-closed` additionally drive a couple of derivative tokens (see
 * `setColorVars`).
 */
export const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Brand",
    tokens: [
      { id: "primary", label: "Primary" },
      { id: "primary-foreground", label: "Primary text" },
    ],
  },
  {
    title: "Semantic",
    tokens: [
      { id: "tw-success", label: "Success" },
      { id: "tw-warning", label: "Warning" },
      { id: "destructive", label: "Destructive" },
    ],
  },
  {
    title: "Severity",
    tokens: [
      { id: "severity-minor", label: "Minor" },
      { id: "severity-major", label: "Major" },
      { id: "severity-critical", label: "Critical" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { id: "status-draft", label: "Draft" },
      { id: "status-investigation", label: "Investigation" },
      { id: "status-approval", label: "Approval" },
      { id: "status-closed", label: "Closed / Ready" },
    ],
  },
  {
    title: "Surfaces",
    tokens: [
      { id: "void", label: "Void" },
      { id: "background", label: "Background" },
      { id: "card", label: "Card" },
      { id: "elevated", label: "Elevated" },
      { id: "field", label: "Field" },
    ],
  },
  {
    title: "Text",
    tokens: [
      { id: "foreground", label: "Primary" },
      { id: "foreground-secondary", label: "Secondary" },
      { id: "foreground-tertiary", label: "Tertiary" },
      { id: "foreground-faint", label: "Faint" },
    ],
  },
  {
    title: "Borders",
    tokens: [
      { id: "border-subtle", label: "Subtle" },
      { id: "border", label: "Default" },
      { id: "border-strong", label: "Strong" },
    ],
  },
  {
    title: "Charts",
    tokens: [
      { id: "chart-1", label: "Chart 1" },
      { id: "chart-2", label: "Chart 2" },
      { id: "chart-3", label: "Chart 3" },
      { id: "chart-4", label: "Chart 4" },
      { id: "chart-5", label: "Chart 5" },
    ],
  },
];

/** Quick-pick brand swatches (apply to the `primary` token). */
export const PRIMARY_PRESETS: { id: string; label: string; hsl: HslTriple }[] = [
  { id: "purple", label: "Purple", hsl: "284 55% 55%" },
  { id: "indigo", label: "Indigo", hsl: "245 58% 58%" },
  { id: "blue", label: "Blue", hsl: "217 80% 56%" },
  { id: "teal", label: "Teal", hsl: "176 60% 42%" },
  { id: "emerald", label: "Emerald", hsl: "154 55% 45%" },
  { id: "amber", label: "Amber", hsl: "37 80% 52%" },
  { id: "rose", label: "Rose", hsl: "344 75% 58%" },
  { id: "crimson", label: "Crimson", hsl: "358 70% 58%" },
];

function clampLightness(l: number) {
  return Math.max(0, Math.min(100, Math.round(l)));
}

function parseHsl(triple: HslTriple): { h: number; s: number; l: number } | null {
  const match = triple.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

/** Convert a #rrggbb hex string into a space-separated HSL triple. */
export function hexToHslTriple(hex: string): HslTriple | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Convert a space-separated HSL triple back into a #rrggbb hex string. */
export function hslTripleToHex(triple: HslTriple): string {
  const parsed = parseHsl(triple);
  if (!parsed) return "#000000";
  const { h, s, l } = { h: parsed.h, s: parsed.s / 100, l: parsed.l / 100 };
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Tokens removed alongside their parent on reset. */
const DERIVED_OF: Record<string, string[]> = {
  primary: ["primary-light", "primary-dark", "ring"],
  "status-closed": ["status-ready"],
};

/** Write a token (and its derivatives) to <html> without touching storage. */
function setColorVars(id: string, hsl: HslTriple) {
  const root = document.documentElement;
  const parsed = parseHsl(hsl);
  if (!parsed) return;
  root.style.setProperty(`--${id}`, hsl);

  if (id === "primary") {
    const { h, s, l } = parsed;
    root.style.setProperty("--primary-light", `${h} ${s}% ${clampLightness(l + 9)}%`);
    root.style.setProperty("--primary-dark", `${h} ${s}% ${clampLightness(l - 7)}%`);
    root.style.setProperty("--ring", hsl);
  }
  if (id === "status-closed") {
    root.style.setProperty("--status-ready", hsl);
  }
}

function clearColorVars(id: string) {
  const root = document.documentElement;
  root.style.removeProperty(`--${id}`);
  for (const d of DERIVED_OF[id] ?? []) root.style.removeProperty(`--${d}`);
}

export function getColorOverrides(): Record<string, HslTriple> {
  const raw = readStored(COLORS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Apply and persist a single color token override. */
export function applyColorToken(id: string, hsl: HslTriple) {
  setColorVars(id, hsl);
  const map = getColorOverrides();
  map[id] = hsl;
  writeStored(COLORS_STORAGE_KEY, JSON.stringify(map));
}

/** Reset one token back to its stylesheet default. */
export function resetColorToken(id: string) {
  clearColorVars(id);
  const map = getColorOverrides();
  delete map[id];
  writeStored(COLORS_STORAGE_KEY, JSON.stringify(map));
}

/** Reset every color override. */
export function resetAllColors() {
  for (const id of Object.keys(getColorOverrides())) clearColorVars(id);
  clearStored(COLORS_STORAGE_KEY);
}

/** Current computed value of a token as #rrggbb (respects theme + overrides). */
export function readTokenHex(id: string): string {
  if (typeof document === "undefined") return "#000000";
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${id}`).trim();
  return parseHsl(value) ? hslTripleToHex(value) : "#000000";
}

/* ----------------------------------------------------------------------------
 * Fonts (sans + mono)
 * --------------------------------------------------------------------------*/

export type FontOption = {
  id: string;
  label: string;
  /** Full CSS font-family stack written to the target var. */
  stack: string;
  /** Google Fonts family spec to lazy-load; omit for already-available fonts. */
  googleFamily?: string;
};

export const FONT_SANS_OPTIONS: FontOption[] = [
  {
    id: "plus-jakarta",
    label: "Plus Jakarta Sans",
    stack: '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  {
    id: "inter",
    label: "Inter",
    stack: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    googleFamily: "Inter:wght@300;400;500;600;700",
  },
  {
    id: "manrope",
    label: "Manrope",
    stack: '"Manrope", ui-sans-serif, system-ui, -apple-system, sans-serif',
    googleFamily: "Manrope:wght@300;400;500;600;700",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    stack: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
    googleFamily: "IBM+Plex+Sans:wght@300;400;500;600;700",
  },
  {
    id: "geist",
    label: "Geist",
    stack: '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif',
    googleFamily: "Geist:wght@300;400;500;600;700",
  },
  {
    id: "system",
    label: "System UI",
    stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
];

export const FONT_MONO_OPTIONS: FontOption[] = [
  {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    stack: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    stack: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
    googleFamily: "JetBrains+Mono:wght@400;500;600;700",
  },
  {
    id: "fira-code",
    label: "Fira Code",
    stack: '"Fira Code", ui-monospace, "SF Mono", Menlo, monospace',
    googleFamily: "Fira+Code:wght@400;500;600;700",
  },
  {
    id: "roboto-mono",
    label: "Roboto Mono",
    stack: '"Roboto Mono", ui-monospace, "SF Mono", Menlo, monospace',
    googleFamily: "Roboto+Mono:wght@400;500;600;700",
  },
  {
    id: "space-mono",
    label: "Space Mono",
    stack: '"Space Mono", ui-monospace, "SF Mono", Menlo, monospace',
    googleFamily: "Space+Mono:wght@400;700",
  },
  {
    id: "geist-mono",
    label: "Geist Mono",
    stack: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
    googleFamily: "Geist+Mono:wght@400;500;600;700",
  },
];

export const DEFAULT_SANS_ID = FONT_SANS_OPTIONS[0].id;
export const DEFAULT_MONO_ID = FONT_MONO_OPTIONS[0].id;

function ensureGoogleFont(family: string) {
  const id = `gf-${family.replace(/[^a-z0-9]/gi, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}

function applyFontVar(
  options: FontOption[],
  id: string,
  cssVar: string,
  storageKey: string,
) {
  const option = options.find((f) => f.id === id) ?? options[0];
  if (option.googleFamily) ensureGoogleFont(option.googleFamily);
  document.documentElement.style.setProperty(cssVar, option.stack);
  writeStored(storageKey, option.id);
}

/** Apply a sans family to `--font-sans` (Tailwind `font-sans` reads this var). */
export function applySansFont(id: string) {
  applyFontVar(FONT_SANS_OPTIONS, id, "--font-sans", FONT_SANS_STORAGE_KEY);
}

/** Apply a mono family to `--font-mono` (Tailwind `font-mono` reads this var). */
export function applyMonoFont(id: string) {
  applyFontVar(FONT_MONO_OPTIONS, id, "--font-mono", FONT_MONO_STORAGE_KEY);
}

export function getInitialSansId(): string {
  const stored = readStored(FONT_SANS_STORAGE_KEY);
  return stored && FONT_SANS_OPTIONS.some((f) => f.id === stored) ? stored : DEFAULT_SANS_ID;
}

export function getInitialMonoId(): string {
  const stored = readStored(FONT_MONO_STORAGE_KEY);
  return stored && FONT_MONO_OPTIONS.some((f) => f.id === stored) ? stored : DEFAULT_MONO_ID;
}

export function resetSansFont() {
  document.documentElement.style.removeProperty("--font-sans");
  clearStored(FONT_SANS_STORAGE_KEY);
}

export function resetMonoFont() {
  document.documentElement.style.removeProperty("--font-mono");
  clearStored(FONT_MONO_STORAGE_KEY);
}

/* ----------------------------------------------------------------------------
 * Boot
 * --------------------------------------------------------------------------*/

/** Apply persisted customizations before first paint. Call from main.tsx. */
export function applyCustomization() {
  if (typeof document === "undefined") return;

  const colors = getColorOverrides();
  for (const [id, hsl] of Object.entries(colors)) setColorVars(id, hsl);

  const sans = getInitialSansId();
  if (sans !== DEFAULT_SANS_ID) applySansFont(sans);

  const mono = getInitialMonoId();
  if (mono !== DEFAULT_MONO_ID) applyMonoFont(mono);
}

/* ----------------------------------------------------------------------------
 * Storage helpers (best-effort, mirror theme.ts)
 * --------------------------------------------------------------------------*/

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // best-effort; the inline style is already applied
  }
}

function clearStored(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}
