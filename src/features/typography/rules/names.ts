import type { TypographyRule } from "../types";
import { alternation, applyRegex } from "./helpers";

/**
 * Заглавные буквы в именах собственных.
 *
 * name-capitalization — «его коллега петров а. н. написал» →
 * «его коллега Петров А. Н. написал».
 *
 * Правило консервативное: имя капитализируется только тогда, когда оно
 * стоит после слова-обращения, звания или должности («коллега», «товарищ»,
 * «г-н», «профессор», «господин», «доктор» …) и состоит из фамилии и
 * одного-двух инициалов. Без такой связки слово трогать нельзя:
 * «его коллега сказал» — обычное предложение, а не имя.
 *
 * Капитализируются первая буква фамилии и строчные инициалы, поэтому
 * правильно набранное имя правило не меняет (идемпотентность).
 * Неразрывные пробелы в получившемся имени расставляет правило
 * «nbsp-initials», которое выполняется дальше по конвейеру.
 */

/** Обращения, звания, должности и их сокращения. */
const TITLES: readonly string[] = [
  "г-да", "г-жа", "г-н",
  "господа", "господин", "госпожа",
  "гражданин", "гражданка",
  "товарищ", "коллега", "коллеги",
  "профессор", "доцент", "академик", "доктор",
  "сударь", "сударыня", "мастер", "сержант",
  "проф", "акад", "тов", "д-р",
];

/** Варианты написания слова: «коллега» и «Коллега». */
function caseVariants(words: readonly string[]): string[] {
  return words.flatMap((word) => [
    word,
    word.charAt(0).toUpperCase() + word.slice(1),
  ]);
}

/**
 * Обращение + фамилия + инициалы. Группы: 1 — символ перед обращением,
 * 2 — обращение, 3 — пробел, 4 — фамилия, 5 — инициалы («а. н.», «а.н.»).
 */
const NAME_RE = new RegExp(
  "(^|[\\s([{\"'\\u00AB\\u201E\\u2014\\u2013-])(" +
    alternation(caseVariants(TITLES)) +
    ")(\\.?[ \\t\\u00A0]+)([а-яёА-ЯЁ][а-яёА-ЯЁ-]*)([ \\t\\u00A0]+[а-яё]\\.(?:[ \\t\\u00A0]*[а-яё]\\.)?)(?![\\p{L}\\p{N}])",
  "gmu",
);

function capitalizeFirst(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export const nameCapitalizationRule: TypographyRule = {
  id: "name-capitalization",
  name: "Заглавные буквы в именах",
  description:
    "Капитализирует имя после обращения или звания: «коллега петров а. н.» → «коллега Петров А. Н.». Без обращения имя не трогается.",
  category: "case",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(ctx, nameCapitalizationRule, text, NAME_RE, (m) => {
      const initials = m[5].replace(/[а-яё]/g, (letter: string) => letter.toUpperCase());
      return m[1] + m[2] + m[3] + capitalizeFirst(m[4]) + initials;
    });
  },
};