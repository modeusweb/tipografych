"use client";

import { useEffect, useState } from "react";
import { TYPOGRAPHY_CONFIG } from "@/features/typography/config";
import { countText, type TextCounts } from "@/features/typography/pipeline";
import { utf8ByteLength } from "@/lib/bytes";

export interface TextStats extends TextCounts {
  /** Точный размер в байтах UTF-8; null — оценка не требуется. */
  bytes: number | null;
  overLimit: boolean;
}

const EMPTY: TextStats = {
  chars: 0,
  words: 0,
  lines: 0,
  bytes: 0,
  overLimit: false,
};

const HEAVY_TEXT_THRESHOLD = TYPOGRAPHY_CONFIG.maxInputSizeBytes / 2;

/**
 * Счётчики исходного текста с debounce, чтобы не считать на каждый
 * ввод символа. Точный размер в байтах считается только для больших
 * текстов (для коротких оценка по длине заведомо ниже лимита).
 */
export function useTextStats(text: string, enabled: boolean): TextStats {
  const [stats, setStats] = useState<TextStats>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setStats(EMPTY);
      return;
    }
    if (text.length === 0) {
      setStats(EMPTY);
      return;
    }
    const timer = setTimeout(() => {
      const counts = countText(text);
      const bytes =
        text.length > HEAVY_TEXT_THRESHOLD ? utf8ByteLength(text) : null;
      const overLimit =
        bytes !== null
          ? bytes > TYPOGRAPHY_CONFIG.maxInputSizeBytes
          : text.length * 2 > TYPOGRAPHY_CONFIG.maxInputSizeBytes;
      setStats({ ...counts, bytes, overLimit });
    }, TYPOGRAPHY_CONFIG.countersDebounceMs);
    return () => clearTimeout(timer);
  }, [text, enabled]);

  return stats;
}
