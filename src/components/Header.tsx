"use client";

import {
  Cog6ToothIcon,
  MoonIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  ComputerDesktopIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import type { ThemePreference } from "@/hooks/useTheme";

export interface HeaderProps {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Светлая тема",
  dark: "Тёмная тема",
  system: "Системная тема",
};

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};

function ThemeIcon({ theme }: { theme: ThemePreference }) {
  if (theme === "light") return <SunIcon className="h-5 w-5" aria-hidden="true" />;
  if (theme === "dark") return <MoonIcon className="h-5 w-5" aria-hidden="true" />;
  return <ComputerDesktopIcon className="h-5 w-5" aria-hidden="true" />;
}

export function Header({ onOpenSettings, onOpenHelp, onOpenAbout, theme, onThemeChange }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Типографыч
            </span>
            <span className="text-sm font-semibold text-zinc-500 sm:text-lg dark:text-zinc-400">
              — типографика русского текста онлайн
            </span>
          </h1>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            Приведите русский текст к нормам типографики
          </p>
        </div>
        <nav className="flex shrink-0 items-center gap-1.5" aria-label="Управление">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onThemeChange(NEXT_THEME[theme])}
            aria-label={`Сменить тему. Текущая: ${THEME_LABELS[theme]}`}
            title={`Тема: ${THEME_LABELS[theme]}`}
          >
            <ThemeIcon theme={theme} />
            <span className="hidden md:inline">{THEME_LABELS[theme]}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenHelp}>
            <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">Справка</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenAbout}>
            <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">О сервисе</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">Настройки</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
