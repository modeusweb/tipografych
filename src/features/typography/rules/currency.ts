import type { TypographyRule } from "../types";
import { alternation, applyRegex } from "./helpers";

/**
 * Знаки валют.
 *
 * Между числом и знаком валюты ставится неразрывный пробел:
 * «5000000$» → «5000000\u00A0$», «4300000€» → «4300000\u00A0€».
 * Правило отключаемое — в некоторых контекстах валюту пишут через обычный пробел.
 */
const CURRENCY = ["$", "€", "£", "¥", "₽"];

const CURRENCY_RE = new RegExp("(\\d)(" + alternation(CURRENCY) + ")", "g");

export const currencySpacingRule: TypographyRule = {
  id: "currency-spacing",
  name: "Валютные символы",
  description:
    "Отделяет знаки валют ($, €, £, ¥, ₽) от числа неразрывным пробелом («5000000$» → «5000000\u00A0$).",
  category: "units",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(ctx, currencySpacingRule, text, CURRENCY_RE, (m) => m[1] + "\u00A0" + m[2]);
  },
};