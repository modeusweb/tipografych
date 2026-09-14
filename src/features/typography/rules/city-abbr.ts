import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Сокращение «г.» (город) перед названием города.
 * «г.Москва» → «г. Москва», «г.Санкт-Петербург» → «г. Санкт-Петербург».
 *
 * Строгий контекст: только если после «г.» идёт заглавная буква
 * (название города). Это защищает от ложных срабатываний
 * в словах вроде «продолжительный» и т.п.
 */
export const cityAbbrRule: TypographyRule = {
  id: "city-abbr",
  name: "Сокращение «г.»",
  description:
    "Добавляет пробел после сокращения «г.» перед названием города («г.Москва» → «г. Москва»).",
  category: "punctuation",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      cityAbbrRule,
      text,
      /(\s|^)г\.([А-ЯЁA-Z])/g,
      (m) => m[1] + "г.\u00A0" + m[2],
    );
  },
};