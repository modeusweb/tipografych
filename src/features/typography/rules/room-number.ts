import type { TypographyRule } from "../types";
import { applyRegex } from "./helpers";

/**
 * Номер комнаты/офиса.
 *
 * Латинская буква N (или №-подобная запись), за которой следуют цифры,
 * трактуется как обозначение номера: «комната N312» → «комната №\u00A0312».
 *
 * Защита от ложных срабатываний:
 *  - только после пробела/начала строки (чтобы не трогать «N-кратный», «N-мерный»);
 *  - только если дальше идут только цифры (не «N312A» — это артикул).
 */
export const roomNumberRule: TypographyRule = {
  id: "room-number",
  name: "Знак номера",
  description:
    "Заменяет латинскую N на знак номера с неразрывным пробелом («N312» → «№\u00A0312»).",
  category: "nbsp",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      roomNumberRule,
      text,
      /(?<=^|[\s(])N(\d{2,4})(?!\p{L})/gu,
      (m) => "\u2116\u00A0" + m[1],
    );
  },
};