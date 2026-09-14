import type { PresetId } from "./config";
import type { ProtectionOptions, TypographyRule } from "./types";
import { TYPOGRAPHY_RULES } from "./rules";

/**
 * Пресеты — готовые профили правил. Пользователь всегда может перейти
 * в режим «Пользовательский» и отключить любое правило отдельно.
 */

export interface TypographyPreset {
  id: Exclude<PresetId, "custom">;
  name: string;
  description: string;
  enabledRules: string[];
  protection: ProtectionOptions;
}

export const DEFAULT_PROTECTION: ProtectionOptions = {
  urls: true,
  emails: true,
  code: true,
  markdown: true,
  html: true,
};

const MINIMAL_RULES: readonly string[] = [
  "spaces-multiple",
  "spaces-edges",
  "brackets-spaces",
  "quotes-russian",
  "ellipsis",
  "space-before-punct",
  "space-after-punct",
  "dash-sentence",
  "dash-ranges",
];

export const PRESETS: readonly TypographyPreset[] = [
  {
    id: "russian",
    name: "Русская типографика",
    description:
      "Рекомендуемый набор: кавычки, тире, пробелы, пунктуация, неразрывные пробелы, единицы измерения, проценты.",
    enabledRules: TYPOGRAPHY_RULES.filter(
      (rule: TypographyRule) => rule.enabledByDefault || rule.id === "numbers-thousands",
    ).map((rule) => rule.id),
    protection: { ...DEFAULT_PROTECTION },
  },
  {
    id: "minimal",
    name: "Минималистичная",
    description:
      "Только очевидные исправления: пробелы, кавычки, тире, многоточие и базовая пунктуация.",
    enabledRules: MINIMAL_RULES.filter((id) =>
      TYPOGRAPHY_RULES.some((rule) => rule.id === id),
    ),
    protection: { ...DEFAULT_PROTECTION },
  },
  {
    id: "publisher",
    name: "Издательская",
    description:
      "Строгая редакционная типографика: всё из «Русской типографики» — без исключений.",
    enabledRules: TYPOGRAPHY_RULES.map((rule) => rule.id),
    protection: { ...DEFAULT_PROTECTION },
  },
];

export function getPresetById(id: string): TypographyPreset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

/**
 * Разрешает итоговый список правил:
 *  - для готовых пресетов — список из пресета;
 *  - для «custom» — пользовательский список (валидный фильтруется).
 */
export function resolveEnabledRules(
  presetId: PresetId,
  customRules: readonly string[],
): string[] {
  if (presetId !== "custom") {
    return getPresetById(presetId)?.enabledRules ?? getPresetById("russian")!.enabledRules;
  }
  const known = new Set(TYPOGRAPHY_RULES.map((rule) => rule.id));
  return customRules.filter((id) => known.has(id));
}
