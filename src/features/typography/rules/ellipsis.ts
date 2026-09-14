import type { TypographyRule } from "../types";
import { applyReplacement } from "./helpers";

/**
 * Многоточие: три точки и конструкции вида «. . .» → символ ….
 *
 * Консервативные ограничения:
 *  - требуется минимум три точки;
 *  - между цифрами тоже работает: «10...12» → «10…12»;
 *  - точки внутри защищённых фрагментов (код, URL, версии) недоступны.
 */
export const ellipsisRule: TypographyRule = {
  id: "ellipsis",
  name: "Многоточие",
  description: "Заменяет три и более точки (и «. . .») на символ многоточия ….",
  category: "punctuation",
  enabledByDefault: true,
  apply(text, ctx) {
    let result = applyReplacement(
      ctx,
      ellipsisRule,
      text,
      /(?<![\d.])\.(?:[ \t]?\.)[ \t]?\.(?:[ \t]?\.)*(?![\d.])/g,
      "\u2026",
    );
    // Диапазон из точек между числами: «10...12» → «10…12».
    result = applyReplacement(ctx, ellipsisRule, result, /(?<=\d)\.{3,}(?=\d)/g, "\u2026");
    return result;
  },
};
