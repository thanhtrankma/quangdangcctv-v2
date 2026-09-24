"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Check, ShoppingCart, X } from "lucide-react";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

const KEY = "dh_cart_v1";

type CartCtx = {
  items: OrderItem[];
  count: number;
  total: number;
  ready: boolean;
  add: (item: Omit<OrderItem, "qty">, qty?: number) => void;
  setQty: (slug: string, variant: string, qty: number) => void;
  remove: (slug: string, variant: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once on mount
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((item: Omit<OrderItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.slug === item.slug && p.variant === item.variant);
      if (i < 0) return [...prev, { ...item, qty }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      return next;
    });
    setToast(`Đã thêm “${item.name}” vào giỏ hàng`);
  }, []);

  const setQty = useCallback((slug: string, variant: string, qty: number) => {
    setItems((prev) => prev.map((p) => (p.slug === slug && p.variant === variant ? { ...p, qty: Math.min(99, Math.max(1, qty)) } : p)));
  }, []);

  const remove = useCallback((slug: string, variant: string) => {
    setItems((prev) => prev.filter((p) => !(p.slug === slug && p.variant === variant)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.qty, 0),
      total: items.reduce((s, i) => s + i.qty * i.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, ready, add, setQty, remove, clear],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
        {toast && (
          <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-xl">
            <Check size={18} className="shrink-0 text-emerald-300" aria-hidden="true" />
            <span className="line-clamp-2">{toast}</span>
            <Link href="/gio-hang/" className="shrink-0 font-semibold text-sky-200 underline underline-offset-2">
              Xem giỏ
            </Link>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export function AddToCartIconButton({ item, className = "" }: { item: Omit<OrderItem, "qty">; className?: string }) {
  const { add } = useCart();
  return (
    <button
      type="button"
      onClick={() => add(item)}
      aria-label={`Thêm ${item.name} vào giỏ hàng`}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-colors duration-200 hover:bg-primary hover:text-white ${className}`}
    >
      <ShoppingCart size={18} aria-hidden="true" />
    </button>
  );
}

export function HeaderCart() {
  const { items, count, total, remove } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Giỏ hàng, ${count} sản phẩm`}
        className="relative flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-ink transition-colors duration-200 hover:bg-tint"
      >
        <ShoppingCart size={24} aria-hidden="true" />
        <span className="absolute left-6 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-cta px-1 text-[11px] font-bold text-white tabular-nums">
          {count}
        </span>
        <span className="hidden text-sm font-semibold lg:inline">Giỏ hàng</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-white p-4 shadow-xl">
          {items.length === 0 ? (
            <p className="py-6 text-center text-muted">Giỏ hàng của bạn đang trống.</p>
          ) : (
            <>
              <ul className="max-h-80 space-y-3 overflow-auto">
                {items.map((i) => (
                  <li key={i.slug + i.variant} className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image || PLACEHOLDER_IMG} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-border object-contain" />
                    <div className="min-w-0 flex-1 text-sm">
                      <Link href={`/san-pham/${i.slug}/`} onClick={() => setOpen(false)} className="line-clamp-2 font-medium hover:text-primary">
                        {i.name}
                      </Link>
                      <div className="text-muted tabular-nums">
                        {i.qty} × <span className="font-semibold text-price">{formatPrice(i.price)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(i.slug, i.variant)}
                      aria-label={`Xoá ${i.name}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-subtle hover:bg-red-50 hover:text-price"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-border pt-3">
                <span className="text-muted">Tạm tính</span>
                <strong className="text-price tabular-nums">{formatPrice(total)}</strong>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                <Link href="/gio-hang/" onClick={() => setOpen(false)} className="grid min-h-11 place-items-center rounded-lg border-2 border-primary text-primary hover:bg-primary-soft">
                  Xem giỏ hàng
                </Link>
                <Link href="/thanh-toan/" onClick={() => setOpen(false)} className="grid min-h-11 place-items-center rounded-lg bg-cta text-white hover:bg-cta-hover">
                  Thanh toán
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
