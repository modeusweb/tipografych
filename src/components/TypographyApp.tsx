"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Header } from "@/components/Header";
import { SourcePanel } from "@/components/editor/SourcePanel";
import { ResultPanel } from "@/components/result/ResultPanel";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { HelpDialog } from "@/components/help/HelpDialog";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Spinner } from "@/components/ui/Spinner";
import { typographer } from "@/lib/worker-client";
import { isOverLimit } from "@/lib/bytes";
import { copyTextToClipboard } from "@/lib/clipboard";
import { downloadTextFile } from "@/lib/download";
import { TYPOGRAPHY_CONFIG } from "@/features/typography/config";
import {
  resolveEnabledRules,
  type TypographResult,
} from "@/features/typography";
import type { TypographyOptions } from "@/features/typography/types";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { useTextStats } from "@/hooks/useTextStats";

type Status = "idle" | "processing" | "done" | "error";
type ViewMode = "split" | "result";

const HISTORY_LIMIT = TYPOGRAPHY_CONFIG.historyLimit;

/** История исходного текста с ограничением объёма (undo/redo). */
interface HistoryState {
  past: string[];
  future: string[];
  budget: number;
}

const EMPTY_HISTORY: HistoryState = { past: [], future: [], budget: 0 };

function pushHistory(history: HistoryState, value: string): HistoryState {
  const past = [...history.past, value];
  let budget = history.budget + value.length;
  while (past.length > HISTORY_LIMIT || budget > TYPOGRAPHY_CONFIG.historyCharBudget) {
    const removed = past.shift();
    if (removed === undefined) break;
    budget -= removed.length;
  }
  return { past, future: [], budget };
}

function undoHistory(
  history: HistoryState,
  current: string,
): { history: HistoryState; value: string | null } {
  if (history.past.length === 0) return { history, value: null };
  const past = [...history.past];
  const previous = past.pop()!;
  return {
    history: {
      past,
      future: [...history.future, current],
      budget: Math.max(0, history.budget - previous.length),
    },
    value: previous,
  };
}

function redoHistory(
  history: HistoryState,
  current: string,
): { history: HistoryState; value: string | null } {
  if (history.future.length === 0) return { history, value: null };
  const future = [...history.future];
  const next = future.pop()!;
  return {
    history: {
      past: [...history.past, current],
      future,
      budget: history.budget + current.length,
    },
    value: next,
  };
}

