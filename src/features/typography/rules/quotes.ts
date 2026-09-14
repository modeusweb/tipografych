import type { TypographyRule } from "../types";
import { mergePointChanges, type PointChange } from "./helpers";

/**
 * Русские кавычки.
 *
 * Stateful-алгоритм (не «заменить все " на »»): сканирует текст,
 * отслеживает вложенность и решает для каждой кавычки, открывающая
 * она или закрывающая, по контексту предыдущего символа.
 *
 *  - `"` и английские “ ” → «ёлочки»;
 *  - кавычки внутри кавычек → „лапки“;
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
    let out = "";

    const isProbablyOpening = (prev: string): boolean =>
      prev === "" || /[\s([{«„‹—–-]/.test(prev);

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
        // “ — английская открывающая И одновременно русская закрывающая
        // „лапка“. Трактуем по глубине: на нулевом уровне это открывающая
        // английская кавычка (→ «), внутри — закрывающая вложенной „…“.
        if (depth === 0) {
          out += "\u00AB";
          changes.push({ index: i, before: ch, after: "\u00AB" });
          depth = 1;
        } else {
          out += ch;
          depth -= 1;
        }
        continue;
      }
      if (ch === "\u201D") {
        // ” — английская закрывающая. На верхнем уровне → », глубже —
        // остаётся как есть (вложенные закрывающие уже „…“ или ”).
        if (depth === 0) {
          out += ch; // несбалансированная — не трогаем
        } else if (depth === 1) {
          out += "\u00BB";
          changes.push({ index: i, before: ch, after: "\u00BB" });
          depth = 0;
        } else {
          out += ch;
          depth -= 1;
        }
        continue;
      }
      if (ch === '"') {
        const prev = i > 0 ? text[i - 1] : "";
        if (isProbablyOpening(prev)) {
          out += depth === 0 ? "\u00AB" : "\u201E";
          changes.push({
            index: i,
            before: ch,
            after: depth === 0 ? "\u00AB" : "\u201E",
          });
          depth += 1;
        } else if (depth === 0) {
          out += ch; // закрывающая без пары — консервативно оставляем
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
