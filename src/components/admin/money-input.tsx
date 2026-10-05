"use client";

import { useLayoutEffect, useRef } from "react";

const fmt = (n: number) => n.toLocaleString("vi-VN");

/**
 * Money field that shows thousands separators while typing without the caret jumping.
 * After each change the caret is put back behind the same number of digits it was behind before
 * (separators are re-inserted on every keystroke, so a raw character offset would drift).
 */
export function MoneyInput({
  value,
  onChange,
  className,
  placeholder,
  id,
  ariaLabel,
}: {
  value: number | null | undefined | "";
  onChange: (v: number | "") => void;
  className?: string;
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const digitsBeforeCaret = useRef<number | null>(null);
  const shown = value === "" || value === null || value === undefined ? "" : fmt(Number(value));

  useLayoutEffect(() => {
    const el = ref.current;
    const want = digitsBeforeCaret.current;
    if (!el || want === null || document.activeElement !== el) return;
    digitsBeforeCaret.current = null;
    let pos = 0;
    for (let seen = 0; pos < el.value.length && seen < want; pos++) if (/\d/.test(el.value[pos])) seen++;
    el.setSelectionRange(pos, pos);
  }, [shown]);

  return (
    <input
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      inputMode="numeric"
      autoComplete="off"
      value={shown}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        const caret = e.target.selectionStart ?? raw.length;
        digitsBeforeCaret.current = raw.slice(0, caret).replace(/\D/g, "").replace(/^0+(?=\d)/, "").length;
        const digits = raw.replace(/\D/g, "").slice(0, 13); // up to 9.999 tỷ
        onChange(digits === "" ? "" : Number(digits));
      }}
      onKeyDown={(e) => {
        // Backspace right after a separator ("1.|000") should delete the digit before it, not stall.
        const el = e.currentTarget;
        const at = el.selectionStart ?? 0;
        if (e.key === "Backspace" && at === el.selectionEnd && at > 0 && el.value[at - 1] === ".") el.setSelectionRange(at - 1, at - 1);
        if (e.key === "Delete" && at === el.selectionEnd && el.value[at] === ".") el.setSelectionRange(at + 1, at + 1);
      }}
      className={className}
    />
  );
}
