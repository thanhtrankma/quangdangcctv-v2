"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/types";

export function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <h3 className="font-sans text-base">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={id}
          className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-3 text-left font-semibold text-ink transition-colors duration-200 hover:bg-tint"
        >
          <span>{faq.question}</span>
          <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      <div id={id} hidden={!open} className="rich-content border-t border-border px-5 py-4 text-muted" dangerouslySetInnerHTML={{ __html: faq.answer }} />
    </div>
  );
}
