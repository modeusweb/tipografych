/** Числа в русском формате: 1 248. */
export function formatNumber(value: number): string {
  return value.toLocaleString("ru-RU");
}

/** Русские формы множественного числа: 1 изменение / 2 изменения / 5 изменений. */
export function pluralize(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

export function changesLabel(count: number): string {
  return `${formatNumber(count)} ${pluralize(count, [
    "изменение",
    "изменения",
    "изменений",
  ])}`;
}

export function wordsLabel(count: number): string {
  return `${formatNumber(count)} ${pluralize(count, ["слово", "слова", "слов"])}`;
}

export function charsLabel(count: number): string {
  return `${formatNumber(count)} ${pluralize(count, ["символ", "символа", "символов"])}`;
}

export function linesLabel(count: number): string {
  return `${formatNumber(count)} ${pluralize(count, ["строка", "строки", "строк"])}`;
}
