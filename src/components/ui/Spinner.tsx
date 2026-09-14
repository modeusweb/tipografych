"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { cx } from "@/lib/cx";

export function Spinner({ className }: { className?: string }) {
  return (
    <ArrowPathIcon
      aria-hidden="true"
      className={cx("h-4 w-4 animate-spin", className)}
    />
  );
}
