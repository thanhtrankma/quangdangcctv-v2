"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { bulkPrice, type BulkPriceInput, type BulkPriceRow } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

type C = { id: string; name: string; parent_id: string | null };

const label = "mb-1 block text-sm font-semibold text-slate-700";
const input = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600";

function descendants(cats: C[], id: string) {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) cats.filter((c) => c.parent_id === ids[i]).forEach((c) => ids.push(c.id));
  return ids;
}

export function BulkPriceClient({ categories, brands }: { categories: C[]; brands: { id: string; name: string }[] }) {
  const [cat, setCat] = useState("");
  const [f, setF] = useState<Omit<BulkPriceInput, "categoryIds" | "apply">>({
    brandId: "",
    q: "",
    field: "price",
    mode: "percent",
    value: 5,
    round: 1000,
    note: "",
  });
  const [rows, setRows] = useState<BulkPriceRow[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setRows(null);
  };

  const run = (apply: boolean) => {
    const changed = rows?.filter((r) => r.after !== r.before && r.after != null).length ?? 0;
    if (apply && !confirm(`Áp dụng giá mới cho ${changed} sản phẩm?`)) return;
    setMsg(null);
    start(async () => {
      const r = await bulkPrice({ ...f, categoryIds: cat ? descendants(categories, cat) : [], apply });
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setRows(r.rows);
      if (apply) {
        setMsg({ ok: true, text: `Đã cập nhật ${r.applied} sản phẩm.` });
        setRows(null);
      }
    });
  };

  const changed = rows?.filter((r) => r.after !== r.before && r.after != null) ?? [];
  const tree = (parent: string | null, depth: number): React.ReactNode[] =>
    categories
      .filter((c) => c.parent_id === parent)
      .flatMap((c) => [
        <option key={c.id} value={c.id}>
          {"— ".repeat(depth)}
          {c.name}
        </option>,
        ...tree(c.id, depth + 1),
      ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="bp-cat" className={label}>
            Danh mục (gồm danh mục con)
          </label>
          <select id="bp-cat" value={cat} onChange={(e) => {
              setCat(e.target.value);
              setRows(null);
            }} className={input}>
            <option value="">Tất cả</option>
            {tree(null, 0)}
          </select>
        </div>
        <div>
          <label htmlFor="bp-brand" className={label}>
            Thương hiệu
          </label>
          <select id="bp-brand" value={f.brandId} onChange={(e) => set("brandId", e.target.value)} className={input}>
            <option value="">Tất cả</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bp-q" className={label}>
            Tên / SKU chứa
          </label>
          <input id="bp-q" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="VD: camera ip" className={input} />
        </div>
        <div>
          <label htmlFor="bp-field" className={label}>
            Giá cần đổi
          </label>
          <select id="bp-field" value={f.field} onChange={(e) => set("field", e.target.value as BulkPriceInput["field"])} className={input}>
            <option value="price">Giá bán</option>
            <option value="compare_at_price">Giá gốc (gạch ngang)</option>
            <option value="wholesale_price">Giá sỉ / đại lý</option>
          </select>
        </div>
        <div>
          <label htmlFor="bp-mode" className={label}>
            Cách tính
          </label>
          <select id="bp-mode" value={f.mode} onChange={(e) => set("mode", e.target.value as BulkPriceInput["mode"])} className={input}>
            <option value="percent">Tăng/giảm theo %</option>
            <option value="amount">Tăng/giảm số tiền</option>
            <option value="margin">Theo giá vốn + % lãi</option>
          </select>
        </div>
        <div>
          <label htmlFor="bp-value" className={label}>
            {f.mode === "amount" ? "Số tiền (₫, âm để giảm)" : f.mode === "margin" ? "% lãi trên giá vốn" : "% (âm để giảm)"}
          </label>
          <input id="bp-value" type="number" value={f.value} onChange={(e) => set("value", Number(e.target.value))} className={input} />
        </div>
        <div>
          <label htmlFor="bp-round" className={label}>
            Làm tròn tới
          </label>
          <select id="bp-round" value={f.round} onChange={(e) => set("round", Number(e.target.value))} className={input}>
            <option value={1}>Không làm tròn</option>
            <option value={1000}>1.000 ₫</option>
            <option value={10000}>10.000 ₫</option>
            <option value={50000}>50.000 ₫</option>
            <option value={100000}>100.000 ₫</option>
          </select>
        </div>
        <div>
          <label htmlFor="bp-note" className={label}>
            Ghi chú (lưu vào lịch sử giá)
          </label>
          <input id="bp-note" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="VD: Hikvision tăng giá T10" className={input} />
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
          <button onClick={() => run(false)} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-800 px-5 text-sm font-semibold text-white disabled:opacity-50">
            {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Xem trước
          </button>
          <button onClick={() => run(true)} disabled={pending || !changed.length} className="h-10 rounded-lg bg-teal-navy px-5 text-sm font-semibold text-white disabled:opacity-50">
            Áp dụng cho {changed.length} sản phẩm
          </button>
          {f.mode === "margin" && <span className="text-xs text-slate-500">Sản phẩm chưa có giá vốn sẽ được bỏ qua.</span>}
          {msg && (
            <span role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
              {msg.text}
            </span>
          )}
        </div>
      </div>

      {rows && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Sản phẩm ({rows.length})</th>
                <th className="px-4 py-3 text-right">Giá vốn</th>
                <th className="px-4 py-3 text-right">Hiện tại</th>
                <th className="px-4 py-3 text-right">Mới</th>
                <th className="px-4 py-3 text-right">Thay đổi</th>
                <th className="px-4 py-3 text-right">Biên lãi mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 500).map((r) => {
                const d = r.after != null && r.before != null ? r.after - r.before : null;
                const m = f.field === "price" && r.after && r.cost ? ((r.after - r.cost) / r.after) * 100 : null;
                return (
                  <tr key={r.id} className={d ? "" : "text-slate-400"}>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.cost ? formatPrice(r.cost) : "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.before != null ? formatPrice(r.before) : "—"}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.after != null ? formatPrice(r.after) : "—"}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${d && d > 0 ? "text-emerald-700" : d && d < 0 ? "text-red-700" : ""}`}>
                      {d ? `${d > 0 ? "+" : ""}${d.toLocaleString("vi-VN")}` : "—"}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums ${m !== null && m < 10 ? "font-semibold text-red-700" : ""}`}>
                      {m === null ? "—" : `${m.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
