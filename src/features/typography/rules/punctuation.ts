import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Пунктуация: пробелы перед и после знаков.
 *
 *  - «Привет , мир !» → «Привет, мир!» (пробелы перед знаками убираются,
 *    кроме смайлов вида « :) », « :-( », « :( »);
 *  - «Привет,мир» → «Привет, мир» (после знака добавляется пробел,
 *    только если дальше идёт буква);
 *  - десятичные дроби «1,5» и «10.20» не трогаются (после знака цифра);
 *  - латинские сокращения «e.g.», «i.e.» не разрываются;
 *  - инициалы «И.И.» → «И. И.» — это правильно, а правило неразрывных
 *    пробелов потом склеит их на типографски верных местах.
 */
export const spaceBeforePunctRule: TypographyRule = {
  id: "space-before-punct",
  name: "Пробелы перед знаками",
  description:
    "Убирает пробелы и неразрывные пробелы перед запятой, точкой, двоеточием и другими знаками («Привет , мир» → «Привет, мир»).",
  category: "punctuation",
  enabledByDefault: true,
  apply(text, ctx) {
    // Смайл не разрываем: « :) », « :-( », « ;-( » — «глаза» не отрываются
    // от «рта». Точка «.» глазами не бывает, поэтому «слово. (примечание)»
    // исправляется корректно.
    return applyRegex(
      ctx,
      spaceBeforePunctRule,
      text,
      /[ \t\u00A0]+([,.:;!?…])/g,
      (m) => {
        const punct = m[1];
        const i = m.index + m[0].length;
        const next = text.charAt(i);
        const after = text.charAt(i + 1);
        if (
          (punct === ":" || punct === ";") &&
          ((next === "(" || next === ")") ||
            ((next === "-" || next === "\u2013") &&
              (after === "(" || after === ")")))
        ) {
          return m[0];
        }
        return punct;
      },
    );
  },
};

export const timeFormatRule: TypographyRule = {
  id: "time-format",
  name: "Время",
  description:
    "Склеивает время в формате ЧЧ:ММ («15 : 30» → «15:30»): внутри времени пробелов быть не должно.",
  category: "punctuation",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      timeFormatRule,
      text,
      // Часы 0–23, минуты 00–59. Слово-граница не даёт цепляться за хвост
      // больших чисел («115: 30» не время). Идемпотентно: замена совпадает.
      /\b([01]?\d|2[0-3])[ \t\u00A0]*:[ \t\u00A0]*([0-5]\d)(?!\d)/gu,
      (m) => `${m[1]}:${m[2]}`,
    );
  },
};

export const spaceAfterPunctRule: TypographyRule = {
  id: "space-after-punct",
  name: "Пробелы после знаков",
  description:
    "Добавляет отсутствующий пробел после знака препинания («Привет,мир» → «Привет, мир»). Десятичные дроби, сокращения вида «кв.м.» и «т.е.» не разрываются: внутри двухбуквенных сокращений ставится неразрывный пробел.",
  category: "punctuation",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      spaceAfterPunctRule,
      text,
      /([,.;:!?…])(?=\p{L}|[([])/gu,
      (m) => {
        const punct = m[1];
        const next = text.charAt(m.index + 1);
        // Смайл «:(», «;)» — пробел после «глаз» не ставим.
        if ((punct === ":" || punct === ";") && (next === "(" || next === ")")) {
          return punct;
        }
        // Пробел перед открывающей скобкой: «конец. (примечание)».
        if (next === "(" || next === "[") {
          return punct + " ";
        }
        const nextLetter = next;
        if (punct === "." && /[a-zа-яё]/.test(nextLetter)) {
          // Сокращения-единицы измерения: «кв.м.», «куб.м.», «кв.см.», «куб.см.» — не разрываем.
          // Проверяем контекст: 2-3 символа до точки + 1-2 символа после + точка.
          const beforeDot = m.index >= 2 ? text.slice(m.index - 2, m.index) : "";
          const beforeDot3 = m.index >= 3 ? text.slice(m.index - 3, m.index) : "";
          const after1 = text.charAt(m.index + 1);
          const after2 = text.charAt(m.index + 2);
          const after3 = text.charAt(m.index + 3);
          const prefix = /^(кв|куб)$/i.test(beforeDot3) ? beforeDot3 : beforeDot;
          const unit = /^(м|см|мм|км|дм)$/i.test(after1 + after2) ? after1 + after2 : after1;
          if (/^(кв|куб)$/i.test(prefix) && /^(м|см|мм|км|дм)$/i.test(unit)) {
            // Проверяем что после единицы идёт точка (для случаев типа «кв.м.»)
            const afterUnit = unit.length === 1 ? after2 : after3;
            if (afterUnit === ".") {
              return punct;
            }
          }
          // Латинские сокращения: «e.g.», «i.e.» — не разрываем (только латиница).
          const beforeDot1 = m.index >= 1 ? text.charAt(m.index - 1) : "";
          if (/^[a-z]$/i.test(beforeDot1) && /^[a-z]$/i.test(nextLetter)) {
            return punct;
          }
          // Русские двухбуквенные сокращения «т.е.», «т.к.», «з.п.» и
          // «г.Москва»: точка между одиночной буквой и следующей буквой —
          // часть сокращения, при переносе строки его части не должны
          // отрываться друг от друга, поэтому ставим неразрывный пробел.
          const beforeDot2 = m.index >= 2 ? text.charAt(m.index - 2) : "";
          if (
            /[а-яё]/.test(nextLetter) &&
            /^[а-яё]$/.test(beforeDot1) &&
            !/[\p{L}\p{N}]/u.test(beforeDot2)
          ) {
            return punct + "\u00A0";
          }
        }
        return punct + " ";
      },
    );
  },
};
