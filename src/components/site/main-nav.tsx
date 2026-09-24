"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, LayoutGrid, Menu, Phone, X } from "lucide-react";
import type { NavLink } from "@/lib/types";
import { CategoryIcon } from "./category-icon";

export type NavCategory = { id: string; name: string; href: string; children: NavCategory[] };

function MegaMenu({ tree, onNavigate }: { tree: NavCategory[]; onNavigate: () => void }) {
  const [active, setActive] = useState(0);
  const current = tree[active];
  return (
    <div className="grid grid-cols-[260px_1fr] overflow-hidden rounded-b-xl border border-t-0 border-border bg-white shadow-xl">
      <ul className="border-r border-border bg-surface py-2" role="list">
        {tree.map((c, i) => (
          <li key={c.id}>
            <Link
              href={c.href}
              onClick={onNavigate}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`flex min-h-11 items-center gap-3 px-4 text-[15px] transition-colors duration-150 ${
                i === active ? "bg-white font-semibold text-primary" : "text-body hover:text-primary"
              }`}
            >
              <CategoryIcon name={c.name} className="h-5 w-5 shrink-0" />
              <span className="flex-1">{c.name}</span>
              {c.children.length > 0 && <ChevronRight size={16} aria-hidden="true" className="text-subtle" />}
            </Link>
          </li>
        ))}
      </ul>
      {current && (
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-heading text-lg font-bold text-ink">{current.name}</p>
            <Link href={current.href} onClick={onNavigate} className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="columns-3 gap-6">
            {current.children.map((s) => (
              <div key={s.id} className="mb-5 break-inside-avoid">
                <Link href={s.href} onClick={onNavigate} className="font-semibold text-ink hover:text-primary">
                  {s.name}
                </Link>
                {s.children.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {s.children.map((t) => (
                      <li key={t.id}>
                        <Link href={t.href} onClick={onNavigate} className="text-sm text-muted hover:text-primary">
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTree({ nodes, depth = 0, onNavigate }: { nodes: NavCategory[]; depth?: number; onNavigate: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className={depth ? "border-l border-border ml-5" : ""}>
      {nodes.map((c) => (
        <li key={c.id}>
          <div className="flex items-center">
            <Link href={c.href} onClick={onNavigate} className="flex min-h-12 flex-1 items-center gap-3 px-4 text-[15px] text-body">
              {depth === 0 && <CategoryIcon name={c.name} className="h-5 w-5 text-primary" />}
              {c.name}
            </Link>
            {c.children.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen(open === c.id ? null : c.id)}
                aria-expanded={open === c.id}
                aria-label={`${open === c.id ? "Thu gọn" : "Mở"} ${c.name}`}
                className="grid h-12 w-12 place-items-center text-subtle"
              >
                <ChevronDown size={18} aria-hidden="true" className={`transition-transform duration-200 ${open === c.id ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
          {open === c.id && <MobileTree nodes={c.children} depth={depth + 1} onNavigate={onNavigate} />}
        </li>
      ))}
    </ul>
  );
}

export function MainNav({
  tree,
  links,
  hotline,
  hotlineDisplay,
}: {
  tree: NavCategory[];
  links: NavLink[];
  hotline: string;
  hotlineDisplay: string;
}) {
  const pathname = usePathname();
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isActive = (href: string) => (!href ? false : href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setDrawer(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
  }, [drawer]);

  useEffect(() => {
    if (!megaOpen) return;
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setMegaOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [megaOpen]);

  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  return (
    <nav aria-label="Điều hướng chính" className="border-t border-border bg-white">
      <div className="container-x flex min-h-12 items-stretch gap-2">
        <div ref={wrap} className="relative hidden lg:block" onMouseEnter={openMega} onMouseLeave={closeMega}>
          <button
            type="button"
            onClick={() => setMegaOpen(true)}
            aria-expanded={megaOpen}
            aria-haspopup="true"
            className="flex h-full min-h-12 w-[260px] items-center gap-2.5 bg-primary px-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
          >
            <LayoutGrid size={18} aria-hidden="true" />
            Danh mục sản phẩm
            <ChevronDown size={16} aria-hidden="true" className={`ml-auto transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} />
          </button>
          {megaOpen && (
            <div className="absolute left-0 top-full z-50 w-[min(1100px,calc(100vw-48px))]">
              <MegaMenu tree={tree} onNavigate={() => setMegaOpen(false)} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
          aria-controls="mobile-drawer"
          className="flex min-h-12 items-center gap-2 font-semibold text-ink lg:hidden"
        >
          <Menu size={22} aria-hidden="true" />
          Danh mục & menu
        </button>

        <ul className="no-scrollbar hidden min-w-0 flex-1 items-stretch overflow-x-auto lg:flex" role="list">
          {links.map((l, n) => (
            <li key={`${l.label}-${n}`}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`relative flex h-full items-center whitespace-nowrap px-3 text-[15px] font-medium transition-colors duration-200 xl:px-4 ${
                  isActive(l.href)
                    ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-body hover:text-primary"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Portal: the sticky header's backdrop-filter would otherwise trap this fixed overlay inside it. */}
      {drawer && createPortal(
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="mobile-drawer">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-navy/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <p className="font-heading text-lg font-bold text-ink">Menu</p>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Đóng menu" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-tint">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 pt-4 pb-1 text-xs font-semibold tracking-wider text-subtle uppercase">Danh mục sản phẩm</p>
              <MobileTree nodes={tree} onNavigate={() => setDrawer(false)} />
              <p className="border-t border-border px-4 pt-4 pb-1 text-xs font-semibold tracking-wider text-subtle uppercase">Trang</p>
              <ul>
                {links.map((l, n) => (
                  <li key={`${l.label}-${n}`}>
                    <Link
                      href={l.href}
                      onClick={() => setDrawer(false)}
                      aria-current={isActive(l.href) ? "page" : undefined}
                      className={`flex min-h-12 items-center px-4 text-[15px] ${isActive(l.href) ? "font-semibold text-primary" : "text-body"}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <a href={`tel:${hotline}`} className="m-4 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cta font-semibold text-white">
              <Phone size={18} aria-hidden="true" />
              Gọi {hotlineDisplay}
            </a>
          </div>
        </div>,
        document.body,
      )}
    </nav>
  );
}
