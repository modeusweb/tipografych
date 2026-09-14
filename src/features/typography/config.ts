/**
 * Центральная конфигурация приложения и движка.
 * Никаких «магических чисел» за пределами этого файла.
 */
export const TYPOGRAPHY_CONFIG = {
  /** Максимальный размер входного текста в байтах (UTF-8). */
  maxInputSizeBytes: 5 * 1024 * 1024,

  /** Пресет, выбранный при первом запуске. */
  defaultPreset: "russian" as const,

  /** Использовать Web Worker, если браузер его поддерживает. */
  enableWebWorker: true,

  /** Тексты длиннее этого количества символов обрабатываются в Worker. */
  workerThresholdChars: 50_000,

  /** Задержка автообработки после последнего ввода, мс. */
  autoProcessDebounceMs: 800,

  /** Сколько примеров изменений хранится для режима «Показать изменения». */
  maxSamples: 300,

  /** Максимальная длина одной записи before/after в примере. */
  maxSampleLength: 120,

  /** Лимит строк для построчного diff (производительность). */
  diffMaxLines: 6000,

  /** Лимит «расстояния» для алгоритма Myers в diff. */
  diffMaxDistance: 3000,

  /** Максимум записей истории (undo/redo) исходного текста. */
  historyLimit: 30,

  /** Бюджет истории в символах: старые записи вытесняются. */
  historyCharBudget: 10_000_000,

  /** Ключ localStorage для настроек. Текст в localStorage не хранится. */
  localStorageKey: "typograph.settings.v1",

  /** Имя файла при скачивании результата. */
  resultFileName: "typograph-result.txt",

  /** Задержка пересчёта счётчиков (символы/слова), мс. */
  countersDebounceMs: 250,
} as const;

export type PresetId = "russian" | "minimal" | "publisher" | "custom";
