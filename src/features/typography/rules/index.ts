import type { RuleCategory, TypographyRule } from "../types";
import { quotesRussianRule } from "./quotes";
import { ellipsisRule } from "./ellipsis";
import { spaceAfterPunctRule, spaceBeforePunctRule, timeFormatRule } from "./punctuation";
import { legalSymbolsRule } from "./symbols";
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
 *  3.  space-before-punct пробелы перед знаками
 *  4.  space-after-punct  пробелы после знаков
 *  5.  time-format        время ЧЧ:ММ
 *  6.  dash-sentence      тире в предложении
 *  7.  dash-ranges        диапазоны (после dash-sentence: «10 - 20» → «10–20»)
 *  8.  minus-sign         знак минуса («-10» → «−10»; после dash-ranges, чтобы не конкурировать с диапазонами «5-6»)
 *  9.  brackets-spaces    пробелы внутри скобок и кавычек
 * 10.  space-before-bracket пробел перед открывающей скобкой
 * 11.  symbols-legal      знаки ©, ®, ™ (после brackets-spaces: «( c )» → «(c)» → «©»)
 * 12.  fractions          дроби («1/2» → «½»)
 * 13.  multiplication     знак умножения («5х5» → «5×5»)
 * 14.  arrows             стрелки («->» → «→», до правил тире)
 * 15.  percent-spacing    проценты
 * 16.  temperature        температура и градусы
 * 17.  units-spacing      пробел между числом и единицей
 * 18.  currency-spacing   отбивка знаков валют («5000000$» → «5000000 $»; выключено по умолчанию, только в «Издательской»)
 * 19.  currency-rubles    «90руб.» → «90 ₽» (после пробелов у пунктуации)
 * 20.  currency-abbreviations «100долл.» → «100 долл.»
 * 21.  currency-sign-position «$100» → «100 $» (только в «Издательской»)
 * 22.  numbers-thousands  разделители разрядов
 * 23.  spaces-multiple    двойные пробелы (до NBSP-правил)
 * 24.  spaces-edges       пробелы в начале/конце строк
 * 25.  empty-lines        лишние пустые строки (после spaces-edges)
 * 26.  name-capitalization заглавные буквы в именах (до nbsp-initials)
 * 27.  nbsp-prepositions  неразрывные пробелы: предлоги
 * 28.  nbsp-initials      неразрывные пробелы: инициалы
 * 29.  nbsp-symbols       неразрывные пробелы: № и §
 * 30.  nbsp-units         неразрывные пробелы: единицы измерения
 * 31.  phone-format       форматирование телефонов
 * 32.  abbreviations      пробелы после сокращений
 * 33.  city-abbr          сокращение «г.» перед городом
 * 34.  year-abbr          сокращение года («2026г.» → «2026 г.»)
 * 35.  number-abbreviations числовые сокращения (млрд, млн)
 * 36.  room-number        знак номера (N312 → № 312)
 *
 * Правила с флагом `runBeforeProtection` (phone-format, year-abbr)
 * выполняются раньше остальных — до того, как protection заменит
 * телефоны и даты токенами. Их порядок между собой тоже задаётся
 * этой таблицей.
 */
export const TYPOGRAPHY_RULES: readonly TypographyRule[] = [
  quotesRussianRule,
  ellipsisRule,
  spaceBeforePunctRule,
  spaceAfterPunctRule, timeFormatRule,
  dashSentenceRule,
  dashRangesRule,
  minusSignRule, bracketsSpacesRule, spaceBeforeBracketRule,
  legalSymbolsRule,
  fractionsRule,
  multiplicationRule,
  arrowsRule,
  percentSpacingRule,
  temperatureRule,
  unitsSpacingRule,
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
