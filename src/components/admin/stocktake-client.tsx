"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { applyStocktake } from "@/app/admin/actions";
import { slugify } from "@/lib/format";

type P = { id: string; name: string; sku: string; category_id: string | null; stock: number; track: boolean };
type C = { id: string; name: string; parent_id: string | null };

export function StocktakeClient({ products, categories }: { products: P[]; categories: C[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [onlyTracked, setOnlyTracked] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const catIds = useMemo(() => {
    if (!cat) return null;
    const ids = new Set([cat]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of categories) {
        if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
          ids.add(c.id);
          grew = true;
        }
      }
    }
    return ids;
  }, [cat, categories]);

  const rows = useMemo(() => {
    const t = slugify(q);
    return products.filter(
      (p) => (!t || slugify(`${p.name} ${p.sku}`).includes(t)) && (!catIds || (p.category_id && catIds.has(p.category_id))) && (!onlyTracked || p.track),
    );
  }, [products, q, catIds, onlyTracked]);

  const changes = Object.entries(counts)
    .filter(([, v]) => v !== "")
    .map(([id, v]) => ({ id, counted: Number(v) }))
    .filter((c) => Number.isFinite(c.counted) && c.counted >= 0);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const submit = () => {
    if (!changes.length) return;
    if (!confirm(`Ghi nhận kiểm kho cho ${changes.length} sản phẩm?`)) return;
    start(async () => {
      const r = await applyStocktake(changes.map((c) => ({ productId: c.id, counted: c.counted })), note);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: `Đã cập nhật ${r.changed ?? 0} sản phẩm.` });
      setCounts({});
      router.refresh();
    });
  };

  const top = categories.filter((c) => !c.parent_id);
  return (
    <>
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên hoặc SKU…" aria-label="Tìm sản phẩm" className="h-9 min-w-48 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Danh mục" className="h-9 rounded-md border border-slate-300 px-2 text-sm">
          <option value="">Tất cả danh mục</option>
          {top.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-2 text-sm">
          <input type="checkbox" checked={onlyTracked} onChange={(e) => setOnlyTracked(e.target.checked)} className="h-4 w-4 accent-teal-700" />
          Chỉ sản phẩm đang theo dõi
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3 text-right">Tồn hệ thống</th>
              <th className="w-40 px-4 py-3 text-right">Thực tế</th>
              <th className="w-28 px-4 py-3 text-right">Chênh lệch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 300).map((p) => {
              const v = counts[p.id] ?? "";
              const diff = v === "" ? null : Number(v) - p.stock;
              return (
                <tr key={p.id} className={diff ? "bg-amber-50/60" : ""}>
                  <td className="px-4 py-2">
                    <div className="line-clamp-1 font-medium">{p.name}</div>
                    {p.sku && <div className="text-xs text-slate-500">SKU {p.sku}</div>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.track ? p.stock : <span className="text-slate-400">chưa theo dõi</span>}</td>
                  <td className="px-4 py-2">
                    <input
                      inputMode="numeric"
                      aria-label={`Số lượng thực tế ${p.name}`}
                      value={v}
                      onChange={(e) => setCounts((c) => ({ ...c, [p.id]: e.target.value.replace(/\D/g, "") }))}
                      className="h-9 w-full rounded-md border border-slate-300 px-2 text-right tabular-nums outline-none focus:border-teal-600"
                    />
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold tabular-nums ${diff && diff > 0 ? "text-emerald-700" : diff && diff < 0 ? "text-red-700" : "text-slate-400"}`}>
                    {diff === null ? "" : diff > 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > 300 && <p className="px-4 py-3 text-xs text-slate-500">Đang hiện 300/{rows.length} sản phẩm – hãy lọc theo danh mục hoặc tìm kiếm.</p>}
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (VD: Kiểm kho cuối tháng 9)" aria-label="Ghi chú kiểm kho" className="h-10 min-w-60 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
        <span className="text-sm text-slate-600">
          {changes.length} sản phẩm có số đếm
          {changes.length > 0 && ` · chênh lệch ${changes.reduce((s, c) => s + (c.counted - (byId.get(c.id)?.stock ?? 0)), 0)}`}
        </span>
        <button onClick={submit} disabled={pending || !changes.length} className="h-10 rounded-lg bg-teal-navy px-5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Đang lưu…" : "Ghi nhận kiểm kho"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </>
  );
}
