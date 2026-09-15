import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Знак умножения.
 *
 * Латинская «x» и кириллическая «х» между числами становятся знаком
 * умножения: «5х5» → «5×5», «10x10» → «10×10».
 *
 * Защита от ложных срабатываний:
 *  - заменяется только «х», у которой с обеих сторон цифры (в словах
 *    «2х-комнатная» и «20х годов» буква стоит на границе слова и не трогается);
 *  - hex-литералы («0x1F», «0Xdead») не трогаются: перед «x» стоит
 *    ровно один нуль, а не число.
 * Содержимое кода и других защищённых фрагментов недоступно правилу.
 */
export const multiplicationRule: TypographyRule = {
  id: "multiplication",
  name: "Знак умножения",
  description:
    "Заменяет «x» и кириллическую «х» между числами на знак умножения × («5х5» → «5×5»). Hex-литералы вида 0x1F не трогаются.",
  category: "symbols",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(ctx, multiplicationRule, text, /(?<=\d)[xX\u0445\u0425](?=\d)/g, (m) => {
      const prev = text.charAt(m.index - 1);
      const beforePrev = m.index >= 2 ? text.charAt(m.index - 2) : "";
      // «0x1F», «0Xdead»: перед «x» — один нуль, значит это hex-литерал.
      if (prev === "0" && !/\d/.test(beforePrev)) return m[0];
      return "\u00D7"; // ×
    });
  },
};