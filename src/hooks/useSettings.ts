"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TYPOGRAPHY_CONFIG } from "@/features/typography/config";
import { TYPOGRAPHY_RULES } from "@/features/typography/rules";
import {
  DEFAULT_PROTECTION,
  getPresetById,
} from "@/features/typography/presets";
import type {
  InputFormat,
  ProtectionOptions,
} from "@/features/typography/types";

/**
 * Настройки приложения. Хранятся в localStorage — но не сам текст
 * пользователя (приватность), только выбор правил и режимов.
 */

export interface AppSettings {
  preset: "russian" | "minimal" | "publisher" | "custom";
  /** Актуально только при preset === "custom". */
  enabledRules: string[];
  protection: ProtectionOptions;
  format: InputFormat;
  autoProcess: boolean;
}

export function defaultSettings(): AppSettings {
  return {
    preset: TYPOGRAPHY_CONFIG.defaultPreset,
    enabledRules: [],
    protection: { ...DEFAULT_PROTECTION },
    format: "plain",
    autoProcess: false,
  };
}

function isValidPreset(value: unknown): value is AppSettings["preset"] {
  return (
    value === "russian" || value === "minimal" || value === "publisher" || value === "custom"
  );
}

function isValidFormat(value: unknown): value is InputFormat {
  return value === "plain" || value === "markdown" || value === "html";
}

function loadSettings(): AppSettings {
  const base = defaultSettings();
  if (typeof localStorage === "undefined") return base;
  try {
    const raw = localStorage.getItem(TYPOGRAPHY_CONFIG.localStorageKey);
    if (!raw) return base;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return base;
    const data = parsed as Record<string, unknown>;
    const settings: AppSettings = { ...base };
    if (isValidPreset(data.preset)) settings.preset = data.preset;
    if (Array.isArray(data.enabledRules)) {
      const known = new Set(TYPOGRAPHY_RULES.map((rule) => rule.id));
      settings.enabledRules = data.enabledRules.filter(
        (id): id is string => typeof id === "string" && known.has(id),
      );
    }
    if (typeof data.protection === "object" && data.protection !== null) {
      const p = data.protection as Record<string, unknown>;
      settings.protection = {
        urls: p.urls !== false,
        emails: p.emails !== false,
        code: p.code !== false,
        markdown: p.markdown !== false,
        html: p.html !== false,
      };
    }
    if (isValidFormat(data.format)) settings.format = data.format;
    if (typeof data.autoProcess === "boolean") {
      settings.autoProcess = data.autoProcess;
    }
    return settings;
  } catch {
    return base;
  }
}

export function useSettings(): {
  settings: AppSettings;
  loaded: boolean;
  update: (patch: Partial<AppSettings>) => void;
  applyPreset: (preset: AppSettings["preset"]) => void;
  enableRule: (ruleId: string, enabled: boolean) => void;
  resetToPreset: () => void;
} {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: AppSettings) => {
    if (typeof localStorage === "undefined") return;
    if (saveTimer.current !== null) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          TYPOGRAPHY_CONFIG.localStorageKey,
          JSON.stringify(next),
        );
      } catch {
        // игнорируем недоступность localStorage
      }
    }, 200);
  }, []);

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const applyPreset = useCallback(
    (preset: AppSettings["preset"]) => {
      setSettings((prev) => {
        if (preset === "custom") {
          // Переход в «Пользовательский»: берём текущий разрешённый набор
          // правил как отправную точку для ручной настройки.
          const resolved =
            prev.preset === "custom"
              ? prev.enabledRules
              : (getPresetById(prev.preset)?.enabledRules ??
                TYPOGRAPHY_RULES.map((rule) => rule.id));
          const next: AppSettings = {
            ...prev,
            preset: "custom",
            enabledRules: [...resolved],
          };
          persist(next);
          return next;
        }
        const target = getPresetById(preset);
        const next: AppSettings = target
          ? {
              ...prev,
              preset,
              enabledRules: [],
              protection: { ...target.protection },
            }
          : prev;
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const enableRule = useCallback(
    (ruleId: string, enabled: boolean) => {
      setSettings((prev) => {
        const resolved =
          prev.preset === "custom"
            ? prev.enabledRules
            : (getPresetById(prev.preset)?.enabledRules ?? []);
        const set = new Set(resolved);
        if (enabled) set.add(ruleId);
        else set.delete(ruleId);
        const next: AppSettings = {
          ...prev,
          preset: "custom",
          enabledRules: [...set],
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetToPreset = useCallback(() => {
    applyPreset(settings.preset === "custom" ? TYPOGRAPHY_CONFIG.defaultPreset : settings.preset);
  }, [applyPreset, settings.preset]);

  return { settings, loaded, update, applyPreset, enableRule, resetToPreset };
}
