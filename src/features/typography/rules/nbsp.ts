import type { RuleContext, TypographyRule } from "../types";
import { alternation, applyRegex } from "./helpers";
import { UNITS } from "./units";

/**
 * Неразрывные пробелы (U+00A0).
 *
 * Все четыре правила отдельные и отключаемые: часть пользователей
 * предпочитает обычные пробелы (например, для дальшейшей выгрузки в
 * системы, не понимающие NBSP).
 *
 * Правила идут ПОСЛЕ правил обычных пробелов, чтобы не «съедать»
 * вставленные неразрывные пробелы, и проверяют только обычные
 * пробелы ([ \t]) — поэтому повторная обработка ничего не меняет.
 */

/** Короткие предлоги, союзы и частицы. */
const SHORT_WORDS: readonly string[] = [
  "что", "без", "для", "при", "как", "или", "там", "тут",
  "из-за", "из-под",
  "во", "ко", "об", "со",
  "не", "ни", "но", "на", "от", "до", "по", "за", "из", "же", "бы", "ли", "да", "то",
  "в", "у", "к", "о", "с", "и", "а",
];

/** Граница перед коротким словом: начало строки, пробел, скобка, тире. */
const WORD_BOUNDARY = "(?:^|[\\s([{\"'\u00AB\u201E\u2014\u2013-])";

/** Быстрая проверка «слово есть в списке коротких слов». */
const SHORT_WORD_SET = new Set(SHORT_WORDS);

/**
 * Структурные строки: заголовок, цитата, список, ограда кода, реплика
 * диалога. Это осознанная разметка текста — строки внутри неё не склеиваются.
 */
