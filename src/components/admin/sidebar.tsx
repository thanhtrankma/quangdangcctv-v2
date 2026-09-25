"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/admin/actions";

type Group = { title: string; items: { href: string; label: string }[] };

export function AdminSidebar({ groups, siteName }: { groups: Group[]; siteName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Longest matching link wins, so /admin/inventory/stocktake/ doesn't also light up /admin/inventory/.
  const activeHref = groups
    .flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => (pathname.endsWith("/") ? pathname : `${pathname}/`).startsWith(h))
    .sort((x, y) => y.length - x.length)[0];
  const link = (href: string, active: boolean) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-[14px] transition ${
      active ? "bg-white/15 font-semibold text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      <div className="flex items-center justify-between bg-teal-navy px-4 py-3 text-white lg:hidden">
        <strong>{siteName} Admin</strong>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <aside
        className={`${open ? "block" : "hidden"} w-full shrink-0 bg-teal-navy text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:overflow-y-auto`}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Link href="/admin/" className="text-lg font-bold">
            {siteName}
          </Link>
          <div className="text-xs text-slate-400">Trang quản trị</div>
        </div>
        <nav className="space-y-5 px-3 pb-6" onClick={() => setOpen(false)}>
          <Link href="/admin/" className={link("/admin/", pathname === "/admin/" || pathname === "/admin")}>
            <LayoutDashboard size={16} /> Tổng quan
          </Link>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.title}</div>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={link(it.href, it.href === activeHref)}>
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="space-y-1 border-t border-white/10 pt-4">
            <a href="/" target="_blank" className={link("/", false)}>
              <ExternalLink size={16} /> Xem website
            </a>
            <form action={logout}>
              <button className={`${link("", false)} w-full`}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </form>
          </div>
        </nav>
      </aside>
    </>
  );
}
