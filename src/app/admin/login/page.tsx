import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { general }] = await Promise.all([searchParams, getSettings()]);
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={general.logo} alt={general.site_name} className="mx-auto h-14" />
        <h1 className="mt-4 text-center text-lg font-bold text-slate-800">Đăng nhập quản trị</h1>
        <LoginForm next={next ?? "/admin/"} />
      </div>
    </div>
  );
}
