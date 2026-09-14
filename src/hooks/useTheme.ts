"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "typograph.theme.v1";

function applyTheme(preference: ThemePreference): void {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = preference === "dark" || (preference === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function readStoredTheme(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // приватный режим — используем системную тему
  }
  return "system";
}

/**
 * Тема интерфейса: светлая, тёмная или системная.
 * Выбор хранится в localStorage; класс `dark` ставится на <html>,
 * поэтому hydration-конфликтов нет (в layout стоит inline-скрипт,
 * который выставляет класс до первого кадра).
 */
export function useTheme(): {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
} {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // игнорируем недоступность localStorage
    }
    applyTheme(next);
  }, []);

  return { theme, setTheme };
}
