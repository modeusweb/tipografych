import type { TypographyRule } from "../types";
import { applyRegex, applyReplacement } from "./helpers";

/**
 * Двойные пробелы: сводит серии пробелов и табов к одному пробелу,
 * убирает «мусор» вокруг неразрывных пробелов, но сами неразрывные
 * пробелы не разрушает (правила NBSP выполняются позже).
 */
export const spacesMultipleRule: TypographyRule = {
  id: "spaces-multiple",
  name: "Двойные пробелы",
  description:
    "Сводит несколько подряд идущих пробелов и табов к одному пробелу.",
  category: "spaces",
  enabledByDefault: true,
  apply(text, ctx) {
    let result = applyReplacement(ctx, spacesMultipleRule, text, /[ \t]{2,}/g, " ");
    result = applyRegex(
      ctx,
      spacesMultipleRule,
      result,
      /[ \t]*\u00A0[ \t]+|[ \t]+\u00A0|\u00A0{2,}/g,
      () => "\u00A0",
    );
    return result;
  },
};

/**
 * Пробелы в начале и конце строк: триммирует каждую строку, не трогая
 * переводы строк и пустые строки (форматирование сохраняется).
 */
export const spacesEdgesRule: TypographyRule = {
  id: "spaces-edges",
  name: "Пробелы в начале и конце строк",
  description:
    "Убирает пробелы и табы в начале и в конце каждой строки, не затрагивая сами переводы строк.",
  category: "spaces",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyReplacement(
      ctx,
      spacesEdgesRule,
      text,
      /^[ \t\u00A0]+|[ \t\u00A0]+$/gm,
      "",
    );
  },
};
