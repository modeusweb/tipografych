"use client";

import { useCallback, useRef } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DiffView } from "@/components/diff/DiffView";
import {
  CATEGORY_LABELS,
  TYPOGRAPHY_CONFIG,
  type TypographResult,
} from "@/features/typography";
import {
  changesLabel,
  charsLabel,
  formatNumber,
  wordsLabel,
} from "@/lib/format";

export interface ResultPanelProps {
  result: TypographResult | null;
  status: "idle" | "processing" | "error";
  showDiff: boolean;
  onToggleDiff: (show: boolean) => void;
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
  onReplaceSource: () => void;
  inputEmpty: boolean;
  sourceText: string;
}

const FEATURE_CHIPS = [
  "Кавычки",
  "Тире",
  "Пробелы",
  "Многоточия",
  "Числа",
  "Единицы",
];

/**
 * Ctrl/Cmd+A. Проверка по `event.code` не зависит от раскладки клавиатуры:
 * на русской раскладке `event.key` для клавиши A — это «ф», поэтому
 * сравнение только с "a" ломает шорткат (см. `key` ниже как fallback
 * для браузеров/событий без `code`).
 */
function isSelectAllShortcut(event: React.KeyboardEvent<HTMLElement>): boolean {
  if (!(event.ctrlKey || event.metaKey)) return false;
  if (event.altKey || event.shiftKey) return false;
  if (event.code === "KeyA") return true;
  const key = event.key.toLowerCase();
  return key === "a" || key === "ф";
}

/** Выделяет всё содержимое элемента — аналог Ctrl+A для нередактируемой области. */
function selectElementContents(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection) return false;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

export function ResultPanel({
  result,
  status,
  showDiff,
  onToggleDiff,
  onCopy,
  copied,
  onDownload,
  onReplaceSource,
  inputEmpty,
  sourceText,
}: ResultPanelProps) {
  const processing = status === "processing";
  const hasText = Boolean(result && result.text.length > 0);
  /**
   * Содержимое панели, к которому применяется Ctrl+A: текст результата
   * либо блок сравнения в режиме «Изменения».
   */
  const contentRef = useRef<HTMLDivElement>(null);

  /**
   * Ctrl/Cmd+A внутри панели выделяет её содержимое (а не всю страницу).
   * Панель фокусируется по клику (tabIndex={-1}), текст результата —
   * штатно (tabIndex={0}), поэтому обработчик висит на самой секции.
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (!isSelectAllShortcut(event)) return;
    const content = contentRef.current;
    if (!content || content.textContent === "") return;
    if (!selectElementContents(content)) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <section
      aria-label="Результат"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white outline-none dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Результат
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={showDiff ? "primary" : "ghost"}
            size="sm"
            onClick={() => onToggleDiff(!showDiff)}
            disabled={!result || !result.changed}
            aria-pressed={showDiff}
            title="Показать изменения"
          >
            <EyeIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Изменения</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReplaceSource}
            disabled={!hasText || processing}
            title="Заменить исходный текст результатом"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Заменить исходный</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            disabled={!hasText || processing}
            title="Скачать результат в TXT"
          >
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">TXT</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            disabled={!hasText || processing}
            title="Копировать результат"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{copied ? "Скопировано" : "Копировать"}</span>
          </Button>
        </div>
      </div>

      <ResultBody
        result={result}
        status={status}
        showDiff={showDiff}
        inputEmpty={inputEmpty}
        sourceText={sourceText}
        contentRef={contentRef}
      />
    </section>
  );
}

function ResultBody({
  result,
  status,
  showDiff,
  inputEmpty,
  sourceText,
  contentRef,
}: {
  result: TypographResult | null;
  status: "idle" | "processing" | "error";
  showDiff: boolean;
  inputEmpty: boolean;
  sourceText: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (status === "processing") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
        aria-live="polite"
      >
        <Spinner className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Обрабатываем текст…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
        aria-live="assertive"
      >
        <ExclamationTriangleIcon
          className="h-8 w-8 text-amber-500"
          aria-hidden="true"
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Не удалось обработать текст. Попробуйте ещё раз.
        </p>
      </div>
    );
  }

  if (!result || result.text.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <SparklesIcon
          className="h-10 w-10 text-zinc-300 dark:text-zinc-600"
          aria-hidden="true"
        />
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {inputEmpty
            ? "Вставьте текст, который хотите привести к типографическим нормам, и нажмите «Типографировать»."
            : "Текст готов к обработке — нажмите «Типографировать»."}
        </p>
        <ul
          aria-label="Что исправляет Типографыч"
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          {FEATURE_CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!result.changed) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="flex items-center gap-2.5 border-b border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/50"
          aria-live="polite"
        >
          <CheckBadgeIcon
            className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            Похоже, всё уже в порядке — изменений не найдено.
          </p>
        </div>
        <ResultText text={result.text} contentRef={contentRef} />
        <StatsLine result={result} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StatsBar result={result} />
      {showDiff ? (
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <DiffView before={sourceText} after={result.text} />
        </div>
      ) : (
        <ResultText text={result.text} contentRef={contentRef} />
      )}
    </div>
  );
}

/**
 * Текст результата: обычный текст (не HTML), доступный для выделения.
 * `contentRef` — тот же элемент, по которому работает Ctrl+A в панели.
 */
function ResultText({
  text,
  contentRef,
}: {
  text: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={contentRef}
      role="document"
      aria-label="Обработанный текст"
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
    >
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
        {text}
      </p>
    </div>
  );
}

/** Сводка статистики: количество изменений + разбивка по категориям. */
function StatsBar({ result }: { result: TypographResult }) {
  const { statistics } = result;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-200 px-3 py-3.5 text-xs dark:border-zinc-700">
      <span className="font-medium text-indigo-700 dark:text-indigo-300">
        {changesLabel(statistics.totalChanges)}
      </span>
      <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">
        ·
      </span>
      <span className="text-zinc-500 dark:text-zinc-400">
        {charsLabel(statistics.counts.chars)} · {wordsLabel(statistics.counts.words)}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {statistics.byCategory.map((category) => (
          <span
            key={category.category}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {CATEGORY_LABELS[category.category]}: {formatNumber(category.count)}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Минимальная строка статистики для случая «изменений нет». */
function StatsLine({ result }: { result: TypographResult }) {
  const { counts } = result.statistics;
  return (
    <div className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {charsLabel(counts.chars)} · {wordsLabel(counts.words)} ·{" "}
      {TYPOGRAPHY_CONFIG.resultFileName}
    </div>
  );
}



