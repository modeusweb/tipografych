import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Проценты.
 * По русской типографической норме знак % пишется слитно с числом:
 * «50 %» → «50%». Правило отдельное и отключаемое — в англоязычных
 * текстах принято «50 %» с пробелом.
 *
 * Десятичная часть приводится к русской норме: «0.5 %» → «0,5%».
 * Версии ПО, IP-адреса и даты защищены токенами и сюда не попадают.
 */
export const percentSpacingRule: TypographyRule = {
  id: "percent-spacing",
  name: "Проценты",
  description:
    "Убирает пробел между числом и знаком процента («50 %» → «50%») и заменяет точку на запятую в дробной части («0.5 %» → «0,5%»).",
  category: "percent",
  enabledByDefault: true,
  apply(text, ctx) {
    // Десятичная запятая: «0.5 %», «0.5%» → «0,5%».
    // Не меняем точку на запятую если перед числом стоит знак ± или =
    let result = applyRegex(
      ctx,
      percentSpacingRule,
      text,
      /(?<![±=])(\d)\.(\d+)(?=[ \t\u00A0]*%)/g,
      (m) => `${m[1]},${m[2]}`,
    );
    result = applyRegex(
      ctx,
      percentSpacingRule,
      result,
      /(\d)[ \t\u00A0]+%/g,
      (m) => m[1] + "%",
    );
    return result;
  },
};
