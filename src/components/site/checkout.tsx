"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { placeOrder } from "@/app/actions";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/format";
import { useCart } from "./cart";
import { btn, inputCls } from "./ui-tokens";

// 34 tỉnh/thành sau sắp xếp đơn vị hành chính 2025.
const PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế", "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng",
  "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hoà", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hoá", "Tuyên Quang", "Vĩnh Long",
];

const label = "mb-1.5 block text-sm font-medium text-ink";
const Req = () => <span className="text-price"> *</span>;

export function CheckoutClient({ siteName }: { siteName: string }) {
  const { items, total, clear, ready } = useCart();
  const [state, action, pending] = useActionState(placeOrder, null);

  useEffect(() => {
    if (state?.ok) clear();
  }, [state, clear]);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-trust/30 bg-green-50 p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-trust" aria-hidden="true" />
        <p className="mt-3 font-heading text-2xl font-bold text-ink">Đặt hàng thành công!</p>
        <p className="mt-2 text-muted">Cảm ơn bạn đã đặt hàng tại {siteName}. Chúng tôi sẽ gọi điện xác nhận trong thời gian sớm nhất.</p>
        <p className="mt-3">
          Mã đơn hàng: <strong className="text-lg text-ink tabular-nums">{state.code}</strong>
        </p>
        <Link href="/cua-hang/" className={`${btn.primary} mt-5`}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  if (ready && !items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
        <p className="text-muted">Giỏ hàng đang trống.</p>
        <Link href="/cua-hang/" className={`${btn.primary} mt-4`}>
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <input type="hidden" name="items" value={JSON.stringify(items.map(({ slug, variant, qty }) => ({ slug, variant, qty })))} />
      <div className="hidden" aria-hidden="true">
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="space-y-4 rounded-2xl border border-border bg-white p-5 md:p-6">
        <legend className="float-left mb-2 w-full font-heading text-lg font-bold text-ink">Thông tin nhận hàng</legend>
        <div className="clear-both">
          <label htmlFor="co-name" className={label}>
            Họ và tên<Req />
          </label>
          <input id="co-name" name="name" required autoComplete="name" className={inputCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="co-phone" className={label}>
              Số điện thoại<Req />
            </label>
            <input id="co-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" className={inputCls} />
          </div>
          <div>
            <label htmlFor="co-email" className={label}>
              Email
            </label>
            <input id="co-email" name="email" type="email" autoComplete="email" className={inputCls} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="co-province" className={label}>
              Tỉnh/Thành phố<Req />
            </label>
            <select id="co-province" name="province" required className={inputCls} defaultValue="">
              <option value="" disabled>
                Chọn tỉnh/thành phố
              </option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="co-ward" className={label}>
              Phường/Xã
            </label>
            <input id="co-ward" name="ward" className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="co-address" className={label}>
            Địa chỉ cụ thể<Req />
          </label>
          <input id="co-address" name="address" required autoComplete="street-address" placeholder="Số nhà, tên đường…" className={inputCls} />
        </div>
        <div>
          <label htmlFor="co-note" className={label}>
            Ghi chú
          </label>
          <textarea id="co-note" name="note" rows={3} placeholder="Thời gian nhận hàng, yêu cầu lắp đặt…" className={`${inputCls} py-2.5`} />
        </div>
      </fieldset>

      <div className="h-fit rounded-2xl border border-border bg-white p-5 md:p-6 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Đơn hàng ({items.length})</h2>
        <ul className="mt-3 max-h-72 divide-y divide-border overflow-auto">
          {items.map((i) => (
            <li key={i.slug + i.variant} className="flex gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image || PLACEHOLDER_IMG} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-border object-contain" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="line-clamp-2">{i.name}</span>
                <span className="text-muted tabular-nums">× {i.qty}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3">
          <span className="font-semibold">Tổng tạm tính</span>
          <strong className="text-lg text-price tabular-nums">{formatPrice(total)}</strong>
        </div>
        <p className="mt-3 flex gap-2 rounded-lg bg-tint p-3 text-sm text-muted">
          <ShieldCheck size={18} className="shrink-0 text-trust" aria-hidden="true" />
          Thanh toán khi nhận hàng (COD) hoặc chuyển khoản — nhân viên gọi xác nhận trước khi giao.
        </p>
        {state && !state.ok && (
          <p role="alert" className="mt-3 text-sm font-medium text-price">
            {state.error}
          </p>
        )}
        <button disabled={pending || !items.length} className={`${btn.cta} mt-4 w-full`}>
          {pending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {pending ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
        </button>
      </div>
    </form>
  );
}
