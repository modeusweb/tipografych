import type { TypographyRule } from "../types";
import { alternation, applyRegex } from "./helpers";

/**
 * Знаки валют.
 *
 * currency-spacing — необязательная отбивка знака валюты неразрывным
 * пробелом: «5000000$» → «5000000\u00A0$», «4300000€» → «4300000\u00A0€».
 * По умолчанию выключено: знак валюты принято писать слитно с числом
 * («20$», «$20»), поэтому типограф не должен «исправлять» такую запись.
 * Правило включено только в пресете «Издательская».
 */
const CURRENCY = ["$", "€", "£", "¥", "₽"];

const CURRENCY_RE = new RegExp("(\\d)(" + alternation(CURRENCY) + ")", "g");

export const currencySpacingRule: TypographyRule = {
  id: "currency-spacing",
  name: "Валютные символы",
  description:
    "Отбивает знаки валют ($, €, £, ¥) от числа неразрывным пробелом («5000000$» → «5000000\\u00A0$»). По умолчанию выключено: «20$» остаётся слитным. Включено в пресете «Издательская».",
  category: "units",
  enabledByDefault: false,
  apply(text, ctx) {
    return applyRegex(ctx, currencySpacingRule, text, CURRENCY_RE, (m) => m[1] + "\u00A0" + m[2]);
  },
};

/**
 * Текстовые обозначения рубля → знак ₽.
 *
 * currency-rubles — «90руб.», «90 руб.», «5000 рублей» → «90\u00A0₽»,
 * «5000\u00A0₽». Только после числа: слово «руб.» само по себе не трогается.
 *
 * Точка после «руб.» неоднозначна: это может быть и точка сокращения
 * («100 руб. или 200 руб.»), и точка конца предложения («Цена 90руб.»).
 * Поэтому три случая:
 *  - «руб.» в конце строки/текста → точка сохраняется («90 ₽.»);
 *  - «руб.» перед заглавной буквой → точка сохраняется («₽. Доставка»);
 *  - «руб.» перед строчной буквой/цифрой → точка сокращения съедается
 *    («100 ₽ или»).
 */
const R = "[рР][уУ][бБ]";

/**
 * Слово «руб» и формы «рубль/рубля/рублей…». Регистр задан явно:
 * нижеследующие регексы НЕ используют флаг `i`, чтобы `\p{Lu}`
 * в lookahead-проверке заглавной буквы работал точно.
 */
const RUBLE_WORD =
  "(?:" +
  R + "[лЛ](?:[еЕ][йИ]|[яЯ][мМ][иИ]|[яЯ][хХ]|[яЯ][мМ]|[яЯ]|[ьЬ]|[ёЁ][мМ]|[еЕ][мМ]|[юЮ]|[иИ]|[еЕ])|" +
  R + ")";

export const currencyRublesRule: TypographyRule = {
  id: "currency-rubles",
  name: "Знак рубля ₽",
  description:
    "Заменяет текстовые обозначения рубля после числа на знак ₽ с неразрывным пробелом («90руб.» → «90\u00A0₽», «5000 рублей» → «5000\u00A0₽»).",
  category: "units",
  enabledByDefault: true,
  apply(text, ctx) {
    // Точка в конце строки/текста — граница предложения, сохраняем её.
    let result = applyRegex(
      ctx,
      currencyRublesRule,
      text,
      new RegExp("(\\d+)[ \\t\\u00A0]*" + RUBLE_WORD + "\\.(?=[\\n\\r]|$)", "gu"),
      (m) => m[1] + "\u00A0\u20BD.",
    );
    // Точка перед заглавной буквой — граница предложения, сохраняем её.
    result = applyRegex(
      ctx,
      currencyRublesRule,
      result,
      new RegExp("(\\d+)[ \\t\\u00A0]*" + RUBLE_WORD + "\\.(?=[ \\t\\u00A0]+\\p{Lu})", "gu"),
      (m) => m[1] + "\u00A0\u20BD.",
    );
    // Точка перед строчной буквой/цифрой — точка сокращения, убираем её.
    result = applyRegex(
      ctx,
      currencyRublesRule,
      result,
      new RegExp(
        "(\\d+)[ \\t\\u00A0]*" + RUBLE_WORD + "\\.(?=[ \\t\\u00A0]*[а-яёa-z0-9(«\\u2014\\u2013])",
        "gu",
      ),
      (m) => m[1] + "\u00A0\u20BD",
    );
    // Без точки вовсе: «90 руб», «5000 рублей».
    return applyRegex(
      ctx,
      currencyRublesRule,
      result,
      new RegExp("(\\d+)[ \\t\\u00A0]*" + RUBLE_WORD + "(?![.\\p{L}\\p{N}])", "gu"),
      (m) => m[1] + "\u00A0\u20BD",
    );
  },
};

/**
 * Буквенные обозначения валют.
 *
 * currency-abbreviations — число и словесное обозначение валюты не должны
 * слипаться: «100долл.» → «100\u00A0долл.», «50грн» → «50\u00A0грн».
 * Разделитель — неразрывный пробел, как и у знаков валют (currency-spacing).
 *
 * Рубль сюда не входит: его обрабатывает правило «Знак рубля ₽»
 * (currency-rubles), которое выполняется раньше. Формы слов даны целиком,
 * чтобы не трогать слова, начинающиеся так же: «100долларовый» не меняется.
 */
const CURRENCY_WORDS: readonly string[] = [
  "долларов", "доллары", "доллара", "доллар", "долл",
  "гривен", "гривны", "гривна", "грн",
  "копеек", "копейки", "копейка", "коп",
  "тенге", "евро", "тг",
];

const CURRENCY_WORDS_RE = new RegExp(
  "(\\d)[ \\t\\u00A0]*(" + alternation(CURRENCY_WORDS) + ")(?![\\p{L}\\p{N}])",
  "giu",
);

export const currencyAbbreviationsRule: TypographyRule = {
  id: "currency-abbreviations",
  name: "Валюты сокращённо",
  description:
    "Отбивает буквенные обозначения валют от числа неразрывным пробелом («100долл.» → «100\\u00A0долл.», «50грн» → «50\\u00A0грн»).",
  category: "units",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      currencyAbbreviationsRule,
      text,
      CURRENCY_WORDS_RE,
      (m) => m[1] + "\u00A0" + m[2],
    );
  },
};

/**
 * Валюта после числа.
 *
 * currency-sign-position — «$100» → «100\u00A0$», «€50» → «50\u00A0€».
 * Спорное правило: в русских текстах запись «$100» привычнее, поэтому
 * оно выключено по умолчанию и входит только в пресет «Издательская».
 *
 * Разряды из трёх цифр через обычный или неразрывный пробел входят
 * в захват числа («$ 90 000» → «90 000\u00A0$»), а хвостовой пробел перед
 * следующим словом — нет.
 */
const CURRENCY_PREFIX_RE =
  /([$\u20AC\u00A3\u00A5\u20BD])[ \t\u00A0]*(\d[\d\u00A0]*(?:[ \u00A0]\d{3})*)/g;

export const currencySignPositionRule: TypographyRule = {
  id: "currency-sign-position",
  name: "Валюта после числа",
  description:
    "Переносит знак валюты за число с неразрывным пробелом («$100» → «100\u00A0$», «€50» → «50\u00A0€»). Спорное правило — выключено по умолчанию.",
  category: "units",
  enabledByDefault: false,
  apply(text, ctx) {
    return applyRegex(ctx, currencySignPositionRule, text, CURRENCY_PREFIX_RE, (m) => m[2] + "\u00A0" + m[1]);
  },
};