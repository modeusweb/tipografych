/**
 * Публичный API типографического движка.
 *
 * Движок не зависит от React и браузера: его можно использовать
 * в UI, Web Worker, unit-тестах, Node.js и будущем CLI.
 *
 * Пример:
 *   import { typograph } from "@/features/typography";
 *   const result = typograph('Он сказал - "Привет"...', {
 *     enabledRules: ["quotes-russian", "dash-sentence", "ellipsis"],
 *     protection: {},
 *   });
 */

export { typograph, countText, countWords, ruleName } from "./pipeline";
export { protectFragments, hasUnresolvedTokens } from "./protection";
export {
  TYPOGRAPHY_RULES,
  CATEGORY_LABELS,
  getRuleById,
  groupRulesByCategory,
} from "./rules";
export {
  PRESETS,
  DEFAULT_PROTECTION,
  getPresetById,
  resolveEnabledRules,
  type TypographyPreset,
} from "./presets";
export { diffLines, inlineDiffParts } from "./diff";
export { TYPOGRAPHY_CONFIG, type PresetId } from "./config";
export type {
  ChangeSample,
  CategoryStat,
  InputFormat,
  ProtectionOptions,
  RuleCategory,
  RuleContext,
  RuleStat,
  TextCounts,
  TypographyOptions,
  TypographyRule,
  TypographyStatistics,
  TypographResult,
} from "./types";
