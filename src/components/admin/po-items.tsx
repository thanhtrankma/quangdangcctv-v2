"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { formatPrice, slugify } from "@/lib/format";
import type { PurchaseItem } from "@/lib/types";

export type ProductOption = { value: string; label: string; meta?: { sku?: string; cost?: number; stock?: number } };

const cell = "h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-right text-sm tabular-nums outline-none focus:border-teal-600";

/** Line-item editor for purchase orders: product search, qty, unit cost, line total. */
export function PoItemsInput({
  value,
  onChange,
  products,
  locked,
}: {
  value: PurchaseItem[];
  onChange: (v: PurchaseItem[]) => void;
  products: ProductOption[];
  locked: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const t = slugify(q);
    if (!t) return [];
    return products.filter((p) => slugify(`${p.label} ${p.meta?.sku ?? ""}`).includes(t)).slice(0, 12);
  }, [q, products]);

  const add = (p: ProductOption) => {
    const existing = value.findIndex((i) => i.product_id === p.value);
    if (existing >= 0) {
      onChange(value.map((i, k) => (k === existing ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      onChange([...value, { product_id: p.value, name: p.label, sku: p.meta?.sku ?? "", qty: 1, unit_cost: p.meta?.cost ?? 0 }]);
    }
    setQ("");
    setOpen(false);
  };
  const set = (k: number, patch: Partial<PurchaseItem>) => onChange(value.map((i, n) => (n === k ? { ...i, ...patch } : i)));
  const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;
  const subtotal = value.reduce((s, i) => s + i.qty * i.unit_cost, 0);

  return (
    <div className="space-y-3">
      {!locked && (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Tìm sản phẩm theo tên hoặc SKU để thêm vào phiếu…"
            aria-label="Tìm sản phẩm để thêm"
            className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-600"
          />
          {open && matches.length > 0 && (
            <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg" role="listbox">
              {matches.map((p) => (
                <li key={p.value}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(p)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="line-clamp-1">{p.label}</span>
                      {p.meta?.sku && <span className="text-xs text-slate-500">SKU {p.meta.sku}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      Tồn {p.meta?.stock ?? 0} · Vốn {formatPrice(p.meta?.cost ?? 0)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2">Sản phẩm</th>
              <th className="w-24 px-3 py-2 text-right">SL</th>
              <th className="w-40 px-3 py-2 text-right">Giá nhập (₫)</th>
              <th className="w-36 px-3 py-2 text-right">Thành tiền</th>
              {!locked && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {value.map((it, k) => (
              <tr key={it.product_id + k}>
                <td className="px-3 py-2">
                  <div className="line-clamp-2 font-medium">{it.name}</div>
                  {it.sku && <div className="text-xs text-slate-500">SKU {it.sku}</div>}
                </td>
                <td className="px-3 py-2">
                  {locked ? (
                    <div className="text-right tabular-nums">{it.qty}</div>
                  ) : (
                    <input inputMode="numeric" aria-label={`Số lượng ${it.name}`} value={it.qty} onChange={(e) => set(k, { qty: digits(e.target.value) })} className={cell} />
                  )}
                </td>
                <td className="px-3 py-2">
                  {locked ? (
                    <div className="text-right tabular-nums">{formatPrice(it.unit_cost)}</div>
                  ) : (
                    <input
                      inputMode="numeric"
                      aria-label={`Giá nhập ${it.name}`}
                      value={it.unit_cost ? it.unit_cost.toLocaleString("vi-VN") : ""}
                      onChange={(e) => set(k, { unit_cost: digits(e.target.value) })}
                      className={cell}
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatPrice(it.qty * it.unit_cost)}</td>
                {!locked && (
                  <td className="px-1">
                    <button
                      type="button"
                      onClick={() => onChange(value.filter((_, n) => n !== k))}
                      aria-label={`Bỏ ${it.name}`}
                      className="grid h-9 w-9 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!value.length && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  <Plus size={16} className="mr-1 inline" aria-hidden="true" />
                  Chưa có sản phẩm. Gõ tên sản phẩm ở ô tìm kiếm phía trên để thêm.
                </td>
              </tr>
            )}
          </tbody>
          {value.length > 0 && (
            <tfoot className="bg-slate-50">
              <tr>
                <td className="px-3 py-2 font-semibold">Tổng {value.reduce((s, i) => s + i.qty, 0)} sản phẩm</td>
                <td colSpan={2} className="px-3 py-2 text-right text-slate-500">
                  Tiền hàng
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">{formatPrice(subtotal)}</td>
                {!locked && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {locked && <p className="text-xs text-amber-700">Phiếu đã nhập kho hoặc đã huỷ nên không sửa được hàng hoá.</p>}
    </div>
  );
}
