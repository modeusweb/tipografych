import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Форматирование телефонных номеров.
 *
 * Нормализует пробелы и дефисы в российских номерах с кодом в скобках:
 *   «+7 ( 999 ) 123 - 45 - 67» → «+7 (999) 123-45-67»
 *   «+7(999)123-45-67» → «+7 (999) 123-45-67»
 *   «8(999)1234567» → «8 (999) 123-45-67»
 *
 * Правило выполняется ДО защиты фрагментов (`runBeforeProtection`),
 * после чего номер защищается токеном — остальные правила его не трогают.
 */
export const phoneFormatRule: TypographyRule = {
  id: "phone-format",
  name: "Форматирование телефонов",
  description:
    "Приводит телефонные номера к виду «+7 (999) 123-45-67»: убирает пробелы внутри скобок и вокруг дефисов, добавляет пробел после кода страны.",
  category: "spaces",
  enabledByDefault: true,
  runBeforeProtection: true,
  apply(text, ctx) {
    // Вариант с дефисами и произвольными пробелами.
    const dashed =
      /(\+7|8)[ \t]*\([ \t]*(\d{3})[ \t]*\)[ \t]*(\d{3})[ \t]*-[ \t]*(\d{2})[ \t]*-[ \t]*(\d{2})/g;
    let result = applyRegex(
      ctx,
      phoneFormatRule,
      text,
      dashed,
      (m) => `${m[1]} (${m[2]}) ${m[3]}-${m[4]}-${m[5]}`,
    );
    // Слитные группы без дефисов: «8(999)1234567».
    const solid = /(\+7|8)[ \t]*\([ \t]*(\d{3})[ \t]*\)[ \t]*(\d{3})(\d{2})(\d{2})(?!\d)/g;
    result = applyRegex(
      ctx,
      phoneFormatRule,
      result,
      solid,
      (m) => `${m[1]} (${m[2]}) ${m[3]}-${m[4]}-${m[5]}`,
    );
    return result;
  },
};