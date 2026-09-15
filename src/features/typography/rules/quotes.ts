import type { TypographyRule } from "../types";
import { applyRegex, mergePointChanges, type PointChange } from "./helpers";

/**
 * Русские кавычки.
 *
 * Stateful-алгоритм (не «заменить все " на »»): сканирует текст,
 * отслеживает вложенность и решает для каждой кавычки, открывающая
 * она или закрывающая, по контексту предыдущего И следующего символа.
 *
 *  - `"` и английские “ ” → «ёлочки»;
 *  - кавычки внутри кавычек → „лапки“ (в том числе английские “ ”,
 *    стоящие внутри «ёлочек»: «еще одни “слова”» → «еще одни „слова“»);
 *  - уже существующие «» и „“ нормализуются по вложенности;
 *  - апострофы (') не трогаются;
 *  - несбалансированные закрывающие кавычки остаются как есть
 *    (консервативное поведение: лучше не менять, чем испортить);
 *  - содержимое защищённых токенов (код, URL) недоступно правилу.
 *  - незакрытая открывающая кавычка закрывается в конце последней
 *    содержательной строки (не создавая «висячую» строку из кавычек).
 */
export const quotesRussianRule: TypographyRule = {
  id: "quotes-russian",
  name: "Русские кавычки",
  description:
    "Заменяет прямые и английские кавычки на «ёлочки», а вложенные — на „лапки“. Апострофы и защищённые фрагменты не затрагиваются.",
  category: "quotes",
  enabledByDefault: true,
  apply(text, ctx) {
    const changes: PointChange[] = [];
    let depth = 0;
    // Глубина только прямых кавычек ("). Нужна для двусмысленных случаев:
    // «слово " слово» может быть и открытием, и закрытием.
    let depthStraight = 0;
    let out = "";

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (ch === "\u00AB") {
        // « — открывающая ёлочка
        // Если уже внутри кавычек, заменяем на „лапки“ для вложенности
        if (depth > 0) {
          out += "\u201E";
          changes.push({ index: i, before: ch, after: "\u201E" });
        } else {
          out += ch;
        }
        depth += 1;
        continue;
      }
      if (ch === "\u201E") {
        // „ — открывающая лапка
        depth += 1;
        out += ch;
        continue;
      }
      if (ch === "\u00BB") {
        // » — закрывающая ёлочка
        if (depth > 0) depth -= 1;
        // Если закрываем вложенную кавычку (depth был > 1), используем "лапки"
        if (depth > 0) {
          out += "\u201C";
          changes.push({ index: i, before: ch, after: "\u201C" });
        } else {
          out += ch;
        }
        continue;
      }
      if (ch === "\u201C") {
        // “ — английская открывающая и одновременно русская закрывающая
        // „лапка“. Трактуем по контексту: на нулевом уровне это открывающая
        // английская кавычка (→ «), внутри «ёлочек» — либо открывающая
        // вложенная (после пробела и перед словом → „), либо закрывающая
        // уже открытой вложенной кавычки.
        if (depth === 0) {
          out += "\u00AB";
          changes.push({ index: i, before: ch, after: "\u00AB" });
          depth = 1;
        } else if (isNestedOpeningQuote(text, i)) {
          out += "\u201E";
          changes.push({ index: i, before: ch, after: "\u201E" });
          depth += 1;
        } else {
          out += ch;
          depth -= 1;
        }
        continue;
      }
      if (ch === "\u201D") {
        // ” — английская закрывающая. На верхнем уровне → », внутри
        // вложенной кавычки нормализуется в русскую закрывающую „…“.
        if (depth === 0) {
          out += ch; // несбалансированная — не трогаем
        } else if (depth === 1) {
          out += "\u00BB";
          changes.push({ index: i, before: ch, after: "\u00BB" });
          depth = 0;
        } else {
          out += "\u201C";
          changes.push({ index: i, before: ch, after: "\u201C" });
          depth -= 1;
        }
        continue;
      }
      if (ch === '"') {
        const prev = i > 0 ? text[i - 1] : "";
        const next = i + 1 < text.length ? text[i + 1] : "";
        const prevIsBoundary =
          prev === "" || /[\s\u00A0([{«„‹—–-]/.test(prev);
        const nextIsBoundary =
          next === "" || /[\s\u00A0.,;:!?…)\]}»“”]/.test(next);
        // Двусмысленный случай: пробел (или граница) стоит И до, И после
        // кавычки («году " ." ). Закрывающая кавычка тоже пишется после
        // пробела, поэтому решаем по глубине открытых прямых кавычек:
        // есть открытая — это её закрывающая пара.
        const treatAsClosing =
          prevIsBoundary && nextIsBoundary ? depthStraight > 0 : !prevIsBoundary;
        if (!treatAsClosing) {
          const openChar = depth === 0 ? "\u00AB" : "\u201E";
          out += openChar;
          changes.push({ index: i, before: ch, after: openChar });
          depth += 1;
          depthStraight += 1;
        } else if (depth === 0) {
          out += ch; // закрывающая без пары — консервативно оставляем
        } else if (depth === 1) {
          out += "\u00BB";
          changes.push({ index: i, before: ch, after: "\u00BB" });
          depth = 0;
          depthStraight = Math.max(0, depthStraight - 1);
        } else {
          out += "\u201C";
          changes.push({ index: i, before: ch, after: "\u201C" });
          depth -= 1;
          depthStraight = Math.max(0, depthStraight - 1);
        }
        continue;
      }
      out += ch;
    }

    // Одинарные кавычки: обрабатываем отдельно от двойных.
    // ''текст'' → 'текст' (U+2018/U+2019), апострофы внутри слов не трогаем.
    out = handleSingleQuotes(out, changes);

    // Закрываем незакрытые кавычки, если пользователь забыл закрывающую.
    // depth > 0 означает, что остались открытые кавычки без пары.
    if (depth > 0) {
      // Закрываем изнутри наружу: внутренние — «"» (U+201C), внешняя — "»" (U+00BB).
      const closing = "\u201C".repeat(Math.max(0, depth - 1)) + "\u00BB";
      // Кавычки ставим в конец последней содержательной строки: иначе при
      // тексте, оканчивающемся переводом строки, они образуют отдельную
      // строку и меняют структуру текста.
      const contentEnd = out.replace(/\n+$/, "").length;
      out = out.slice(0, contentEnd) + closing + out.slice(contentEnd);
      changes.push({ index: contentEnd, before: "", after: closing });
    }

    mergePointChanges(changes, ctx, quotesRussianRule);
    return out;
  },
};

