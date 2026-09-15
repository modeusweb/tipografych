import type { InputFormat, ProtectionOptions } from "./types";

/**
 * Система «protected tokens».
 *
 * Перед обработкой из текста вырезаются фрагменты, которые нельзя
 * изменять (URL, email, телефоны, даты, IP, версии, имена файлов,
 * флаги CLI, код, HTML-теги, markdown-конструкции). На их место
 * подставляются маркеры из приватной зоны Unicode (U+E000…U+E001),
 * которые не матчатся ни одним правилом типографики. После обработки
 * исходные фрагменты восстанавливаются на свои места.
 *
 * В формате markdown защищаются также блоки кода с отступом
 * (4+ пробела или таб) — вместе с отступами, чтобы разметка не поехала.
 *
 * Это радикально снижает количество ложных срабатываний: правила
 * работают только с «настоящим» текстом.
 *
 * Формат токена: \uE000 + индекс фрагмента в base36 + \uE001.
 * Символы U+E000/U+E001 вырезаются из входного текста на этапе
 * нормализации, поэтому конфликтов с пользовательскими данными нет.
 */

const TOKEN_OPEN = "\uE000";
const TOKEN_CLOSE = "\uE001";
const TOKEN_RE = /\uE000([0-9a-z]+)\uE001/g;
const MAX_TOKENS = 200_000;

export interface ProtectedText {
  /** Текст с токенами вместо защищённых фрагментов. */
  text: string;
  /** Количество защищённых фрагментов. */
  count: number;
  /** Возвращает фрагменты на место токенов. */
  restore: (processed: string) => string;
}

interface Scanner {
  pattern: RegExp;
  validate?: (match: string) => boolean;
}

function runScanner(working: string, scanner: Scanner, fragments: string[]): string {
  const re = new RegExp(scanner.pattern.source, scanner.pattern.flags);
  let result = "";
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(working)) !== null) {
    const value = match[0];
    if (value.length === 0) {
      re.lastIndex += 1;
      continue;
    }
    if (scanner.validate && !scanner.validate(value)) continue;
    const index = fragments.push(value) - 1;
    if (fragments.length > MAX_TOKENS) {
      // Аварийный предел — прекращаем токенизацию.
      return working;
    }
    result +=
      working.slice(last, match.index) + TOKEN_OPEN + index.toString(36) + TOKEN_CLOSE;
    last = match.index + value.length;
  }
  result += working.slice(last);
  return result;
}

