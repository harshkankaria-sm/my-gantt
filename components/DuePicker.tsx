"use client";

import { useRef } from "react";
import type { ISODate } from "@/lib/dates";
import s from "./DuePicker.module.css";

interface DuePickerProps {
  /** The current deadline, set or worked out. */
  value: ISODate;
  label: string;
  /** "" when the picker is cleared. */
  onPick: (v: ISODate) => void;
}

/** Icon-only deadline picker: the date itself is already shown on the timeline. */
export function DuePicker({ value, label, onPick }: DuePickerProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <span className={s.due}>
      <button
        type="button"
        className={s.btn}
        aria-label={label}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          try {
            el.showPicker();
          } catch {
            el.focus();
          }
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
          <path d="M2.5 7h11M5.5 2v3M10.5 2v3" strokeLinecap="round" />
        </svg>
      </button>
      <input
        ref={ref}
        className={s.input}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        onChange={(e) => onPick(e.target.value)}
      />
    </span>
  );
}
