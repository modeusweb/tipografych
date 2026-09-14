"use client";

import { useMemo, useState } from "react";
import {
  diffLines,
  inlineDiffParts,
  type DiffRow,
  type InlinePart,
} from "@/features/typography/diff";

const CONTEXT_LINES = 2;
const MAX_RENDERED_ROWS = 400;

interface DiffBlock {
  kind: "change" | "gap";
  rows?: DiffRow[];
  removedText?: string;
  addedText?: string;
  gapCount?: number;
}

/** Склеивает последовательности удалённых/добавленных строк в блоки. */
function buildBlocks(rows: DiffRow[]): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let gap: DiffRow[] = [];
  let i = 0;
  const flushGap = () => {
    if (gap.length > 0) {
      blocks.push({ kind: "gap", rows: gap, gapCount: gap.length });
      gap = [];
    }
  };
  while (i < rows.length) {
    const row = rows[i];
    if (row.type === "equal") {
      gap.push(row);
      i += 1;
      continue;
    }
    const removedRows: DiffRow[] = [];
    const addedRows: DiffRow[] = [];
    while (i < rows.length && rows[i].type === "removed") {
      removedRows.push(rows[i]);
      i += 1;
    }
    while (i < rows.length && rows[i].type === "added") {
      addedRows.push(rows[i]);
      i += 1;
    }
    // Обрезаем «хвост» одинаковых строк вокруг блоков.
    if (gap.length > CONTEXT_LINES) {
      blocks.push({ kind: "gap", rows: gap.slice(0, CONTEXT_LINES), gapCount: gap.length });
    } else {
      flushGap();
    }
    gap = [];
    for (let p = 0; p < Math.max(removedRows.length, addedRows.length); p += 1) {
      const removed = removedRows[p];
      const added = addedRows[p];
      if (removed && added) {
        blocks.push({
          kind: "change",
          removedText: removed.text,
          addedText: added.text,
        });
      } else if (removed) {
        blocks.push({ kind: "change", removedText: removed.text });
      } else if (added) {
        blocks.push({ kind: "change", addedText: added.text });
      }
    }
  }
  flushGap();
  return blocks;
}

function InlineRow({ text, changed }: { text: string; changed: boolean }) {
  return (
    <span className={changed ? "rounded bg-amber-200/70 dark:bg-amber-400/30" : undefined}>
      {text}
    </span>
  );
}

function InlinePair({
  removed,
  added,
}: {
  removed: string;
  added: string;
}) {
  const parts = inlineDiffParts(removed, added);
  return (
    <>
      <div className="rounded bg-rose-50 px-2 py-0.5 font-mono text-[13px] text-rose-900 line-through decoration-rose-300 dark:bg-rose-950/50 dark:text-rose-200">
        {parts ? (
          parts.removed.map((part: InlinePart, index: number) => (
            <InlineRow key={index} text={part.text} changed={part.changed} />
          ))
        ) : (
          <span>{removed}</span>
        )}
      </div>
      <div className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[13px] text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
        {parts ? (
          parts.added.map((part: InlinePart, index: number) => (
            <InlineRow key={index} text={part.text} changed={part.changed} />
          ))
        ) : (
          <span>{added}</span>
        )}
      </div>
    </>
  );
}

export interface DiffViewProps {
  before: string;
  after: string;
}

/**
 * Режим «Показать изменения»: пары строк было/стало с подсветкой
 * изменённых фрагментов. Для очень больших текстов diff отключается
 * (движок возвращает null) — вместо него доступна сводка изменений.
 */
export function DiffView({ before, after }: DiffViewProps) {
  const rows = useMemo(() => diffLines(before, after), [before, after]);
  const [showAll, setShowAll] = useState(false);

  const blocks = useMemo(() => (rows ? buildBlocks(rows) : []), [rows]);

  if (rows === null) {
    return (
      <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
        Текст слишком большой для построчного сравнения. Посмотрите сводку
        изменений под результатом или скачайте файл.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
        Тексты совпадают — изменений нет.
      </p>
    );
  }

  // Ограничиваем количество блоков, чтобы не подвесить браузер.
  let rendered = blocks;
  let hiddenRows = 0;
  if (!showAll && blocks.length > MAX_RENDERED_ROWS) {
    rendered = blocks.slice(0, MAX_RENDERED_ROWS);
    hiddenRows = rows.length - MAX_RENDERED_ROWS;
  }

  return (
    <div className="flex flex-col gap-3">
      {rendered.map((block, index) => {
        if (block.kind === "gap") {
          const visible = (block.rows ?? []).length;
          const hidden = (block.gapCount ?? 0) - visible;
          return (
            <div
              key={index}
              className="select-none bg-zinc-50 dark:bg-zinc-800/40"
            >
              {hidden > 0 ? (
                <div className="border-y border-dashed border-zinc-200 px-2 py-1 text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                  … {hidden === 1 ? "1 совпадающая строка" : `${hidden} совпадающих строк`}
                </div>
              ) : null}
              {(block.rows ?? []).map((row, i) => (
                <div
                  key={i}
                  className="px-2 py-0.5 font-mono text-[13px] whitespace-pre-wrap text-zinc-500 dark:text-zinc-400"
                >
                  {row.text || "\u00A0"}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div key={index} className="flex flex-col gap-0.5">
            <InlinePair removed={block.removedText ?? ""} added={block.addedText ?? ""} />
          </div>
        );
      })}
      {!showAll && hiddenRows > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mx-auto rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Показать ещё (скрыто {hiddenRows} строк)
        </button>
      ) : null}
    </div>
  );
}
