"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { PLACEHOLDER_IMG } from "@/lib/format";
import type { OrderItem } from "@/lib/types";
import { useCart } from "./cart";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [PLACEHOLDER_IMG];
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[active]} alt={alt} width={800} height={800} className="h-full w-full object-contain" />
      </div>
      {list.length > 1 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label="Ảnh sản phẩm">
          {list.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === active}
                className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 transition-colors duration-150 ${
                  i === active ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BuyBox({ item, canBuy }: { item: Omit<OrderItem, "qty">; canBuy: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  if (!canBuy) return null;
  const stepper = "grid h-11 w-11 place-items-center text-ink transition-colors duration-150 hover:bg-tint disabled:opacity-40";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted" id="qty-label">
          Số lượng
        </span>
        <div className="flex items-stretch overflow-hidden rounded-lg border border-border bg-white" role="group" aria-labelledby="qty-label">
          <button type="button" className={stepper} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Giảm số lượng">
            <Minus size={16} aria-hidden="true" />
          </button>
          <input
            value={qty}
            onChange={(e) => setQty(Math.min(99, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
            className="w-14 border-x border-border text-center text-base font-semibold tabular-nums outline-none"
            inputMode="numeric"
            aria-label="Số lượng"
          />
          <button type="button" className={stepper} onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Tăng số lượng">
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => add(item, qty)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary font-semibold text-primary transition-colors duration-200 hover:bg-primary-soft"
        >
          <ShoppingCart size={18} aria-hidden="true" /> Thêm vào giỏ
        </button>
        <button
          type="button"
          onClick={() => {
            add(item, qty);
            router.push("/thanh-toan/");
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cta font-semibold text-white transition-colors duration-200 hover:bg-cta-hover"
        >
          <Zap size={18} aria-hidden="true" /> Mua ngay
        </button>
      </div>
    </div>
  );
}

export function ExpandableDescription({ html }: { html: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div id="product-desc" className={`relative ${open ? "" : "max-h-[560px] overflow-hidden"}`}>
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white" />}
      </div>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="product-desc"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-primary px-5 font-semibold text-primary transition-colors duration-200 hover:bg-primary-soft"
        >
          {open ? "Thu gọn" : "Xem thêm mô tả"}
          <ChevronDown size={18} aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>
  );
}
