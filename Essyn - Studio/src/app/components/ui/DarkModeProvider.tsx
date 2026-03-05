/**
 * DarkModeProvider — Global dark mode toggle
 *
 * Provides a context for dark mode state with localStorage persistence.
 * Applies a CSS class to <html> element for Tailwind dark mode.
 *
 * Usage:
 *   const { isDark, toggle } = useDarkMode();
 *
 * Apple Premium design, zero transparency rule.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface DarkModeContext {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

const DarkModeCtx = createContext<DarkModeContext>({
  isDark: false,
  toggle: () => {},
  setDark: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeCtx);
}

const STORAGE_KEY = "essyn_dark_mode";

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
    try {
      localStorage.setItem(STORAGE_KEY, isDark.toString());
    } catch {}
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);
  const setDark = (dark: boolean) => setIsDark(dark);

  return (
    <DarkModeCtx.Provider value={{ isDark, toggle, setDark }}>
      {children}
    </DarkModeCtx.Provider>
  );
}
