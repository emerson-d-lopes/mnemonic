const STORAGE_KEY = "ash-lumen-theme";

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getActiveTheme(): "dark" | "light" {
  return (
    (document.documentElement.getAttribute("data-theme") as
      | "dark"
      | "light"
      | null) ?? getSystemTheme()
  );
}

export function toggleTheme() {
  const next = getActiveTheme() === "dark" ? "light" : "dark";
  if (next === getSystemTheme()) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(STORAGE_KEY);
  } else {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  }
  window.dispatchEvent(new Event("theme-change"));
}

export function getTheme(): "dark" | "light" {
  return getActiveTheme();
}
