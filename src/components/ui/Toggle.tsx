"use client";

import { cx } from "@/lib/cx";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Подпись и описание — используются и для accessibility. */
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/** Доступный переключатель (role="switch") с подписью и описанием. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "border-indigo-600 bg-indigo-600"
            : "border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[3px]",
          )}
        />
      </button>
    </div>
  );
}
