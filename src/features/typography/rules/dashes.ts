import type { TypographyRule } from "../types";
import { applyRegex, isAlphanumeric } from "./helpers";

const isDigit = (char: string | undefined): boolean => char !== undefined && /\d/.test(char);

/**
 * Тире.
 *
 * dash-sentence — тире в предложении: дефис, окружённый пробелами,
 * превращается в длинное тире («Он сказал - привет» → «Он сказал — привет»).
 *  - не трогает диапазоны «10 - 20» (их доводит до ума правило диапазонов);
 *  - не трогает «--flag», файлы и email — они защищены токенами;
 *  - заодно подклеивает пробелы к «слипшемуся» тире («слово—слово»).
 *
 * dash-ranges — диапазоны: «10-20», «2020-2025» → «10–20», «2020–2025»
 * (короткое тире без пробелов). Телефоны, даты, IP и версии защищены
 * раньше правил, поэтому не пострадают.
 */
export const dashSentenceRule: TypographyRule = {
  id: "dash-sentence",
  name: "Тире в предложениях",
  description:
    "Превращает дефис с пробелами в длинное тире («Он сказал - привет» → «Он сказал — привет»), убирает висячие дефисы и добавляет пробелы к слипшемуся тире.",
  category: "dashes",
  enabledByDefault: true,
  apply(text, ctx) {
    // Перечислительные наречия: «Во-вторых-найти» → «Во-вторых — найти».
    // Только закрытый список наречий: дефис внутри обычных сложных слов
    // («красно-белый») не трогаем. Идемпотентно: после замены дефиса нет.
    let result = applyRegex(
      ctx,
      dashSentenceRule,
      text,
      /((?:[Вв]о-(?:первых|вторых|третьих|четвёртых|пятых|шестых|седьмых|восьмых|девятых|десятых))|(?:[Вв]-(?:третьих|четвёртых|пятых|шестых|седьмых|восьмых|девятых|десятых)))-(?=[А-ЯЁа-яёA-Za-z])/g,
      (m) => `${m[1]}${String.fromCharCode(0xa0, 0x2014)} `,
    );
    // Висячий дефис: пробел перед дефисом, но не после («тест -драйв» → «тест-драйв»).
    // Только если после дефиса БУКВА (не цифра!) — иначе это отрицательное число.
    result = applyRegex(
      ctx,
      dashSentenceRule,
      result,
      /(?<=\S)[ \t]+-{1,2}(?=\p{L})/gu,
      () => "-",
    );
    result = applyRegex(
      ctx,
      dashSentenceRule,
      result,
      // Цепочки дефисов (« - - ») захватываются целиком, чтобы
      // повторная обработка была идемпотентной.
      /(?<=\S)(?:[ \t]+-{1,2})+[ \t]+(?=\S)/g,
      (m) => {
        const prev = result.charAt(m.index - 1);
        const next = result.charAt(m.index + m[0].length);
        if (isDigit(prev) && isDigit(next)) return m[0]; // диапазон — см. dash-ranges
        return "\u00A0— ";
      },
    );
    result = applyRegex(
      ctx,
      dashSentenceRule,
      result,
      /([\p{L}\p{N}»"”)\u2026])\u2014(?=[\p{L}\p{N}«“(])/gu,
      (m) => {
        const prev = m[1];
        const next = result.charAt(m.index + m[0].length);
        if (isDigit(prev) && isDigit(next)) return m[0];
        return prev + " \u2014";
      },
    );
    return result;
  },
};

export const dashRangesRule: TypographyRule = {
  id: "dash-ranges",
  name: "Диапазоны",
  description:
    "Заменяет дефис в числовых диапазонах на короткое тире («2020-2025» → «2020–2025»). Дефисы внутри слов и идентификаторы не трогаются.",
  category: "dashes",
  enabledByDefault: true,
  apply(text, ctx) {
    let result = applyRegex(ctx, dashRangesRule, text, /(?<=\d)[ \t]?-[ \t]?(?=\d)/g, () => "\u2013");
    result = applyRegex(ctx, dashRangesRule, result, /(?<=\d)[\u2013\u2014](?=\d)/g, () => "\u2013");
    return result;
  },
};

/**
 * Минус.
 *
 * minus-sign — дефис, который стоит сразу перед числом и не является
 * частью диапазона, превращается в типографский минус U+2212
 * («-10 °C» → «−10 °C»): по высоте он совпадает с плюсом.
 *  - не трогает диапазоны «5-6» (перед дефисом цифра — это работа dash-ranges);
 *  - не трогает идентификаторы «ISO-8601», «UTF-8», «RS-232» (перед дефисом буква);
 *  - не трогает цепочки «--10» (двойной дефис) и телефоны — они защищены токенами.
 */
export const minusSignRule: TypographyRule = {
  id: "minus-sign",
  name: "Знак минуса",
  description:
    "Заменяет дефис перед числом на типографский минус («-10 °C» → «−10 °C»). Диапазоны («5-6»), телефоны и идентификаторы («ISO-8601») не трогаются.",
  category: "dashes",
  enabledByDefault: true,
  apply(text, ctx) {
    // Дефис сразу перед цифрой, но НЕ после буквы, цифры или другого дефиса:
    // иначе это диапазон, идентификатор или «слипшийся» двойной дефис.
    return applyRegex(ctx, minusSignRule, text, /(?<![\d\p{L}-])-(?=\d)/gu, () => "\u2212");
  },
};

export { isAlphanumeric };
