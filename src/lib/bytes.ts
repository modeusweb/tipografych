import { TYPOGRAPHY_CONFIG } from "../features/typography/config";

/** Точный размер строки в байтах UTF-8. */
export function utf8ByteLength(text: string): number {
  const encoder = new TextEncoder();
  return encoder.encode(text).length;
}

/**
 * Быстрая предварительная оценка: если длина заведомо меньше лимита,
 * точный подсчёт байтов не нужен (каждый символ ≤ 2 байта UTF-8).
 */
export function isOverLimit(text: string): boolean {
  if (text.length * 2 <= TYPOGRAPHY_CONFIG.maxInputSizeBytes) return false;
  return utf8ByteLength(text) > TYPOGRAPHY_CONFIG.maxInputSizeBytes;
}

/** «1,2 МБ» для сообщений о лимите. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    const value = mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10;
    return `${String(value).replace(".", ",")} МБ`;
  }
  return `${Math.round(bytes / 1024)} КБ`;
}
