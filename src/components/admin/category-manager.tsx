"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { reorderCategories, setCategoryOnHome } from "@/app/admin/actions";

type Cat = { id: string; name: string; slug: string; parent_id: string | null; sort_order: number; show_on_home: boolean; count: number };

const bySort = (a: Cat, b: Cat) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "vi");

function MoveButtons({ first, last, onMove, label }: { first: boolean; last: boolean; onMove: (d: -1 | 1) => void; label: string }) {
  const cls = "grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-teal-600 hover:text-teal-700 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600";
  return (
    <div className="flex gap-1">
      <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label={`Đưa ${label} lên`} title="Lên" className={cls}>
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button type="button" disabled={last} onClick={() => onMove(1)} aria-label={`Đưa ${label} xuống`} title="Xuống" className={cls}>
        <ArrowDown size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const [cats, setCats] = useState(categories);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const children = useMemo(() => {
    const m = new Map<string | null, Cat[]>();
    for (const c of cats) m.set(c.parent_id, [...(m.get(c.parent_id) ?? []), c]);
    for (const list of m.values()) list.sort(bySort);
    return m;
  }, [cats]);

  const tops = children.get(null) ?? [];
  // Shown-on-home categories always come first, so the visible order is the home/menu order.
  const shown = tops.filter((c) => c.show_on_home);
  const hidden = tops.filter((c) => !c.show_on_home);

  const save = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    setMsg(null);
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: done } : { ok: false, text: r.error ?? "Lưu không thành công" });
    });
  };

  /** Apply a new order for one sibling list locally (sort_order 1..n) and persist it. */
  const applyOrder = (ordered: Cat[]) => {
    const pos = new Map(ordered.map((c, i) => [c.id, i + 1]));
    setCats((all) => all.map((c) => (pos.has(c.id) ? { ...c, sort_order: pos.get(c.id)! } : c)));
    save(() => reorderCategories(ordered.map((c) => c.id)), "Đã lưu thứ tự");
  };

  const move = (list: Cat[], index: number, d: -1 | 1, prefix: Cat[] = [], suffix: Cat[] = []) => {
    const next = [...list];
    [next[index], next[index + d]] = [next[index + d], next[index]];
    applyOrder([...prefix, ...next, ...suffix]);
  };

  const toggleHome = (c: Cat) => {
    const on = !c.show_on_home;
    // Turning on: goes to the bottom of the shown group. Turning off: top of the hidden group.
    const nextShown = on ? [...shown, c] : shown.filter((x) => x.id !== c.id);
    const nextHidden = on ? hidden.filter((x) => x.id !== c.id) : [c, ...hidden];
    const ordered = [...nextShown, ...nextHidden];
    const pos = new Map(ordered.map((x, i) => [x.id, i + 1]));
    setCats((all) => all.map((x) => (x.id === c.id ? { ...x, show_on_home: on, sort_order: pos.get(x.id)! } : pos.has(x.id) ? { ...x, sort_order: pos.get(x.id)! } : x)));
    save(() => setCategoryOnHome(c.id, on, ordered.map((x) => x.id)), on ? `Đã hiện “${c.name}” trên trang chủ` : `Đã ẩn “${c.name}” khỏi trang chủ`);
  };

  const renderChildren = (parent: Cat, depth: number) => {
    const list = children.get(parent.id) ?? [];
    if (!list.length || !open[parent.id]) return null;
    return (
      <ul className="border-l border-slate-200" style={{ marginLeft: depth * 20 + 22 }}>
        {list.map((c, i) => (
          <li key={c.id}>
            {renderRow(c, depth + 1, <MoveButtons first={i === 0} last={i === list.length - 1} label={c.name} onMove={(d) => move(list, i, d)} />)}
            {renderChildren(c, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  // A plain render helper (not a nested component) so rows aren't remounted and keep focus after ▲▼.
  const renderRow = (cat: Cat, depth: number, actions: React.ReactNode, home?: boolean) => {
    const kids = children.get(cat.id)?.length ?? 0;
    return (
      <div className="border-b border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Cột trái: Nút di chuyển, Tên danh mục, Số danh mục con */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={() => kids && setOpen((o) => ({ ...o, [cat.id]: !o[cat.id] }))}
              disabled={!kids}
              aria-expanded={kids ? Boolean(open[cat.id]) : undefined}
              aria-label={kids ? `${open[cat.id] ? "Thu gọn" : "Mở"} danh mục con của ${cat.name}` : undefined}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <ChevronRight
                size={16}
                aria-hidden="true"
                className={`shrink-0 transition-transform ${kids ? "text-slate-500" : "text-transparent"} ${open[cat.id] ? "rotate-90" : ""}`}
              />
              <span className={`text-[15px] text-slate-800 leading-snug break-words ${depth === 0 ? "font-semibold text-slate-900" : "font-medium"}`}>
                {cat.name}
              </span>
              {kids > 0 && (
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {kids} mục con
                </span>
              )}
            </button>
          </div>

          {/* Cột phải (trên mobile tự động xuống dòng và căn đều gọn gàng) */}
          <div className="flex items-center justify-between gap-2 pl-9 sm:pl-0 sm:justify-end">
            <span className="text-xs font-medium text-slate-500 tabular-nums sm:text-sm sm:w-16 sm:text-right">
              {cat.count} SP
            </span>
            <div className="flex items-center gap-1.5">
              {home !== undefined && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={home}
                  aria-label={`Hiện ${cat.name} trên trang chủ`}
                  onClick={() => toggleHome(cat)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors ${
                    home ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {home ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
                  <span>{home ? "Hiện trang chủ" : "Ẩn trang chủ"}</span>
                </button>
              )}
              <Link
                href={`/admin/categories/${cat.id}/`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-teal-600 hover:text-teal-700"
                aria-label={`Sửa ${cat.name}`}
                title="Sửa"
              >
                <Pencil size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const group = (title: string, note: string, list: Cat[], prefix: Cat[], suffix: Cat[]) => (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm">
      <header className="flex items-baseline justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="font-semibold">
          {title} <span className="font-normal text-slate-500">({list.length})</span>
        </h2>
        <p className="text-xs text-slate-500">{note}</p>
      </header>
      {list.length ? (
        <ul>
          {list.map((c, i) => (
            <li key={c.id}>
              {renderRow(
                c,
                0,
                <>
                  <span className="w-6 shrink-0 text-center text-sm font-semibold text-slate-400 tabular-nums">{prefix.length + i + 1}</span>
                  <MoveButtons first={i === 0} last={i === list.length - 1} label={c.name} onMove={(d) => move(list, i, d, prefix, suffix)} />
                </>,
                c.show_on_home,
              )}
              {renderChildren(c, 0)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-slate-500">Chưa có danh mục nào.</p>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex min-h-6 items-center gap-2 text-sm" aria-live="polite">
        {pending ? (
          <span className="flex items-center gap-1.5 text-slate-500">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Đang lưu…
          </span>
        ) : msg ? (
          <span className={msg.ok ? "text-emerald-700" : "text-red-600"}>{msg.text}</span>
        ) : null}
        <span className="ml-auto flex gap-3">
          <button type="button" onClick={() => setOpen(Object.fromEntries(cats.map((c) => [c.id, true])))} className="text-teal-700 hover:underline">
            Mở tất cả
          </button>
          <button type="button" onClick={() => setOpen({})} className="text-teal-700 hover:underline">
            Thu gọn
          </button>
        </span>
      </div>
      {group("Đang hiện trên trang chủ", "Thứ tự này là thứ tự các khối danh mục trên trang chủ và trong menu", shown, [], hidden)}
      {group("Không hiện trên trang chủ", "Vẫn có trong menu danh mục, xếp sau các danh mục đang hiện", hidden, shown, [])}
    </div>
  );
}
