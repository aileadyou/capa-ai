export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "capa-ai-theme";

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = readStoredTheme();
  if (isThemeMode(stored)) return stored;

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  return "dark";
}

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
  writeStoredTheme(theme);
}

function readStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme class is already applied; storage persistence is best-effort.
  }
}
