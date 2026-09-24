"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(login, null);
  const input = "h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required autoComplete="username" className={input} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending} className="h-11 w-full rounded-lg bg-teal-navy font-semibold text-white disabled:opacity-60">
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
