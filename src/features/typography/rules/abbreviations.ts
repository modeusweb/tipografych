import type { TypographyRule } from "../types";
import { alternation, applyRegex } from "./helpers";

/**
 * Распространённые русские сокращения, после которых нужен пробел.
 * Например: «доб.12» → «доб.\u00A012», «стр.5» → «стр.\u00A05».
 *
 * Список консервативный — только однозначные случаи.
 */
const ABBREVIATIONS: readonly string[] = [
  "доб",
  "стр",
  "гл",
  "рис",
  "табл",
  "пп",
  "п",
  "ч",
  "ст",
  "д",
  "ул",
  "пр",
  "кв",
  "оф",
  "комн",
  "эт",
  "под",
  "офис",
];

const ABBR_RE = new RegExp(
  "(?<![A-Za-zА-Яа-яЁё0-9])(" + alternation(ABBREVIATIONS) + ")\\.(\\d)",
  "gi",
);

export const abbreviationsRule: TypographyRule = {
  id: "abbreviations",
  name: "Пробелы после сокращений",
  description:
    "Добавляет пробел после сокращения перед числом («доб.12» → «доб.\u00A012», «стр.5» → «стр.\u00A05»).",
  category: "punctuation",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(ctx, abbreviationsRule, text, ABBR_RE, (m) => m[1] + ".\u00A0" + m[2]);
  },
};