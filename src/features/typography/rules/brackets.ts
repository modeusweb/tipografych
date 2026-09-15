import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Пробелы внутри скобок и кавычек.
 *  - «( текст )» → «(текст)»;
 *  - работает для круглых, квадратных и фигурных скобок;
 *  - убирает пробелы сразу после открывающих и перед закрывающими «» „“.
 * Содержимое защищённых фрагментов (код, HTML) недоступно правилу.
 */
export const spaceBeforeBracketRule: TypographyRule = {
  id: "space-before-bracket",
  name: "Пробел перед скобкой",
  description:
    "Ставит пробел перед открывающей скобкой, если буква слиплась с ней («команда(состоящая» → «команда (состоящая»). Латинские вызовы вида «f(x)» не трогаются.",
  category: "brackets",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      spaceBeforeBracketRule,
      text,
      // Только кириллица перед скобкой: латинские конструкции вида «f(x)»
      // и записи вида «5(шт)» не трогаем. Скобка должна иметь содержимое.
      /(?<=[А-ЯЁа-яё])\((?=[^\s)])/gu,
      () => " (",
    );
  },
};

export const bracketsSpacesRule: TypographyRule = {
  id: "brackets-spaces",
  name: "Пробелы внутри скобок и кавычек",
  description:
    "Убирает лишние пробелы внутри круглых, квадратных и фигурных скобок, а также сразу после « и „ и перед » и “.",
  category: "brackets",
  enabledByDefault: true,
  apply(text, ctx) {
    let result = applyRegex(
      ctx,
      bracketsSpacesRule,
      text,
      // «(» не трогаем, если это часть смайла: «:(», «:-(», «=(».
      /(?<![;:=])(?<![;:=]-)([([{«„])[ \t\u00A0]+(?=\S)/g,
      (m) => m[1],
    );
    result = applyRegex(
      ctx,
      bracketsSpacesRule,
      result,
      /[ \t\u00A0]+([)\]}»“])/g,
      (m) => m[1],
    );
    return result;
  },
};
