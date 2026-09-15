import { TYPOGRAPHY_CONFIG } from "./config";
import { protectFragments } from "./protection";
import { TYPOGRAPHY_RULES, getRuleById } from "./rules";
import { DEFAULT_PROTECTION } from "./presets";
import {
  type ChangeSample,
  type CategoryStat,
  type InputFormat,
  type ProtectionOptions,
  type RuleCategory,
  type RuleContext,
  type RuleStat,
  type TextCounts,
  type TypographyOptions,
  type TypographyStatistics,
  type TypographResult,
} from "./types";

/**
 * Конвейер обработки. Единственная точка входа движка:
 *
 *   typograph(text, options) → { text, changed, statistics, samples }
 *
 * Этапы (порядок правил см. в rules/index.ts):
 *   1. нормализация (переводы строк, вырезание приватных символов);
 *   2. предварительная обработка правилами с флагом `runBeforeProtection`;
 *   3. защита фрагментов (protected tokens);
 *   4. применение правил в фиксированном порядке;
 *   5. восстановление защищённых фрагментов;
 *   6. статистика и примеры изменений.
 *
 * Функция чистая и детерминированная: одинаковые вход и настройки
 * всегда дают одинаковый результат (идемпотентность покрыта тестами).
 */

const PUA_CHARS = /[\uE000-\uE001]/g;

const WORD_RE_SOURCE = "[\\p{L}\\p{N}]+(?:[-'\u2019][\\p{L}\\p{N}]+)*";

/** Аккумулятор изменений с лимитом примеров (для больших текстов). */
class ChangeAggregator {
  private readonly counts = new Map<string, { count: number; category: RuleCategory }>();
  readonly samples: ChangeSample[] = [];
  total = 0;

  record(
    ruleId: string,
    category: RuleCategory,
    before: string,
    after: string,
    count = 1,
  ): void {
    const entry = this.counts.get(ruleId);
    if (entry) entry.count += count;
    else this.counts.set(ruleId, { count, category });
    this.total += count;
    if (this.samples.length < TYPOGRAPHY_CONFIG.maxSamples) {
      this.samples.push({
        ruleId,
        category,
        before: truncate(before),
        after: truncate(after),
        count,
      });
    }
  }

  snapshot(): { totalChanges: number; byRule: RuleStat[]; byCategory: CategoryStat[] } {
    const byRule: RuleStat[] = [...this.counts.entries()]
      .map(([ruleId, { count }]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count);
    const categoryTotals = new Map<RuleCategory, number>();
    for (const [ruleId, { count, category }] of this.counts) {
      void ruleId;
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + count);
    }
    const byCategory: CategoryStat[] = [...categoryTotals.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    return { totalChanges: this.total, byRule, byCategory };
  }
}

function truncate(value: string): string {
  const limit = TYPOGRAPHY_CONFIG.maxSampleLength;
  return value.length <= limit ? value : value.slice(0, limit) + "\u2026";
}

export function countWords(text: string): number {
  if (text.length === 0) return 0;
  const re = new RegExp(WORD_RE_SOURCE, "gu");
  let count = 0;
  while (re.exec(text) !== null) count += 1;
  return count;
}

export function countText(text: string): TextCounts {
  return {
    chars: text.length,
    words: countWords(text),
    lines: text.length === 0 ? 0 : text.split("\n").length,
  };
}

export function typograph(text: string, options: TypographyOptions): TypographResult {
  if (typeof text !== "string") {
    throw new TypeError("typograph: параметр text должен быть строкой");
  }
  if (!text) {
    return {
      text: "",
      changed: false,
      statistics: {
        totalChanges: 0,
        byRule: [],
        byCategory: [],
        counts: { chars: 0, words: 0, lines: 0 },
      },
      samples: [],
    };
  }

  const enabled = new Set(options.enabledRules);
  const protection: ProtectionOptions = { ...DEFAULT_PROTECTION, ...options.protection };
  const format: InputFormat = options.format ?? "plain";

  // 1. Нормализация.
  const normalized = text.replace(/\r\n?/g, "\n").replace(PUA_CHARS, "");

  // 2. Предварительная обработка (до защиты фрагментов).
  //     Правила с флагом `runBeforeProtection` должны видеть «сырые»
  //     фрагменты: protection заменяет телефоны и даты маркерами, поэтому
  //     phone-format и year-abbr обязаны отработать ДО неё.
  //     Изменения пишутся в отдельный агрегатор (защищённый фрагмент в
  //     статистике остаётся «сырым» текстом).
  const preAggregator = new ChangeAggregator();
  const preCtx: RuleContext = {
    options,
    record: (ruleId, category, before, after, count) =>
      preAggregator.record(ruleId, category, before, after, count),
  };
  let preprocessed = normalized;
  for (const rule of TYPOGRAPHY_RULES) {
    if (!rule.runBeforeProtection || !enabled.has(rule.id)) continue;
    preprocessed = rule.apply(preprocessed, preCtx);
  }

  // 3. Защита фрагментов.
  const guarded = protectFragments(preprocessed, protection, format);

  // 4. Правила в фиксированном порядке.
  const aggregator = new ChangeAggregator();
  const ctx: RuleContext = {
    options,
    record: (ruleId, category, before, after, count) =>
      aggregator.record(ruleId, category, before, after, count),
  };
  let working = guarded.text;
  for (const rule of TYPOGRAPHY_RULES) {
    if (!enabled.has(rule.id)) continue;
    // Правила предварительной обработки уже отработали до защиты фрагментов.
    if (rule.runBeforeProtection) continue;
    working = rule.apply(working, ctx);
  }

  // 4.5 Объединяем статистику предварительной обработки с основной.
  for (const sample of preAggregator.samples) {
    aggregator.record(sample.ruleId, sample.category, sample.before, sample.after, sample.count);
  }

  // 4. Восстановление защищённых фрагментов.
  const restored = guarded.restore(working);

  // 5. Статистика.
  const stats = aggregator.snapshot();
  const statistics: TypographyStatistics = { ...stats, counts: countText(restored) };

  return {
    text: restored,
    changed: aggregator.total > 0,
    statistics,
    samples: aggregator.samples,
  };
}

/** Удобный доступ к человеческому названию правила для UI. */
export function ruleName(ruleId: string): string {
  return getRuleById(ruleId)?.name ?? ruleId;
}

export type { TextCounts };
