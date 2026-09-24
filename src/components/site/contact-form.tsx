"use client";

import { useActionState, useId } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitContact } from "@/app/actions";
import { btn, inputCls } from "./ui-tokens";

/** Contact / quote request form. `compact` is the short version used in the home hero. */
export function ContactForm({ source = "lien-he", siteName, compact = false }: { source?: string; siteName: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(submitContact, null);
  const id = useId();

  if (state?.ok) {
    return (
      <div role="status" className="flex gap-3 rounded-xl border border-trust/30 bg-green-50 p-4 text-green-900">
        <CheckCircle2 className="mt-0.5 shrink-0 text-trust" aria-hidden="true" />
        <p>
          Cảm ơn bạn! {siteName} đã nhận được thông tin và sẽ gọi lại trong giờ làm việc sớm nhất.
        </p>
      </div>
    );
  }

  const label = "mb-1.5 block text-sm font-medium text-ink";
  return (
    <form action={action} className="space-y-3" noValidate={false}>
      <input type="hidden" name="source" value={source} />
      <div className="hidden" aria-hidden="true">
        <label>
          Đừng điền ô này <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <div>
          <label htmlFor={`${id}-name`} className={label}>
            Họ và tên <span className="text-price">*</span>
          </label>
          <input id={`${id}-name`} name="name" required autoComplete="name" className={inputCls} />
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className={label}>
            Số điện thoại <span className="text-price">*</span>
          </label>
          <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" required autoComplete="tel" className={inputCls} />
        </div>
      </div>
      {!compact && (
        <div>
          <label htmlFor={`${id}-email`} className={label}>
            Email
          </label>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" className={inputCls} />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-msg`} className={label}>
          {compact ? "Bạn cần lắp đặt / tư vấn gì?" : "Nội dung"}
        </label>
        <textarea
          id={`${id}-msg`}
          name="message"
          rows={compact ? 2 : 5}
          placeholder={compact ? "VD: lắp 4 camera cho nhà 3 tầng" : ""}
          className={`${inputCls} py-2.5`}
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm font-medium text-price">
          {state.error}
        </p>
      )}
      <button disabled={pending} className={`${btn.cta} w-full`}>
        {pending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {pending ? "Đang gửi..." : compact ? "Nhận tư vấn miễn phí" : "Gửi thông tin"}
      </button>
    </form>
  );
}
