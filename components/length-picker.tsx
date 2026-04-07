"use client";

import { cn } from "@/lib/utils";
import type { LengthBucket } from "@/lib/utils/length";

const OPTIONS: { value: LengthBucket; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export function LengthPicker({
  value,
  onChange,
  disabled,
}: {
  value: LengthBucket;
  onChange: (v: LengthBucket) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Story length"
      className="inline-flex rounded-md border border-border bg-card p-1"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
