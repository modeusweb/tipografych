import type { RuleCategory, TypographyRule } from "../types";
import { quotesRussianRule } from "./quotes";
import { ellipsisRule } from "./ellipsis";
import { spaceAfterPunctRule, spaceBeforePunctRule } from "./punctuation";
import { dashRangesRule, dashSentenceRule } from "./dashes";
import { bracketsSpacesRule } from "./brackets";
import { percentSpacingRule } from "./percent";
import { temperatureRule, unitsSpacingRule } from "./units";
import { numbersThousandsRule } from "./numbers";
import { spacesEdgesRule, spacesMultipleRule } from "./spaces";
import {
  nbspInitialsRule,
  nbspPrepositionsRule,
  nbspSymbolsRule,
  nbspUnitsRule,
} from "./nbsp";
import { currencySpacingRule } from "./currency";
import { roomNumberRule } from "./room-number";
import { phoneFormatRule } from "./phones";
import { abbreviationsRule } from "./abbreviations";
import { cityAbbrRule } from "./city-abbr";
import { numberAbbreviationRule } from "./number-abbreviations";

export { UNITS } from "./units";

/**
 * Реестр правил. ПОРЯДОК ВАЖЕН — это конвейер обработки:
 *
 *  1.  quotes-russian     кавычки (до пунктуации, чтобы исправлять пробелы внутри кавычек)
 *  2.  ellipsis           многоточие (до правил пробелов — «Ну ...» → «Ну…»)
 *  3.  space-before-punct пробелы перед знаками
 *  4.  space-after-punct  пробелы после знаков
 *  5.  dash-sentence      тире в предложении
 *  6.  dash-ranges        диапазоны (после dash-sentence: «10 - 20» → «10–20»)
 *  7.  brackets-spaces    пробелы внутри скобок и кавычек
 *  8.  percent-spacing    проценты
 *  9.  temperature        температура и градусы
 *  10. units-spacing      пробел между числом и единицей
 *  11. currency-spacing   валютные символы
 *  12. numbers-thousands  разделители разрядов
 *  13. spaces-multiple    двойные пробелы (до NBSP-правил)
 *  14. spaces-edges       пробелы в начале/конце строк
 *  15. nbsp-prepositions  неразрывные пробелы: предлоги
 *  16. nbsp-initials      неразрывные пробелы: инициалы
 *  17. nbsp-symbols       неразрывные пробелы: № и §
 *  18. nbsp-units         неразрывные пробелы: единицы измерения
 *  19. phone-format       форматирование телефонов
 *  20. abbreviations      пробелы после сокращений
 *  21. city-abbr          сокращение «г.» перед городом
 *  22. number-abbreviations числовые сокращения (млрд, млн)
 *  23. room-number        знак номера (N312 → № 312)
 */

export const TYPOGRAPHY_RULES: readonly TypographyRule[] = [
  quotesRussianRule,
  ellipsisRule,
  spaceBeforePunctRule,
  spaceAfterPunctRule,
  dashSentenceRule,
  dashRangesRule,
  bracketsSpacesRule,
  percentSpacingRule,
  temperatureRule,
  unitsSpacingRule,
  currencySpacingRule,
  numbersThousandsRule,
  spacesMultipleRule,
  spacesEdgesRule,
  nbspPrepositionsRule,
  nbspInitialsRule,
  nbspSymbolsRule,
  nbspUnitsRule,
  phoneFormatRule,
  abbreviationsRule,
  cityAbbrRule,
  numberAbbreviationRule,
  roomNumberRule,
];

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  quotes: "Кавычки",
  dashes: "Тире",
  punctuation: "Пунктуация",
  spaces: "Пробелы",
  brackets: "Скобки",
  nbsp: "Неразрывные пробелы",
  numbers: "Числа",
  units: "Единицы измерения",
  percent: "Проценты",
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