/**
 * Лишняя точка после закрывающей кавычки.
 *
 * Если цитата завершается точкой, «?», «!» или многоточием, точка
 * после закрывающей кавычки не ставится: «…дней…». → «…дней…».
 * Если знака внутри нет, цитата — часть предложения, и точка после
 * кавычки остаётся: «Мы должны всё сделать».
 */
export const quotesTerminalDotRule: TypographyRule = {
  id: "quotes-terminal-dot",
  name: "Точка после закрывающей кавычки",
  description:
    "Убирает точку после закрывающей кавычки, если цитата уже завершается точкой, «?», «!» или многоточием («…дней…». → «…дней…»).",
  category: "quotes",
  enabledByDefault: true,
  apply(text, ctx) {
    return applyRegex(
      ctx,
      quotesTerminalDotRule,
      text,
      /([.!?…])[ \t]*([\u00BB\u201C\u201D])[ \t]*\.(?=\s|$)/gu,
      (m) => `${m[1]}${m[2]}`,
    );
  },
};


/**
 * Открывающая ли это вложенная кавычка (U+201C) внутри уже открытых
 * «ёлочек».
 *
 * Одна и та же “ в русском тексте — и английская открывающая, и
 * закрывающая «лапка». Признаки открывающей: слева пробел (или другая
 * граница — скобка, тире, кавычка), справа — слово. В остальных случаях
 * считаем её закрывающей: «„Привет“» остаётся без изменений.
 */
function isNestedOpeningQuote(text: string, index: number): boolean {
  const prev = index > 0 ? text[index - 1] : "";
  const next = index + 1 < text.length ? text[index + 1] : "";
  const afterBreak = prev === "" || /[\s([{\u00AB\u201E\u2014\u2013-]/.test(prev);
  const beforeWord = next !== "" && !/[\s.,;:!?)\u00BB\u201C\u201D]/.test(next);
  return afterBreak && beforeWord;
}

/**
 * Обработка одинарных кавычек.
 *
 * Правило: ' в начале слова (после пробела/скобки/тире) — открывающая кавычка ',
 * ' в конце слова (перед пробелом/пунктуацией/концом строки) — закрывающая '.
 * ' внутри слова (между буквами) — апостроф, не трогаем.
 *
 * Двойные '' обрабатываются парами: первая ' — открывающая, вторая — закрывающая.
 */
function handleSingleQuotes(text: string, changes: PointChange[]): string {
  let out = '';
  let i = 0;
  let depth = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch !== "'") {
      out += ch;
      i++;
      continue;
    }

    const prev = i > 0 ? text[i - 1] : '';
    const next = i + 1 < text.length ? text[i + 1] : '';
    const isPrevBoundary = prev === '' || /[\s([{«„‹"”\u2018\u2019—–-]/.test(prev);
    const isNextBoundary = next === '' || /[\s)]}»"”\u2018\u2019‹›,.:;!?…]/.test(next);
    const isBetweenLetters = /[a-zA-Zа-яёА-ЯЁ]/.test(prev) && /[a-zA-Zа-яёА-ЯЁ]/.test(next);

    // Апостроф внутри слова — не трогаем
    if (isBetweenLetters) {
      out += ch;
      i++;
      continue;
    }

    // Двойная кавычка '' — открывающая пара
    if (next === "'") {
      if (depth === 0) {
        out += '\u2018'; // ' (открывающая)
        changes.push({ index: i, before: "''", after: '\u2018' });
        depth = 1;
      } else {
        out += '\u2019'; // ' (закрывающая)
        changes.push({ index: i, before: "''", after: '\u2019' });
        depth = 0;
      }
      i += 2;
      continue;
    }

    // Одинарная кавычка на границе слова
    if (isPrevBoundary && !isNextBoundary) {
      // Открывающая кавычка
      out += '\u2018'; // '
      changes.push({ index: i, before: ch, after: '\u2018' });
      depth = 1;
    } else if (isNextBoundary && !isPrevBoundary) {
      // Закрывающая кавычка
      out += '\u2019'; // '
      changes.push({ index: i, before: ch, after: '\u2019' });
      depth = 0;
    } else if (isPrevBoundary && isNextBoundary) {
      // Обе границы — закрывающая (после текста)
      out += '\u2019';
      changes.push({ index: i, before: ch, after: '\u2019' });
      depth = 0;
    } else {
      out += ch;
    }
    i++;
  }

  return out;
}
