import type { RuleCategory, RuleContext, TypographyRule } from "../types";

/**
 * Общие помощники для правил.
 *
 * Все замены в правилах выполняются через `applyRegex`: он гарантирует,
 * что каждое фактическое изменение будет зарегистрировано в контексте
 * и попадёт в статистику.
 */
export function applyRegex(
  ctx: RuleContext,
  rule: TypographyRule,
  text: string,
  regex: RegExp,
  map: (match: RegExpExecArray) => string,
): string {
  return text.replace(regex, (...args: unknown[]) => {
    // String.replace передаёт [match, ...groups, offset, string, groups?].
    // Собираем из этого объект с полем index, как у RegExpExecArray.
    const match = String(args[0]);
    const offset = args[args.length - 2] as number;
    const exec = args.slice(0, args.length - 2) as unknown as RegExpExecArray;
    (exec as { index: number }).index = offset;
    const next = map(exec);
    if (next !== match) {
      ctx.record(rule.id, rule.category, match, next);
    }
    return next;
  });
}

/** Простая замена строкой (например, `…`). */
export function applyReplacement(
  ctx: RuleContext,
  rule: TypographyRule,
  text: string,
  regex: RegExp,
  replacement: string,
): string {
  return applyRegex(ctx, rule, text, regex, () => replacement);
}

/**
 * Сериализует список точечных замен в объединённые записи:
 * соседние замены одного символа (например, десятки кавычек подряд)
 * склеиваются в одну запись с count > 1.
 */
export interface PointChange {
  index: number;
  before: string;
  after: string;
}

export function mergePointChanges(
  changes: PointChange[],
  ctx: RuleContext,
  rule: TypographyRule,
): void {
  let current: { before: string; after: string; count: number } | null = null;
  let lastIndex = -2;
  for (const change of changes) {
    if (
      current &&
      change.before === current.before &&
      change.after === current.after &&
      change.index === lastIndex + 1
    ) {
      current.count += 1;
    } else {
      if (current) {
        ctx.record(rule.id, rule.category, current.before, current.after, current.count);
      }
      current = { before: change.before, after: change.after, count: 1 };
    }
    lastIndex = change.index;
  }
  if (current) {
    ctx.record(rule.id, rule.category, current.before, current.after, current.count);
  }
}

/** Проверка «символ является буквой или цифрой» (без regex-возвратов). */
export function isAlphanumeric(char: string | undefined): boolean {
  if (!char) return false;
  return /[\p{L}\p{N}]/u.test(char);
}

/** Помощник для построения альтернации единиц измерения. */
export function alternation(words: readonly string[]): string {
  return words
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}

export type { RuleCategory };
