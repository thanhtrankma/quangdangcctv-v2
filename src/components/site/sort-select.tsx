"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "./cart";

const OPTIONS = [
  ["default", "Nổi bật"],
  ["latest", "Mới nhất"],
  ["price-asc", "Giá thấp → cao"],
  ["price-desc", "Giá cao → thấp"],
] as const;

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Sorting by a hidden price would look random, so drop those options in quote mode.
  const { quote } = useCart();
  const options = quote ? OPTIONS.filter(([v]) => !v.startsWith("price")) : OPTIONS;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-muted">
        Sắp xếp
      </label>
      <select
        id="sort"
        value={params.get("sort") ?? "default"}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "default") next.delete("sort");
          else next.set("sort", e.target.value);
          next.delete("page");
          router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
        }}
        className="min-h-11 rounded-lg border border-border bg-white px-3 text-[15px] text-body focus:border-primary"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
