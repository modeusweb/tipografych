/**
 * Типы для типографического движка.
 *
 * Движок полностью отделён от React и браузера: его можно использовать
 * в любом контексте — вплоть до UI, Web Worker, unit-тестов и будущего CLI.
 */

/** Категория правила. Используется в интерфейсе UI и в статистике. */
export type RuleCategory =
  | "quotes"
  | "dashes"
  | "punctuation"
  | "spaces"
  | "brackets"
  | "nbsp"
  | "numbers"
  | "units"
  | "percent";

/** Пример изменения (для сводки и примеров изменений). */
export interface ChangeSample {
  ruleId: string;
  category: RuleCategory;
  before: string;
  after: string;
  /** Количество одинаковых изменений в одном фрагменте. */
  count: number;
}

export interface RuleStat {
  ruleId: string;
  count: number;
}

export interface CategoryStat {
  category: RuleCategory;
  count: number;
}

export interface TextCounts {
  chars: number;
  words: number;
  lines: number;
}

export interface TypographyStatistics {
  totalChanges: number;
  byRule: RuleStat[];
  byCategory: CategoryStat[];
  counts: TextCounts;
}

export interface TypographResult {
  /** Обработанный текст. */
  text: string;
  /** false в случае, когда ничего не типографизировалось. */
  changed: boolean;
  statistics: TypographyStatistics;
  /** Ограниченные выборки изменений (см. TYPOGRAPHY_CONFIG.maxSamples). */
  samples: ChangeSample[];
}

/** Формат входных данных. Влияет на обработку защищённых фрагментов. */
export type InputFormat = "plain" | "markdown" | "html";

/**
 * Настройки защиты фрагментов.
 *
 * `phones`, `dates` и `technical` всегда включены (встроенная страховка
 * по защите телефонов, дат, IP и других токенов) и не выводятся
 * в настройки пользователя.
 */
export interface ProtectionOptions {
  urls: boolean;
  emails: boolean;
  code: boolean;
  markdown: boolean;
  html: boolean;
}

export interface TypographyOptions {
  /** ID правил, которые нужно применить. */
  enabledRules: readonly string[];
  /** Защита фрагментов. Пустые поля применяют значения по умолчанию. */
  protection: Partial<ProtectionOptions>;
  /** Формат входных данных (по умолчанию — обычный текст). */
  format?: InputFormat;
}

/** Контекст, передаваемый каждому правилу. */
export interface RuleContext {
  options: TypographyOptions;
  /**
   * Регистрирует изменение. Вызывается только при фактических изменениях.
   * `count` указывает количество объединённых замен в одном фрагменте.
   */
  record(
    ruleId: string,
    category: RuleCategory,
    before: string,
    after: string,
    count?: number,
  ): void;
}

export interface TypographyRule {
  /** Уникальный строковый ID (используется в настройках и пресетах). */
  id: string;
  /** Человекочитаемое название (видимое имя). */
  name: string;
  /** Что делает правило для отображения в настройках. */
  description: string;
  category: RuleCategory;
  /** Включено ли правило по умолчанию в пресете. */
  enabledByDefault: boolean;
  /**
   * Функция правила в конвейере. Чистая функция: не изменяет `text`,
   * регистрирует изменения через `ctx.record` и возвращает новый текст.
   */
  apply(text: string, ctx: RuleContext): string;
}