export function TypographyApp() {
  const { theme, setTheme } = useTheme();
  const { settings, update, applyPreset, enableRule, resetToPreset } = useSettings();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<TypographResult | null>(null);
  const [processedFrom, setProcessedFrom] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [history, setHistory] = useState<HistoryState>(EMPTY_HISTORY);
  const requestRef = useRef(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  const inputRef = useRef("");

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const stats = useTextStats(input, true);

  const buildOptions = useCallback((): TypographyOptions => {
    const current = settingsRef.current;
    return {
      enabledRules: resolveEnabledRules(current.preset, current.enabledRules),
      protection: current.protection,
      format: current.format,
    };
  }, []);

  const process = useCallback(
    async (sourceText: string) => {
      const trimmed = sourceText.trim();
      if (!trimmed) return;
      if (isOverLimit(sourceText)) {
        setStatus("idle");
        return;
      }
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setStatus("processing");
      try {
        const response = await typographer.process(sourceText, buildOptions());
        if (requestId !== requestRef.current) return; // устаревший ответ
        setResult(response);
        setProcessedFrom(sourceText);
        setStatus("done");
      } catch {
        if (requestId !== requestRef.current) return;
        setStatus("error");
      }
    },
    [buildOptions],
  );

  // Ручная обработка по кнопке и горячей клавише.
  const handleProcessClick = useCallback(() => {
    void process(input);
  }, [input, process]);

  const handleChangeInput = useCallback((value: string) => {
    inputRef.current = value;
    setInput(value);
    if (value.trim() === "") {
      setResult(null);
      setProcessedFrom("");
      setStatus("idle");
    }
  }, []);

  // Автообработка с debounce (только если включена в настройках).
  useEffect(() => {
    if (!settings.autoProcess) return;
    if (!input.trim()) return;
    const timer = setTimeout(() => {
      void process(input);
    }, TYPOGRAPHY_CONFIG.autoProcessDebounceMs);
    return () => clearTimeout(timer);
  }, [input, settings.autoProcess, process]);

  const undoInput = useCallback(() => {
    setHistory((previous) => {
      const next = undoHistory(previous, inputRef.current);
      if (next.value !== null) {
        inputRef.current = next.value;
        setInput(next.value);
      }
      return next.history;
    });
  }, []);

  const redoInput = useCallback(() => {
    setHistory((previous) => {
      const next = redoHistory(previous, inputRef.current);
      if (next.value !== null) {
        inputRef.current = next.value;
        setInput(next.value);
      }
      return next.history;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const ok = await copyTextToClipboard(result.text);
    if (ok) {
      setCopied(true);
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadTextFile(TYPOGRAPHY_CONFIG.resultFileName, result.text);
  }, [result]);

  const handleReplaceSource = useCallback(() => {
    if (!result) return;
    // processedFrom не трогаем: diff должен остаться относительно
    // исходного текста, из которого был получен результат.
    setHistory((previous) => pushHistory(previous, inputRef.current));
    inputRef.current = result.text;
    setInput(result.text);
  }, [result]);

  // Горячие клавиши: Ctrl/Cmd+Enter — обработка, Ctrl/Cmd+Shift+C — копирование.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (!meta) return;
      if (event.key === "Enter") {
        event.preventDefault();
        void process(inputRef.current);
      } else if (event.shiftKey && (event.key === "c" || event.key === "с" || event.key === "С")) {
        event.preventDefault();
        void handleCopy();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [process, handleCopy]);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="mx-auto flex w-full flex-1 flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleProcessClick}
            disabled={!input.trim() || stats.overLimit || status === "processing"}
            className="min-w-[13rem]"
            aria-keyshortcuts="Control+Enter Meta+Enter"
          >
            {status === "processing" ? (
              <>
                <Spinner className="h-5 w-5" />
                Обрабатываем…
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                Типографировать
              </>
            )}
          </Button>
          <SegmentedControl
            label="Режим просмотра"
            options={[
              { value: "split", label: "Рядом" },
              { value: "result", label: "Результат" },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
          <span className="ml-auto hidden select-none text-xs text-zinc-400 lg:inline dark:text-zinc-500">
            Ctrl+Enter — обработка · Ctrl+Shift+C — копировать
          </span>
        </div>

        <div
          className={
            viewMode === "split"
              ? "grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2"
              : "flex min-h-0 flex-1 flex-col"
          }
        >
          <div
            className={
              viewMode === "result"
                ? "hidden"
                : "flex min-h-[45vh] flex-col lg:min-h-0"
            }
          >
            <SourcePanel
              value={input}
              onChange={handleChangeInput}
              stats={stats}
              onUndo={undoInput}
              onRedo={redoInput}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              processing={status === "processing"}
            />
          </div>
          <div
            className={
              viewMode === "result"
                ? "flex min-h-0 flex-1 flex-col"
                : "flex min-h-[45vh] flex-col lg:min-h-0"
            }
          >
            <ResultPanel
              result={result}
              status={status === "done" ? "idle" : status}
              showDiff={showDiff}
              onToggleDiff={setShowDiff}
              onCopy={() => void handleCopy()}
              copied={copied}
              onDownload={handleDownload}
              onReplaceSource={handleReplaceSource}
              inputEmpty={input.length === 0}
              sourceText={processedFrom}
            />
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Текст обрабатывается в вашем браузере и не отправляется на сервер.
        </p>
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onPreset={applyPreset}
        onEnableRule={enableRule}
        onProtection={(protection) => update({ protection })}
        onFormat={(format) => update({ format })}
        onAutoProcess={(autoProcess) => update({ autoProcess })}
        onReset={resetToPreset}
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}


