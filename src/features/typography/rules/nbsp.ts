import type { TypographyRule } from "../types";
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
  "что", "без", "для", "при", "как", "или",
  "из-за", "из-под",
  "во", "ко", "об", "со",
  "не", "ни", "но", "на", "от", "до", "по", "за", "из", "же", "бы", "ли", "да", "то",
  "в", "у", "к", "о", "с", "и", "а",
];

export const nbspPrepositionsRule: TypographyRule = {
  id: "nbsp-prepositions",
  name: "Неразрывные пробелы: предлоги и союзы",
  description:
    "Приклеивает короткие предлоги, союзы и частицы («в доме», «что это») к следующему слову неразрывным пробелом.",
  category: "nbsp",
  enabledByDefault: true,
  apply(text, ctx) {
    const re = new RegExp(
      "(?<=^|[\\s([{\"'\u00AB\u201E\u2014\u2013-])(" +
        alternation(SHORT_WORDS) +
        ")([ \\t]+)",
      "gim",
    );
    return applyRegex(ctx, nbspPrepositionsRule, text, re, (m) => m[1] + "\u00A0");
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
