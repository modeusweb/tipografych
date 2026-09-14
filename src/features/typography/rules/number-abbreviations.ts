import type { TypographyRule } from "../types";
import { alternation, applyRegex } from "./helpers";

/**
 * Числовые сокращения (млрд, млн, тыс., мл, л, кг, г и т.д.).
 *
 * Два преобразования:
 *   1. Десятичная точка → запятая: «4.5млрд» → «4,5 млрд».
 *   2. Пробел после сокращения: «4,5млрд» → «4,5 млрд».
 *
 * Правило консервативное — только для явных сокращений после чисел.
 */
const NUM_ABBREVS = ["млрд", "млн", "тыс", "трлн"];

const NUM_ABBR_RE = new RegExp(
  "(\\d)\\.(\\d)(" + alternation([...NUM_ABBREVS, "млрд.", "млн.", "тыс."]) + ")",
  "gi",
);

const NUM_ABBR_SPACE_RE = new RegExp(
  "(\\d)(" + alternation(NUM_ABBREVS) + ")",
  "gi",
);

export const numberAbbreviationRule: TypographyRule = {
  id: "number-abbreviations",
  name: "Числовые сокращения",
  description:
    "Форматирует числовые сокращения: «4.5млрд» → «4,5 млрд», «50кг» → «50 кг».",
  category: "numbers",
  enabledByDefault: true,
  apply(text, ctx) {
    let result = applyRegex(
      ctx,
      numberAbbreviationRule,
      text,
      NUM_ABBR_RE,
      (m) => m[1] + "," + m[2] + "\u00A0" + m[3].replace(".", ""),
    );
    result = applyRegex(
      ctx,
      numberAbbreviationRule,
      result,
      NUM_ABBR_SPACE_RE,
      (m) => m[1] + "\u00A0" + m[2].replace(".", ""),
    );
    return result;
  },
};