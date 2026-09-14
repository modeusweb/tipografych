"use client";

import { useRef, useState } from "react";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ClipboardDocumentIcon,
  DocumentArrowUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { TYPOGRAPHY_CONFIG } from "@/features/typography/config";
import type { TextStats } from "@/hooks/useTextStats";
import { charsLabel, linesLabel, wordsLabel } from "@/lib/format";
import { formatBytes } from "@/lib/bytes";
import { cx } from "@/lib/cx";

export interface SourcePanelProps {
  value: string;
  onChange: (value: string) => void;
  stats: TextStats;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  processing: boolean;
}

const ACCEPTED_EXTENSIONS = [".txt", ".text", ".md", ".markdown", ".csv", ".log", ".tsv"];

const LARGE_TEXT_THRESHOLD = 10_000;

export function SourcePanel({
  value,
  onChange,
  stats,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  processing,
}: SourcePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(value ? `${value}\n${text}` : text);
        showNotice("Текст вставлен из буфера обмена");
      }
    } catch {
      textareaRef.current?.focus();
      showNotice(
        "Браузер не дал доступ к буферу — вставьте текст сочетанием Ctrl+V",
      );
    }
  };

  const handleClear = () => {
    if (value.length > LARGE_TEXT_THRESHOLD) {
      const confirmed = window.confirm(
        "Очистить текст? Изменения нельзя будет отменить.",
      );
      if (!confirmed) return;
    }
    onChange("");
  };

  const readFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > TYPOGRAPHY_CONFIG.maxInputSizeBytes) {
      showNotice(
        `Файл слишком большой (${formatBytes(file.size)}). Максимум — ${formatBytes(TYPOGRAPHY_CONFIG.maxInputSizeBytes)}.`,
      );
      return;
    }
    const lowerName = file.name.toLowerCase();
    const ext = lowerName.slice(lowerName.lastIndexOf("."));
    const typeOk =
      file.type.startsWith("text/") ||
      file.type === "" ||
      ACCEPTED_EXTENSIONS.includes(ext);
    if (!typeOk) {
      showNotice("Поддерживаются только текстовые файлы (TXT, MD, CSV).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onChange(value ? `${value}\n${text}` : text);
      showNotice(`Файл «${file.name}» загружен`);
    };
    reader.onerror = () => showNotice("Не удалось прочитать файл.");
    reader.readAsText(file, "utf-8");
  };

  return (
    <section
      aria-label="Исходный текст"
      className={cx(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-white",
        "dark:bg-zinc-900",
        dragActive
          ? "border-indigo-400 ring-2 ring-indigo-200 dark:border-indigo-500 dark:ring-indigo-900"
          : "border-zinc-200 dark:border-zinc-700",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        readFile(file);
      }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-200 px-3 py-3.5 dark:border-zinc-700">
        <h2
          id="source-text-label"
          className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Исходный текст
        </h2>
        <span className="ml-auto hidden text-xs text-zinc-400 sm:inline dark:text-zinc-500">
          {charsLabel(stats.chars)} · {wordsLabel(stats.words)} ·{" "}
          {linesLabel(stats.lines)}
        </span>
        <span className="ml-auto text-xs text-zinc-400 sm:hidden dark:text-zinc-500">
          {stats.chars.toLocaleString("ru-RU")}
        </span>
      </div>

      <div className="flex items-center gap-1 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePaste}
          disabled={processing}
          aria-label="Вставить из буфера обмена"
          title="Вставить из буфера"
        >
          <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Вставить</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          aria-label="Загрузить текстовый файл"
          title="Открыть файл (TXT)"
        >
          <DocumentArrowUpIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Файл</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",") + ",text/plain"}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            readFile(file);
            event.target.value = "";
          }}
        />
        <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo || processing}
          aria-label="Отменить предыдущее состояние"
          title="Отменить"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo || processing}
          aria-label="Вернуть отменённое состояние"
          title="Вернуть"
        >
          <ArrowUturnRightIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden="true" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={value.length === 0 || processing}
          aria-label="Очистить текст"
          title="Очистить"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Очистить</span>
        </Button>
      </div>

      <div className="relative min-h-0 flex-1">
        <label htmlFor="source-text" className="sr-only">
          Исходный текст для типографической обработки
        </label>
        <textarea
          id="source-text"
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={processing}
          aria-invalid={stats.overLimit}
          aria-describedby={stats.overLimit ? "source-text-limit" : undefined}
          placeholder="Вставьте сюда текст, который нужно привести к типографическим нормам…"
          spellCheck={false}
          className={cx(
            "absolute inset-0 size-full resize-none border-0 bg-transparent p-4 text-[15px] leading-relaxed text-zinc-800 outline-none",
            "placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600",
          )}
        />
        {dragActive ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-indigo-50/80 text-sm font-medium text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-200">
            Отпустите файл, чтобы загрузить текст
          </div>
        ) : null}
      </div>

      <div aria-live="polite">
        {stats.overLimit ? (
          <p
            id="source-text-limit"
            role="alert"
            className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
          >
            Текст слишком большой: {formatBytes(stats.bytes ?? value.length * 2)}.
            Максимальный размер — {formatBytes(TYPOGRAPHY_CONFIG.maxInputSizeBytes)}.
          </p>
        ) : null}
        {notice ? (
          <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {notice}
          </p>
        ) : null}
      </div>
    </section>
  );
}


