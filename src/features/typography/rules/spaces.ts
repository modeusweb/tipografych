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

/**
 * Пустые строки.
 *
 * Три и более переводов строки подряд схлопываются до одного пустого
 * абзаца (максимум одна пустая строка между абзацами): «куча пустых
 * строк снизу» из реальных текстов не должна доезжать до результата.
 *
 * Одиночные переводы строк и одна пустая строка сохраняются: структура
 * текста (абзацы, списки, стихи) остаётся нетронутой. Правило выполняется
 * после «spaces-edges», поэтому строки из одних пробелов уже пусты.
 */
export const emptyLinesRule: TypographyRule = {
  id: "empty-lines",
  name: "Лишние пустые строки",
  description:
    "Схлопывает три и более переводов строки подряд: между абзацами остаётся максимум одна пустая строка.",
  category: "spaces",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyReplacement(ctx, emptyLinesRule, text, /\n{3,}/g, "\n\n");
  },
};