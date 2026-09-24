import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { resources, settingsGroups } from "@/lib/admin/config";
import { usingDefaultPassword } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Quản trị", template: "%s · Quản trị" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getSettings();
  const groups = [...new Set(resources.map((r) => r.group))].map((g) => ({
    title: g,
    items: resources.filter((r) => r.group === g).map((r) => ({ href: `/admin/${r.key}/`, label: r.label })),
  }));
  groups.push({
    title: "Giao diện & cài đặt",
    items: settingsGroups.map((s) => ({ href: `/admin/settings/${s.key}/`, label: s.label })),
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 lg:flex">
      <AdminSidebar groups={groups} siteName={general.site_name} />
      <div className="min-w-0 flex-1">
        {!isSupabaseConfigured() && (
          <div className="bg-amber-100 px-6 py-2 text-[13px] text-amber-900">
            Đang chạy <strong>chế độ demo</strong> (dữ liệu lưu trong file .data/db.json). Kết nối Supabase để dữ liệu được lưu
            vĩnh viễn — xem README.
          </div>
        )}
        {usingDefaultPassword() && (
          <div className="bg-red-100 px-6 py-2 text-[13px] text-red-900">
            Đang dùng mật khẩu admin mặc định. Hãy đặt biến môi trường <code>ADMIN_PASSWORD</code> và <code>AUTH_SECRET</code>{" "}
            trước khi đưa lên mạng.
          </div>
        )}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