const STRUCTURAL_LINE_RE =
  /^ {0,3}(?:#{1,6}[ \t]|>|[-*+][ \t]|\d{1,3}[.)][ \t]|```|~~~|[\u2014\u2013][ \t])/;

/**
 * Последнее слово строки целиком. Точка на конце не проходит: «Ив.» и «И.» —
 * сокращение и инициал, а не короткое слово.
 */
function lastWord(line: string): string {
  const match = /([\p{L}\p{N}]+)[ \t]*$/u.exec(line);
  return match ? match[1] : "";
}

/** Короткое слово из списка предлогов, союзов и частиц. */
function isShortWord(word: string): boolean {
  return word.length > 0 && SHORT_WORD_SET.has(word.toLowerCase());
}

function canGlue(current: string, next: string): boolean {
  if (!current || !next) return false; // абзац или конец текста
  if (STRUCTURAL_LINE_RE.test(current) || STRUCTURAL_LINE_RE.test(next)) return false;
  return isShortWord(lastWord(current));
}

/**
 * Склеивает строку, которая заканчивается коротким словом, со следующей
 * строкой: перенос заменяется неразрывным пробелом. Так предлог или союз
 * не «висит» в конце строки. Абзацы, заголовки, списки, цитаты и строки
 * из одного слова остаются нетронутыми.
 */
function glueLineEnds(text: string, ctx: RuleContext, rule: TypographyRule): string {
  if (!text.includes("\n")) return text;
  const lines = text.split("\n");
  const merged: string[] = [];
  let current = lines[0];
  for (let i = 1; i < lines.length; i += 1) {
    const next = lines[i];
    if (canGlue(current, next)) {
      const tail = current.replace(/[ \t]+$/, "");
      const word = lastWord(tail);
      ctx.record(rule.id, rule.category, word + "\n", word + "\u00A0");
      current = tail + "\u00A0" + next;
      continue;
    }
    merged.push(current);
    current = next;
  }
  merged.push(current);
  return merged.join("\n");
}

export const nbspPrepositionsRule: TypographyRule = {
  id: "nbsp-prepositions",
  name: "Неразрывные пробелы: предлоги и союзы",
  description:
    "Приклеивает короткие предлоги, союзы и частицы («в доме», «что это») к следующему слову неразрывным пробелом. Короткое слово в конце строки стягивается со следующей строкой — иначе предлог «висит» на переносе.",
  category: "nbsp",
  enabledByDefault: true,
  apply(text, ctx) {
    const re = new RegExp(
      "(?<=" + WORD_BOUNDARY + ")(" + alternation(SHORT_WORDS) + ")([ \\t]+)",
      "gim",
    );
    let result = applyRegex(ctx, nbspPrepositionsRule, text, re, (m) => m[1] + "\u00A0");
    result = glueLineEnds(result, ctx, nbspPrepositionsRule);
    return result;
  },
};

export const nbspInitialsRule: TypographyRule = {
  id: "nbsp-initials",
  name: "Неразрывные пробелы: инициалы",
  description:
    "Склеивает инициалы между собой и с фамилией: «И. И. Иванов» → «И.\u00A0И.\u00A0Иванов», «Иванов И.И.» → «Иванов\u00A0И.И.».",
  category: "nbsp",
  enabledByDefault: true,
  apply(text, ctx) {
    // «И. И.» и «И.И.» → «И.\u00A0И.» (только внутри строки: перевод
    // строки не трогаем, иначе строки «склеиваются» в одну).
    let result = applyRegex(
      ctx,
      nbspInitialsRule,
      text,
      /([А-ЯЁ])\.[ \t]+(?=[А-ЯЁ]\.)/g,
      (m) => m[1] + ".\u00A0",
    );
    result = applyRegex(
      ctx,
      nbspInitialsRule,
      result,
      /([А-ЯЁ])\.(?=[А-ЯЁ]\.)/g,
      (m) => m[1] + ".\u00A0",
    );
    // «И.\u00A0И. Иванов» → «И.\u00A0И.\u00A0Иванов»
    result = applyRegex(
      ctx,
      nbspInitialsRule,
      result,
      /([А-ЯЁ]\.\u00A0[А-ЯЁ]\.)[ \t]+(?=[А-ЯЁ][а-яё])/g,
      (m) => m[1] + "\u00A0",
    );
    // «Иванов И.И.» → «Иванов\u00A0И.И.» (между инициалами уже NBSP)
    result = applyRegex(
      ctx,
      nbspInitialsRule,
      result,
      /(?<=[а-яё])[ \t]+(?=[А-ЯЁ]\. ?[\u00A0]?[А-ЯЁ]\.)/g,
      () => "\u00A0",
    );
    return result;
  },
};

export const nbspSymbolsRule: TypographyRule = {
  id: "nbsp-symbols",
  name: "Неразрывные пробелы: № и §",
  description:
    "Приклеивает знаки № и § к следующему числу неразрывным пробелом («№ 5» → «№\u00A05»).",
  category: "nbsp",
  enabledByDefault: true,
  apply(text, ctx) {
    let result = applyRegex(
      ctx,
      nbspSymbolsRule,
      text,
      /\u2116[ \t]?(?=\d)/g,
      () => "\u2116\u00A0",
    );
    result = applyRegex(
      ctx,
      nbspSymbolsRule,
      result,
      /\u00A7[ \t]?(?=\d)/g,
      () => "\u00A7\u00A0",
    );
    return result;
  },
};

export const nbspUnitsRule: TypographyRule = {
  id: "nbsp-units",
  name: "Неразрывные пробелы: числа и единицы",
  description:
    "Приклеивает единицы измерения и обозначения температуры к числу неразрывным пробелом («10 кг» → «10\u00A0кг», «20 °C» → «20\u00A0°C»).",
  category: "nbsp",
  enabledByDefault: true,
  apply(text, ctx) {
    const re = new RegExp(
      "(?<=\\d)[ \\t]+(?=(?:" + alternation(UNITS) + "|\u00B0[CF])(?![\\p{L}\\p{N}]))",
      "gu",
    );
    let result = applyRegex(ctx, nbspUnitsRule, text, re, () => "\u00A0");
    // Надстрочные индексы: «1500 м²» → «1500\u00A0м²».
    result = applyRegex(ctx, nbspUnitsRule, result, SUPERSCRIPT_RE, () => "\u00A0");
    return result;
  },
};

/** Клей для надстрочных индексов: «1500 м²», «5 м³» (см. units-spacing). */
const SUPERSCRIPT_RE =
  /(?<=\d)[ \t]+(?=(?:м|км|см|мм|дм)[\u00B2\u00B3](?![\p{L}\p{N}\u00B2\u00B3]))/gu;
