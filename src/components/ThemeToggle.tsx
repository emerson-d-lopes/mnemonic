import { useEffect, useState } from "react";
import { toggleTheme, getTheme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(getTheme);

  useEffect(() => {
    const handler = () => setTheme(getTheme());
    window.addEventListener("theme-change", handler);
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handler);
    return () => {
      window.removeEventListener("theme-change", handler);
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handler);
    };
  }, []);

  return (
    <button
      onClick={toggleTheme}
      aria-label="toggle theme"
      className="size-8 flex items-center justify-center rounded-full text-text-secondary hover:bg-surface transition-colors duration-200 cursor-pointer"
    >
      {theme === "dark" ? "◐" : "◑"}
    </button>
  );
}
