import { describe, expect, it } from "vitest";
import { typograph } from "../pipeline";
import { hasUnresolvedTokens } from "../protection";
import { PRESETS } from "../presets";
import { TYPOGRAPHY_CONFIG } from "../config";
import { diffLines, inlineDiffParts } from "../diff";

const russian = PRESETS.find((p) => p.id === "russian")!;

const NBSP = "\u00A0";
const EM_DASH = "\u2014";
const PUA_OPEN = "\uE000";
const PUA_CLOSE = "\uE001";

const options = { enabledRules: russian.enabledRules, protection: {} };

function t(input: string): string {
  return typograph(input, options).text;
}

const TOKENS = [
  "https://example.com",
  "user@example.com",
  "+7 (999) 123-45-67",
  "12.05.2025",
  "192.168.1.1",
  "v1.2.3",
  "my-file.txt",
  "--flag",
  "«кавычки»",
  "слово",
  "20 °C",
  "50 %",
];

const SEPARATORS = [" ", "  ", "\n", "-", ".", ",", "!", "(", ")", ":"];

/** Детерминированный PRNG для повторяемых fuzz-тестов. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let u = Math.imul(a ^ (a >>> 15), 1 | a);
    u = (u + Math.imul(u ^ (u >>> 7), 61 | u)) ^ u;
    return ((u ^ (u >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Защита фрагментов", () => {
  it("URL не ломается", () => {
    const text = "Проверка https://example.com/test?a=1&b=2 в предложении.";
    expect(t(text)).toContain("https://example.com/test?a=1&b=2");
  });

  it("URL с дефисом в пути не превращается в тире", () => {
    const text = "Проверка https://example.com/2020-2025/report.";
    expect(t(text)).toContain("https://example.com/2020-2025/report");
  });

  it("голый домен не ломается", () => {
    const text = "Сайт example.com работает.";
    expect(t(text)).toContain("example.com");
  });

  it("email не ломается", () => {
    const text = "Пишите на user@example.com, пожалуйста.";
    expect(t(text)).toContain("user@example.com");
  });

  it("телефон не ломается", () => {
    const text = "Позвоните +7 (999) 123-45-67 сегодня.";
    expect(t(text)).toBe(text);
  });

  it("часть телефонного номера не превращается в тире", () => {
    const text = "Позвоните 123-45-67.";
    expect(t(text)).toContain("123-45-67");
  });

  it("даты не ломаются", () => {
    expect(t("Сегодня 12.05.2025, как обычно.")).toContain("12.05.2025");
    expect(t("ISO: 2025-05-12, ок.")).toContain("2025-05-12");
  });

  it("IP-адрес не ломается", () => {
    expect(t("Сервер 192.168.1.1 недоступен.")).toContain("192.168.1.1");
  });

  it("версия ПО не ломается", () => {
    expect(t("Установите v1.2.3 в проект.")).toContain("v1.2.3");
  });

  it("имена файлов не ломаются", () => {
    expect(t("Файлы my-file.txt в папке.")).toContain("my-file.txt");
  });

  it("голые расширения файлов не разбиваются", () => {
    const result = t("Макеты в формате .psd или .fig, а также .sketch лежат рядом.");
    expect(result).toContain(".psd");
    expect(result).toContain(".fig");
    expect(result).toContain(".sketch");
    expect(result).not.toContain(". psd");
    expect(result).not.toContain(". fig");
    expect(result).not.toContain(". sketch");
  });

  it("флаги CLI не ломаются", () => {
    expect(t("Запуск с --flag работает.")).toContain("--flag");
  });

  it("fenced-блок кода не типографизируется", () => {
    const text = 'Код:\n```\nconst value = "hello";\n```\nКонец.';
    const result = t(text);
    expect(result).toContain('const value = "hello";');
  });

  it("inline-код не типографизируется", () => {
    const result = t('Проверка `const value = "hello";` внутри.');
    expect(result).toContain('`const value = "hello";`');
  });

  it("HTML-теги сохраняются, текст типографизируется", () => {
    const result = t('<p class="text">Здесь - "Привет"</p>');
    expect(result).toBe(`<p class="text">Здесь${NBSP}${EM_DASH} «Привет»</p>`);
  });

  it("markdown-ссылки и inline-код не ломаются", () => {
    const text = "# Заголовок\n\n[ссылка](https://example.com) и `код` тут";
    const result = t(text);
    expect(result).toContain("[ссылка](https://example.com)");
    expect(result).toContain("`код`");
  });

  it("блок кода с отступом в markdown не типографизируется", () => {
    const text = 'Текст - пример.\n\n    const legacy = "  код  ";\n';
    const result = typograph(text, { ...options, format: "markdown" });
    expect(result.text).toBe(
      `Текст${NBSP}${EM_DASH} пример.\n\n    const legacy = "  код  ";\n`,
    );
  });

  it("текст вокруг блока с отступом обрабатывается", () => {
    const text = "Он сказал - \"Привет\".\n\n    const x = 1;\n";
    const result = typograph(text, { ...options, format: "markdown" });
    expect(result.text).toContain("    const x = 1;");
    expect(result.text).toContain("«Привет»");
  });

  it("приватные символы вырезаются из текста", () => {
    const result = t(`ы${PUA_OPEN}bc${PUA_CLOSE}4`);
    expect(result).toBe("ыbc4");
  });
});

describe("Идемпотентность", () => {
  it("повторная обработка не меняет результат", () => {
    const strings = [
      'Он сказал - "Привет"...',
      "Скидка 50 % на всё!",
      "Позвоните +7 (999) 123-45-67 или пишите на user@example.com.",
      "В 2020-2025 годах температура достигла 20 °C.",
      "И. И. Иванов купил 5 кг и 1000000 единиц.",
      "Текст с URL https://example.com/path-1?q=hello и `inline-кодом`.",
    ];
    for (const input of strings) {
      const first = typograph(input, options);
      const second = typograph(first.text, options);
      expect(second.text).toBe(first.text);
    }
  });

  it("fuzz: случайные тексты не падают и остаются идемпотентными", () => {
    const random = mulberry32(20260914);
    for (let i = 0; i < 200; i++) {
      const parts: string[] = [];
      const length = 5 + Math.floor(random() * 60);
      for (let j = 0; j < length; j++) {
        parts.push(TOKENS[Math.floor(random() * TOKENS.length)]);
        parts.push(SEPARATORS[Math.floor(random() * SEPARATORS.length)]);
      }
      const input = parts.join("");
      const first = typograph(input, options);
      const second = typograph(first.text, options);
      // Идемпотентность обработки.
      expect(second.text).toBe(first.text);
      // Приватные символы не «проглядывают» в результатах.
      expect(first.text.includes(PUA_OPEN)).toBe(false);
      expect(first.text.includes(PUA_CLOSE)).toBe(false);
      expect(hasUnresolvedTokens(first.text)).toBe(false);
    }
  });

  it("защищённые фрагменты сохраняются после случайных вставок", () => {
    const random = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const prefix = TOKENS[Math.floor(random() * TOKENS.length)];
      const suffix = TOKENS[Math.floor(random() * TOKENS.length)];
      const input = `${prefix} user@example.com ${suffix}`;
      const result = t(input);
      expect(result).toContain("user@example.com");
    }
  });
});

describe("Diff (строки и примеры изменений)", () => {
  it("одинаковые тексты дают пустой diff", () => {
    const rows = diffLines("один\nдва\nтри", "один\nдва\nтри");
    expect(rows).toEqual([]);
  });

  it("вставка строки в середину", () => {
    const rows = diffLines("один\nдва", "один\nтри\nдва");
    expect(rows).not.toBeNull();
    const removed = rows!.filter((r) => r.type === "removed").map((r) => r.text);
    const added = rows!.filter((r) => r.type === "added").map((r) => r.text);
    expect(removed).toEqual([]);
    expect(added).toEqual(["три"]);
  });

  it("большие тексты не строят diff (лимит строк)", () => {
    const longA = Array.from({ length: 7000 }, (_, i) => `строка ${i}`).join("\n");
    const longB = `${longA}\nдополнительная строка`;
    const result = diffLines(longA, longB);
    expect(result).toBeNull();
  });

  it("inlineDiffParts выделяет общее с изменённой серединой", () => {
    const parts = inlineDiffParts(
      'Он сказал - "Привет"',
      `Он сказал${NBSP}${EM_DASH} «Привет»`,
    );
    expect(parts).not.toBeNull();
    const removedMid = parts!.removed.find((p) => p.changed)!.text;
    const addedMid = parts!.added.find((p) => p.changed)!.text;
    expect(removedMid).toBe(' - "Привет"');
    expect(addedMid).toBe(`${NBSP}${EM_DASH} «Привет»`);
  });
});

describe("Настройки и лимиты", () => {
  it("самый большой лимит больше мегабайта в конфигурации", () => {
    expect(TYPOGRAPHY_CONFIG.maxInputSizeBytes).toBeGreaterThan(1024 * 1024);
    expect(TYPOGRAPHY_CONFIG.workerThresholdChars).toBeGreaterThan(1000);
  });

  it("текст ~380 КБ обрабатывается за разумное время", () => {
    const paragraph = "Он сказал - «Привет», потом 10кг или 20 градусов Цельсия.\n";
    const text = paragraph.repeat(7000); // ~380 КБ
    const started = Date.now();
    const result = typograph(text, options);
    const elapsed = Date.now() - started;
    expect(result.changed).toBe(true);
    expect(elapsed).toBeLessThan(15_000);
    expect(result.text.length).toBeGreaterThan(300_000);
  });
});