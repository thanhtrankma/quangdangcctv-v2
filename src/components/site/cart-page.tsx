"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/format";
import { useCart } from "./cart";
import { btn } from "./ui-tokens";

export function CartPageClient() {
  const { items, total, count, setQty, remove, ready } = useCart();
  if (!ready) return <div className="h-60 animate-pulse rounded-2xl bg-white" />;
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <ShoppingBag size={40} className="mx-auto text-subtle" aria-hidden="true" />
        <p className="mt-3 font-semibold text-ink">Giỏ hàng của bạn đang trống.</p>
        <Link href="/cua-hang/" className={`${btn.primary} mt-4`}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }
  const step = "grid h-10 w-10 place-items-center transition-colors duration-150 hover:bg-tint disabled:opacity-40";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
        {items.map((i) => (
          <li key={i.slug + i.variant} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image || PLACEHOLDER_IMG} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-border object-contain" />
            <div className="min-w-0 flex-1">
              <Link href={`/san-pham/${i.slug}/`} className="line-clamp-2 font-medium hover:text-primary">
                {i.name}
              </Link>
              {i.variant && <p className="text-sm text-muted">{i.variant}</p>}
              <p className="mt-1 font-semibold text-price tabular-nums">{formatPrice(i.price)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-stretch overflow-hidden rounded-lg border border-border" role="group" aria-label={`Số lượng ${i.name}`}>
                <button className={step} onClick={() => setQty(i.slug, i.variant, i.qty - 1)} disabled={i.qty <= 1} aria-label="Giảm">
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span className="grid w-10 place-items-center border-x border-border text-sm font-semibold tabular-nums">{i.qty}</span>
                <button className={step} onClick={() => setQty(i.slug, i.variant, i.qty + 1)} aria-label="Tăng">
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
              <button
                onClick={() => remove(i.slug, i.variant)}
                aria-label={`Xoá ${i.name} khỏi giỏ`}
                className="grid h-10 w-10 place-items-center rounded-lg text-subtle transition-colors duration-150 hover:bg-red-50 hover:text-price"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="h-fit rounded-2xl border border-border bg-white p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Tóm tắt đơn hàng</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Số sản phẩm</dt>
            <dd className="tabular-nums">{count}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-semibold">Tạm tính</dt>
            <dd className="font-bold text-price tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted">Phí vận chuyển & lắp đặt được xác nhận khi nhân viên gọi lại.</p>
        <Link href="/thanh-toan/" className={`${btn.cta} mt-4 w-full`}>
          Tiến hành đặt hàng
        </Link>
      </div>
    </div>
  );
}
