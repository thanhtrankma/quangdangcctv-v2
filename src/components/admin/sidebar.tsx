"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import {
  BarChart3, ChevronDown, ChevronsDownUp, ChevronsUpDown, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, Package,
  Settings, ShoppingBag, Warehouse, X, type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/admin/actions";

type Group = { title: string; items: { href: string; label: string }[] };

const GROUP_ICONS: Record<string, LucideIcon> = {
  "Bán hàng": ShoppingBag,
  "Sản phẩm": Package,
  "Nội dung": FileText,
  "Kho hàng": Warehouse,
  "Báo cáo": BarChart3,
  "Giao diện & cài đặt": Settings,
};

function NavGroup({
  group,
  open,
  onToggle,
  activeHref,
  linkCls,
}: {
  group: Group;
  open: boolean;
  onToggle: () => void;
  activeHref: string | undefined;
  linkCls: (active: boolean) => string;
}) {
  const id = useId();
  const Icon = GROUP_ICONS[group.title] ?? FileText;
  const hasActive = group.items.some((i) => i.href === activeHref);
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-semibold tracking-wide uppercase transition-colors ${
          hasActive ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon size={16} aria-hidden="true" className="shrink-0" />
        <span className="flex-1">{group.title}</span>
        {!open && hasActive && <span className="h-1.5 w-1.5 rounded-full bg-sky-300" aria-hidden="true" />}
        <span className="text-[11px] font-normal text-slate-400 tabular-nums">{group.items.length}</span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={id} hidden={!open} className="mt-0.5 ml-[18px] space-y-0.5 border-l border-white/10 pl-2">
        {group.items.map((it) => (
          <Link key={it.href} href={it.href} aria-current={it.href === activeHref ? "page" : undefined} className={linkCls(it.href === activeHref)}>
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdminSidebar({ groups, siteName }: { groups: Group[]; siteName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Groups the user opened/closed by hand; untouched groups are open only if they hold the current page.
  const [manual, setManual] = useState<Record<string, boolean>>({});

  // Longest matching link wins, so /admin/inventory/stocktake/ doesn't also light up /admin/inventory/.
  const activeHref = groups
    .flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => (pathname.endsWith("/") ? pathname : `${pathname}/`).startsWith(h))
    .sort((x, y) => y.length - x.length)[0];
  const activeGroup = groups.find((g) => g.items.some((i) => i.href === activeHref))?.title;
  const isOpen = (title: string) => manual[title] ?? title === activeGroup;
  const allOpen = groups.every((g) => isOpen(g.title));
  const setAll = (value: boolean) => setManual(Object.fromEntries(groups.map((g) => [g.title, value])));

  const linkCls = (active: boolean) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-[14px] transition-colors ${
      active ? "bg-white/15 font-semibold text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;
  const isDashboard = pathname === "/admin/" || pathname === "/admin";

  return (
    <>
      <div className="flex items-center justify-between bg-teal-navy px-4 py-3 text-white lg:hidden">
        <strong>{siteName} Admin</strong>
        <button onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      <aside
        className={`${mobileOpen ? "block" : "hidden"} w-full shrink-0 bg-teal-navy text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:overflow-y-auto`}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Link href="/admin/" className="text-lg font-bold">
            {siteName}
          </Link>
          <div className="text-xs text-slate-400">Trang quản trị</div>
        </div>
        {/* Close the mobile menu after following a link, not when a group header is toggled. */}
        <nav
          aria-label="Menu quản trị"
          className="space-y-1 px-3 pb-6"
          onClick={(e) => (e.target as HTMLElement).closest("a") && setMobileOpen(false)}
        >
          <div className="flex items-center gap-1">
            <Link href="/admin/" aria-current={isDashboard ? "page" : undefined} className={`${linkCls(isDashboard)} flex-1`}>
              <LayoutDashboard size={16} aria-hidden="true" /> Tổng quan
            </Link>
            <button
              type="button"
              onClick={() => setAll(!allOpen)}
              title={allOpen ? "Thu gọn tất cả" : "Mở tất cả"}
              aria-label={allOpen ? "Thu gọn tất cả nhóm" : "Mở tất cả nhóm"}
              className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            >
              {allOpen ? <ChevronsDownUp size={16} aria-hidden="true" /> : <ChevronsUpDown size={16} aria-hidden="true" />}
            </button>
          </div>
          {groups.map((g) => (
            <NavGroup
              key={g.title}
              group={g}
              open={isOpen(g.title)}
              onToggle={() => setManual((m) => ({ ...m, [g.title]: !isOpen(g.title) }))}
              activeHref={activeHref}
              linkCls={linkCls}
            />
          ))}
          <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
            <a href="/" target="_blank" className={linkCls(false)}>
              <ExternalLink size={16} aria-hidden="true" /> Xem website
            </a>
            <form action={logout}>
              <button className={`${linkCls(false)} w-full`}>
                <LogOut size={16} aria-hidden="true" /> Đăng xuất
              </button>
            </form>
          </div>
        </nav>
      </aside>
    </>
  );
}
