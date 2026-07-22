const THEME_KEY = "console_theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme | null) ?? "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}