/** Диапазоны fenced-блоков ```…``` / ~~~…~~~ (построчно, надёжнее regex). */
function collectFencedRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const lines = text.split("\n");
  let offset = 0;
  let start = -1;
  let fenceChar = "";
  for (const line of lines) {
    const fenceMatch = /^ {0,3}(```+|~~~+)/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (start === -1) {
        start = offset;
        fenceChar = marker[0];
      } else if (marker[0] === fenceChar) {
        ranges.push([start, offset + line.length]);
        start = -1;
        fenceChar = "";
      }
    }
    offset += line.length + 1;
  }
  if (start !== -1) ranges.push([start, text.length]);
  return ranges;
}

/**
 * Индented-код Markdown: строки с отступом 4+ пробелов или табом.
 * Блок тянется, пока подряд идут строки с отступом; строка без отступа
 * (в том числе пустая) завершает блок — следующий блок с отступом будет
 * защищён отдельным диапазоном, поэтому содержимое кода не пострадает.
 */
function collectIndentedCodeRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const lines = text.split("\n");
  let offset = 0;
  let start = -1;
  let end = -1;
  for (const line of lines) {
    const isIndented = /^(?: {4,}|\t)/.test(line);
    if (isIndented) {
      if (start === -1) start = offset;
      end = offset + line.length;
    } else if (start !== -1) {
      ranges.push([start, end]);
      start = -1;
      end = -1;
    }
    offset += line.length + 1;
  }
  if (start !== -1) ranges.push([start, end]);
  return ranges;
}

function tokenizeRanges(
  text: string,
  ranges: Array<[number, number]>,
  fragments: string[],
): string {
  let result = text;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const [start, end] = ranges[i];
    const value = result.slice(start, end);
    if (!value) continue;
    const index = fragments.push(value) - 1;
    result =
      result.slice(0, start) +
      TOKEN_OPEN +
      index.toString(36) +
      TOKEN_CLOSE +
      result.slice(end);
  }
  return result;
}

const HTML_COMMENT: Scanner = { pattern: /<!--[\s\S]*?-->/g };
const HTML_TAG: Scanner = { pattern: /<\/?[a-zA-Z!][^>]*>/g };
const INLINE_CODE: Scanner = { pattern: /(`{1,3})[^`\n]*?\1/g };
const MD_LINK: Scanner = { pattern: /\]\([^()\n]{0,500}\)/g };
const URL: Scanner = { pattern: /(?:https?:\/\/|www\.)[^\s<>«»]+/gi };

const BARE_DOMAIN: Scanner = {
  pattern:
    /(?<![\w@.-])(?:[a-z0-9][a-z0-9-]*\.)+(?:ru|com|net|org|io|dev|app|edu|gov|info|biz|me|tv|co|ua|by|kz|site|online)(?:\/[^\s<>«»]*)?(?<![,.;:!?])(?![\w-])|(?<![\w@.-])(?:[а-яё0-9][а-яё0-9-]*\.)+(?:рф|ру|онлайн|сайт)(?:\/[^\s<>«»]*)?(?<![,.;:!?])(?![\wа-яё-])/gi,
};

const EMAIL: Scanner = {
  pattern: /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi,
};

const PHONE_MAIN: Scanner = {
  pattern: /\+?\d[\d\s()-]{7,}\d/g,
  validate: (value) => {
    const digits = value.replace(/\D+/g, "").length;
    if (digits < 10) return false;
    if (value.startsWith("+")) return true;
    if (value.includes("(")) return true;
    let hyphenJoints = 0;
    const jointRe = /\d-\d/g;
    while (jointRe.exec(value) !== null) hyphenJoints += 1;
    return hyphenJoints >= 2;
  },
};

/** «Хвост» телефонного номера без кода: 123-45-67. */
const PHONE_PART: Scanner = {
  pattern: /\d{2,3}-\d{2,3}-\d{2,3}/g,
  validate: (value) => {
    const digits = value.replace(/\D+/g, "").length;
    return digits >= 5 && digits <= 9;
  },
};

const DATE_ISO: Scanner = {
  pattern: /\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/g,
};
const DATE_DMY: Scanner = { pattern: /\d{1,2}[./]\d{1,2}[./]\d{2,4}/g };
const DATE_DASH: Scanner = { pattern: /\d{1,2}-\d{1,2}-\d{4}/g };

const IP: Scanner = { pattern: /\d{1,3}(?:\.\d{1,3}){3}/g };

/** Версии: v1.2.3, ver 2.0, 1.2.3-beta. Цены вида «1.5» не трогаем. */
const VERSION: Scanner = {
  pattern: /\b(?:v|ver\.?)[ \t]?\d+(?:\.\d+)+|(?<![\d.])\d+(?:\.\d+){2,}(?![\d.])/gi,
};

/**
 * Расширения файлов — общий список для FILE (имя + расширение) и
 * BARE_EXTENSION (расширение без имени). Включает форматы документов,
 * изображений (в том числе дизайн: psd, fig, sketch, xd), медиа и кода.
 */
const FILE_EXTENSIONS =
  "txt|text|md|markdown|json|jsonc|csv|tsv|pdf|doc|docx|xls|xlsx|ppt|pptx|" +
  "ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|c|cpp|h|hpp|cs|php|html?|htm|" +
  "css|scss|xml|svg|yml|yaml|toml|ini|log|" +
  "zip|rar|7z|tar|gz|" +
  "png|jpe?g|gif|webp|psd|psb|ai|fig|sketch|xd|cdr|indd|tiff?|bmp|eps|ico|" +
  "mp3|mp4|avi|mov|wav|" +
  "sql|sh|bat|env|lock|exe|dll|" +
  "rtf|odt|ods|odp|epub|fb2";

const FILE: Scanner = {
  pattern: new RegExp(
    "(?<![\\w@/-])[a-zа-яё0-9][\\wа-яё.-]*\\.(?:" + FILE_EXTENSIONS + ")\\b",
    "gi",
  ),
};

/**
 * Расширение без имени файла: «в формате .psd или .fig». Точка здесь —
 * часть обозначения расширения, а не конец предложения; без защиты
 * правила пробелов превратили бы «.psd» в «. psd».
 */
const BARE_EXTENSION: Scanner = {
  pattern: new RegExp("(?<![\\w@/.-])\\.(?:" + FILE_EXTENSIONS + ")\\b", "gi"),
};

const CLI_FLAG: Scanner = {
  pattern: /(?<=\s|^)--?[a-zA-Z][a-zA-Z0-9-]*/g,
};

/**
 * Выделяет защищённые фрагменты и возвращает текст с токенами.
 *
 * Порядок сканеров важен: более специфичные конструкции идут первыми,
 * чтобы их части не «съедались» более общими.
 */
export function protectFragments(
  text: string,
  protection: ProtectionOptions,
  format: InputFormat,
): ProtectedText {
  const fragments: string[] = [];
  let working = text;

  const fencedEnabled = protection.markdown || (protection.code && format === "markdown");
  const inlineCodeEnabled = protection.code || protection.markdown;
  /**
   * Блоки кода с отступом — тоже код, но такая разметка есть только
   * в Markdown, поэтому защищаем их лишь в этом формате. Диапазоны
   * считаем после fenced-блоков: их содержимое уже заменено токенами
   * и на отступы повлиять не может.
   */
  const indentedCodeEnabled = format === "markdown" && fencedEnabled;

  if (fencedEnabled) {
    working = tokenizeRanges(working, collectFencedRanges(working), fragments);
  }
  if (indentedCodeEnabled) {
    working = tokenizeRanges(working, collectIndentedCodeRanges(working), fragments);
  }
  if (inlineCodeEnabled) working = runScanner(working, INLINE_CODE, fragments);

  if (protection.html || protection.code || format === "html") {
    working = runScanner(working, HTML_COMMENT, fragments);
    working = runScanner(working, HTML_TAG, fragments);
  }
  if (protection.markdown) working = runScanner(working, MD_LINK, fragments);
  if (protection.urls) working = runScanner(working, URL, fragments);
  if (protection.emails) working = runScanner(working, EMAIL, fragments);
  if (protection.urls) working = runScanner(working, BARE_DOMAIN, fragments);

  // Телефоны, даты, IP, версии, файлы и флаги защищаются всегда —
  // это встроенная страховка, не зависящая от настроек пользователя.
  working = runScanner(working, PHONE_MAIN, fragments);
  working = runScanner(working, PHONE_PART, fragments);
  working = runScanner(working, DATE_ISO, fragments);
  working = runScanner(working, DATE_DMY, fragments);
  working = runScanner(working, DATE_DASH, fragments);
  working = runScanner(working, IP, fragments);
  working = runScanner(working, VERSION, fragments);
  working = runScanner(working, FILE, fragments);
  working = runScanner(working, BARE_EXTENSION, fragments);
  working = runScanner(working, CLI_FLAG, fragments);

  return {
    text: working,
    count: fragments.length,
    restore: (processed: string) =>
      processed.replace(TOKEN_RE, (token, rawIndex: string) => {
        const index = parseInt(rawIndex, 36);
        const fragment = fragments[index];
        if (fragment === undefined) {
          // Токен повреждён правилами — возвращаем содержимое без маркеров,
          // чтобы приватные символы не попали в результат.
          return token.slice(TOKEN_OPEN.length, token.length - TOKEN_CLOSE.length);
        }
        return fragment;
      }),
  };
}

/** Есть ли в тексте незакрытые токены (диагностика в тестах). */
export function hasUnresolvedTokens(text: string): boolean {
  TOKEN_RE.lastIndex = 0;
  return TOKEN_RE.test(text);
}

