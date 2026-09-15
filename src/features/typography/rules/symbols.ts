import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/** Знаки операций: рядом с ними «(c)» — переменная формулы, а не знак прав. */
const OPERATORS = "=+-*/<>%^\u00D7\u00B7\u00F7\u2264\u2265\u00B1\u2212\u2013\u2014";

/** Есть ли знак операции рядом с позицией (пробелы пропускаются). */
function isOperatorAround(text: string, index: number, step: 1 | -1): boolean {
  let i = index + step;
  while (i >= 0 && i < text.length && /[ \t\u00A0]/.test(text[i])) i += step;
  if (i < 0 || i >= text.length) return false;
  return OPERATORS.includes(text[i]);
}

/**
 * Знаки охраны прав и торговых марок.
 *
 * Текстовые обозначения заменяются символами:
 *   «(c)» → «©», «(r)» → «®», «(tm)» → «™».
 *
 * Кириллические «(с)» и «(тм)» тоже поддерживаются: их часто набирают
 * в русской раскладке.
 *
 * Правило выполняется ПОСЛЕ «brackets-spaces»: лишние пробелы внутри
 * скобок («( c )») к этому моменту уже убраны, поэтому результат не
 * зависит от количества проходов (идемпотентность).
 *
 * Защита от ложных срабатываний: если рядом со скобкой стоит знак
 * операции («A (c) = B + C»), скобка считается переменной формулы и
 * обозначение не заменяется.
 */
export const legalSymbolsRule: TypographyRule = {
  id: "symbols-legal",
  name: "Знаки ©, ®, ™",
  description:
    "Заменяет текстовые обозначения (c), (r) и (tm) на символы ©, ® и ™ (кириллические (с) и (тм) — тоже). В формулах переменные в скобках не трогаются.",
  category: "symbols",
  enabledByDefault: true,
  apply(text, ctx) {
    const convert = (source: string, pattern: RegExp, symbol: string): string =>
      applyRegex(ctx, legalSymbolsRule, source, pattern, (m) => {
        const open = m.index;
        const close = m.index + m[0].length - 1;
        if (isOperatorAround(source, open, -1) || isOperatorAround(source, close, 1)) {
          return m[0]; // переменная формулы — не знак охраны прав
        }
        return symbol;
      });

    // «(c)» и «(с)» (кириллическая «с»).
    let result = convert(text, /\([cC\u0441\u0421]\)/g, "\u00A9");
    // «(r)».
    result = convert(result, /\([rR]\)/g, "\u00AE");
    // «(tm)» и «(тм)».
    result = convert(result, /\((?:[tT][mM]|[\u0442\u0422][\u043C\u041C])\)/g, "\u2122");
    return result;
  },
};