"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toggle } from "@/components/ui/Toggle";
import {
  CATEGORY_LABELS,
  PRESETS,
  TYPOGRAPHY_RULES,
  groupRulesByCategory,
  resolveEnabledRules,
} from "@/features/typography";
import type { InputFormat, ProtectionOptions } from "@/features/typography/types";
import type { AppSettings } from "@/hooks/useSettings";
import type { PresetId } from "@/features/typography/config";
import { cx } from "@/lib/cx";

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onPreset: (preset: PresetId) => void;
  onEnableRule: (ruleId: string, enabled: boolean) => void;
  onProtection: (protection: ProtectionOptions) => void;
  onFormat: (format: InputFormat) => void;
  onAutoProcess: (enabled: boolean) => void;
  onReset: () => void;
}

const RULE_GROUPS = groupRulesByCategory();

const PROTECTION_TOGGLES: Array<{
  key: keyof ProtectionOptions;
  label: string;
  description: string;
}> = [
  { key: "urls", label: "URL-адреса", description: "Ссылки, домены и пути не типографируются" },
  { key: "emails", label: "Email", description: "Адреса почты защищаются от замен" },
  { key: "code", label: "Код", description: "Inline-код в бэктиках и HTML-теги не трогаются" },
  { key: "markdown", label: "Markdown", description: "Fenced-блоки, inline-код и ссылки Markdown защищаются" },
  { key: "html", label: "HTML-теги", description: "Теги не типографируются — обрабатывается только текст" },
];

const FORMAT_OPTIONS: Array<{ value: InputFormat; label: string }> = [
  { value: "plain", label: "Текст" },
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
];

export function SettingsDrawer({
  open,
  onClose,
  settings,
  onPreset,
  onEnableRule,
  onProtection,
  onFormat,
  onAutoProcess,
  onReset,
}: SettingsDrawerProps) {
  const enabledRules = new Set(resolveEnabledRules(settings.preset, settings.enabledRules));
  const isCustom = settings.preset === "custom";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Настройки"
      footer={
        isCustom ? (
          <Button variant="secondary" size="sm" onClick={onReset} className="w-full">
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Вернуть настройки выбранного пресета
          </Button>
        ) : null
      }
    >
      <fieldset className="border-b border-zinc-200 px-1 pb-5 mb-3 dark:border-zinc-700">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Пресет
        </legend>
        <div className="flex flex-col gap-1" role="radiogroup" aria-label="Пресет правил">
          {PRESETS.map((preset) => {
            const active = settings.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onPreset(preset.id as PresetId)}
                className={cx(
                  "cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600",
                  active
                    ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/60"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
                )}
              >
                <span
                  className={cx(
                    "block text-sm font-medium",
                    active ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-700 dark:text-zinc-200",
                  )}
                >
                  {preset.name}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                  {preset.description}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={isCustom}
            onClick={() => onPreset("custom")}
            className={cx(
              "cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600",
              isCustom
                ? "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/60"
                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
            )}
          >
            <span
              className={cx(
                "block text-sm font-medium",
                isCustom ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-700 dark:text-zinc-200",
              )}
            >
              Пользовательская
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-zinc-500 dark:text-zinc-400">
              Ваш набор правил из списка ниже
            </span>
          </button>
        </div>
      </fieldset>

      <fieldset className="border-b border-zinc-200 px-1 py-3 mb-3 dark:border-zinc-700">
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Обработка
        </legend>
        <div className="mb-2">
          <p className="mb-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Формат входных данных
          </p>
          <SegmentedControl
            label="Формат входных данных"
            options={FORMAT_OPTIONS}
            value={settings.format}
            onChange={onFormat}
          />
        </div>
        <Toggle
          id="toggle-auto"
          checked={settings.autoProcess}
          onChange={onAutoProcess}
          label="Автообработка при вводе"
          description="Обрабатывать текст автоматически после паузы. Для больших текстов рекомендуется ручной режим."
        />
      </fieldset>

      <fieldset className="border-b border-zinc-200 px-1 py-3 mb-3 dark:border-zinc-700">
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Правила типографики
        </legend>
        {RULE_GROUPS.map((group) => (
          <div key={group.category} className="mb-3 last:mb-0">
            <p className="mb-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {CATEGORY_LABELS[group.category]}
            </p>
            {group.rules.map((rule) => (
              <Toggle
                key={rule.id}
                id={`rule-${rule.id}`}
                checked={enabledRules.has(rule.id)}
                onChange={(checked) => onEnableRule(rule.id, checked)}
                label={rule.name}
                description={rule.description}
              />
            ))}
          </div>
        ))}
      </fieldset>

      <fieldset className="px-1 pt-3 mb-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Защита фрагментов
        </legend>
        <p className="mb-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
          Телефоны, даты, IP-адреса, версии, имена файлов и флаги командной
          строки защищаются всегда — это встроенная страховка.
        </p>
        {PROTECTION_TOGGLES.map((toggle) => (
          <Toggle
            key={toggle.key}
            id={`protection-${toggle.key}`}
            checked={settings.protection[toggle.key]}
            onChange={(checked) =>
              onProtection({ ...settings.protection, [toggle.key]: checked })
            }
            label={toggle.label}
            description={toggle.description}
          />
        ))}
      </fieldset>

      <p className="pb-2 text-xs leading-snug text-zinc-400 dark:text-zinc-500">
        Всего правил: {TYPOGRAPHY_RULES.length}. Изменения вступают в силу при
        следующей обработке текста.
      </p>
    </Drawer>
  );
}



