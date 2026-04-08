"use client";

import { cn } from "@/lib/utils";
import type { LengthBucket } from "@/lib/utils/length";

const OPTIONS: { value: LengthBucket; label: string }[] = [
  { value: "short", label: "Brief" },
  { value: "medium", label: "Standard" },
  { value: "long", label: "Extended" },
];

/**
 * Editorial length picker — no filled pills, no rounded chrome.
 * Small caps labels separated by vertical rules. The selected option
 * gets a single underline, the way a compositor might mark up proofs.
 */
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
      className="inline-flex items-center divide-x divide-rule/60"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "editorial-caps px-4 py-1 transition-colors",
              "focus:outline-none focus-visible:text-oxblood",
              selected
                ? "text-ink underline decoration-oxblood decoration-[1.5px] underline-offset-[6px]"
                : "text-ink-faint hover:text-ink",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
