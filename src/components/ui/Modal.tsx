"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cx } from "@/lib/cx";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Максимальная ширина панели. */
  wide?: boolean;
  /**
   * Не выгружать контент из DOM в закрытом состоянии (скрывается через
   * display:none + inert). Нужно для SEO: текст остаётся в SSR-HTML.
   */
  keepMounted?: boolean;
}

/** Модальное окно: Esc, клик по подложке, блокировка прокрутки фона. */
export function Modal({ open, onClose, title, children, wide, keepMounted }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open && !keepMounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-hidden={!open || undefined}
      inert={!open || undefined}
      style={{ display: open ? undefined : "none" }}
    >
      <div
        className="cursor-pointer absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cx(
          "relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl outline-none",
          "dark:border-zinc-700 dark:bg-zinc-900",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
