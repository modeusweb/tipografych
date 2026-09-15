import type { RuleCategory, TypographyRule } from "../types";
import { quotesRussianRule, quotesTerminalDotRule } from "./quotes";
import { ellipsisRule } from "./ellipsis";
import { spaceAfterPunctRule, spaceBeforePunctRule, timeFormatRule } from "./punctuation";
import { legalSymbolsRule, plusMinusRule, superscriptRule } from "./symbols";
import { fractionsRule } from "./fractions";
import { multiplicationRule } from "./multiplication";
import { arrowsRule } from "./arrows";
import { dashRangesRule, dashSentenceRule, minusSignRule } from "./dashes";
import { bracketsSpacesRule, spaceBeforeBracketRule } from "./brackets";
import { percentSpacingRule } from "./percent";
import { temperatureRule, unitsSpacingRule } from "./units";
import { numbersThousandsRule } from "./numbers";
import { emptyLinesRule, spacesEdgesRule, spacesMultipleRule } from "./spaces";
import {
  nbspInitialsRule,
  nbspPrepositionsRule,
  nbspSymbolsRule,
  nbspUnitsRule,
} from "./nbsp";
import {
  currencyAbbreviationsRule,
  currencyRublesRule,
  currencySignGlueRule,
  currencySignPositionRule,
  currencySpacingRule,
} from "./currency";
import { nameCapitalizationRule } from "./names";
import { roomNumberRule } from "./room-number";
import { phoneFormatRule } from "./phones";
import { abbreviationsRule } from "./abbreviations";
import { cityAbbrRule } from "./city-abbr";
import { yearAbbrRule } from "./year-abbr";
import { numberAbbreviationRule } from "./number-abbreviations";

export { UNITS } from "./units";

/**
 * Реестр правил. ПОРЯДОК ВАЖЕН — это конвейер обработки:
 *
 *  1.  quotes-russian     кавычки (до пунктуации, чтобы исправлять пробелы внутри кавычек)
 *  2.  ellipsis           многоточие (до правил пробелов — «Ну ...» → «Ну…»)
 *  3.  quotes-terminal-dot точка после закрывающей кавычки («…дней…». → «…дней…»; после ellipsis)
 *  4.  space-before-punct пробелы перед знаками
 *  5.  space-after-punct  пробелы после знаков (внутри «т.е.» — неразрывный)
 *  6.  time-format        время ЧЧ:ММ
 *  7.  plus-minus         знак ± («5 +- 3» → «5 ± 3»; до правил тире и минуса)
 *  8.  dash-sentence      тире в предложении (сначала склейка «кто - то» → «кто-то»)
 *  9.  dash-ranges        диапазоны (после dash-sentence: «10 - 20» → «10–20»)
 * 10.  minus-sign         знак минуса («-10» → «−10»; после dash-ranges, чтобы не конкурировать с диапазонами «5-6»)
 * 11.  brackets-spaces    пробелы внутри скобок и кавычек
 * 12.  space-before-bracket пробел перед открывающей скобкой
 * 13.  symbols-legal      знаки ©, ®, ™ (после brackets-spaces: «( c )» → «(c)» → «©»)
 * 14.  fractions          дроби («1/2» и «1 / 2» → «½»)
 * 15.  multiplication     знак умножения («5х5», «3 x 10» → «5×5», «3×10»)
 * 16.  superscript        степени («10^8» → «10⁸»; после multiplication)
 * 17.  arrows             стрелки («->» → «→», до правил тире)
 * 18.  percent-spacing    проценты
 * 19.  temperature        температура и градусы
 * 20.  units-spacing      пробел между числом и единицей
 * 21.  currency-sign-glue «$ 100» → «$100» (до currency-spacing)
 * 22.  currency-spacing   отбивка знаков валют («5000000$» → «5000000 $»; выключено по умолчанию, только в «Издательской»)
 * 23.  currency-rubles    «90руб.» → «90 ₽» (после пробелов у пунктуации)
 * 24.  currency-abbreviations «100долл.» → «100 долл.»
 * 25.  currency-sign-position «$100» → «100 $» (только в «Издательской»)
 * 26.  numbers-thousands  разделители разрядов
 * 27.  spaces-multiple    двойные пробелы (до NBSP-правил)
 * 28.  spaces-edges       пробелы в начале/конце строк
 * 29.  empty-lines        лишние пустые строки (после spaces-edges)
 * 30.  name-capitalization заглавные буквы в именах (до nbsp-initials)
 * 31.  nbsp-prepositions  неразрывные пробелы: предлоги
 * 32.  nbsp-initials      неразрывные пробелы: инициалы
 * 33.  nbsp-symbols       неразрывные пробелы: № и §
 * 34.  nbsp-units         неразрывные пробелы: единицы измерения
 * 35.  phone-format       форматирование телефонов
 * 36.  abbreviations      пробелы после сокращений
 * 37.  city-abbr          сокращение «г.» перед городом
 * 38.  year-abbr          сокращение года («2026г.» → «2026 г.»)
 * 39.  number-abbreviations числовые сокращения (млрд, млн)
 * 40.  room-number        знак номера (N312 → № 312)
 *
 * Правила с флагом `runBeforeProtection` (phone-format, year-abbr)
 * выполняются раньше остальных — до того, как protection заменит
 * телефоны и даты токенами. Их порядок между собой тоже задаётся
 * этой таблицей.
 */
export const TYPOGRAPHY_RULES: readonly TypographyRule[] = [
  quotesRussianRule,
  ellipsisRule,
  quotesTerminalDotRule,
  spaceBeforePunctRule,
  spaceAfterPunctRule, timeFormatRule,
  plusMinusRule,
  dashSentenceRule,
  dashRangesRule,
  minusSignRule, bracketsSpacesRule, spaceBeforeBracketRule,
  legalSymbolsRule,
  fractionsRule,
  multiplicationRule,
  superscriptRule,
  arrowsRule,
  percentSpacingRule,
  temperatureRule,
  unitsSpacingRule,
  currencySignGlueRule,
  currencySpacingRule,
  currencyRublesRule,
  currencyAbbreviationsRule,
  currencySignPositionRule,
  numbersThousandsRule,
  spacesMultipleRule,
  spacesEdgesRule,
  emptyLinesRule,
  nameCapitalizationRule,
  nbspPrepositionsRule,
  nbspInitialsRule,
  nbspSymbolsRule,
  nbspUnitsRule,
  phoneFormatRule,
  abbreviationsRule,
  cityAbbrRule,
  yearAbbrRule,
  numberAbbreviationRule,
  roomNumberRule,
];

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  quotes: "Кавычки",
  dashes: "Тире",
  punctuation: "Пунктуация",
  spaces: "Пробелы",
  brackets: "Скобки",
  symbols: "Символы",
  nbsp: "Неразрывные пробелы",
  numbers: "Числа",
  units: "Единицы измерения",
  percent: "Проценты",
  case: "Регистр",
};

export function getRuleById(id: string): TypographyRule | undefined {
  return TYPOGRAPHY_RULES.find((rule) => rule.id === id);
}

/** Группировка правил по категориям — для интерфейса настроек. */
export function groupRulesByCategory(): Array<{
  category: RuleCategory;
  rules: TypographyRule[];
}> {
  const groups: Array<{ category: RuleCategory; rules: TypographyRule[] }> = [];
  for (const rule of TYPOGRAPHY_RULES) {
    const last = groups[groups.length - 1];
    if (last && last.category === rule.category) {
      last.rules.push(rule);
    } else {
      groups.push({ category: rule.category, rules: [rule] });
    }
  }
  return groups;
}
