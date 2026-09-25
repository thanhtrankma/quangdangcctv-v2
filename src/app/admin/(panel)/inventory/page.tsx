import type { Metadata } from "next";
import Link from "next/link";
import { Kpi, KpiRow } from "@/components/admin/kpi";
import { StockBadge } from "@/components/admin/stock-badge";
import { compactMoney, listStockProducts, marginPct, stockState, type StockState } from "@/lib/admin/inventory";
import { categoryWithDescendants, getCategories } from "@/lib/data";
import { formatPrice, PLACEHOLDER_IMG, slugify } from "@/lib/format";

export const metadata: Metadata = { title: "Tồn kho" };

type SP = Promise<{ q?: string; cat?: string; state?: string; sort?: string; page?: string }>;
const PER_PAGE = 50;

export default async function InventoryPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [all, cats] = await Promise.all([listStockProducts(), getCategories()]);
  const tops = cats.filter((c) => !c.parent_id);

  const tracked = all.filter((p) => p.track_stock);
  const value = tracked.reduce((s, p) => s + Math.max(p.stock, 0) * p.cost_price, 0);
  const units = tracked.reduce((s, p) => s + Math.max(p.stock, 0), 0);
  const counts = { low: 0, out: 0 } as Record<StockState, number>;
  for (const p of all) counts[stockState(p)] = (counts[stockState(p)] ?? 0) + 1;

  let rows = all;
  if (sp.cat) {
    const ids = new Set(categoryWithDescendants(cats, sp.cat));
    rows = rows.filter((p) => p.category_id && ids.has(p.category_id));
  }
  if (sp.q) {
    const t = slugify(sp.q);
    rows = rows.filter((p) => slugify(`${p.name} ${p.sku}`).includes(t));
  }
  if (sp.state) rows = rows.filter((p) => stockState(p) === sp.state);
  const sorters: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    stock: (a, b) => a.stock - b.stock,
    value: (a, b) => b.stock * b.cost_price - a.stock * a.cost_price,
    margin: (a, b) => (marginPct(a.price, a.cost_price) ?? 999) - (marginPct(b.price, b.cost_price) ?? 999),
  };
  if (sp.sort && sorters[sp.sort]) rows = [...rows].sort(sorters[sp.sort]);

  const page = Math.max(1, Number(sp.page) || 1);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "—";
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return p.size ? `?${p}` : "";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tồn kho</h1>
        <div className="flex gap-2">
          <Link href="/admin/purchase_orders/new/" className="rounded-lg bg-teal-navy px-4 py-2 text-sm font-semibold text-white">
            + Tạo phiếu nhập
          </Link>
          <Link href="/admin/inventory/stocktake/" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
            Kiểm kho
          </Link>
        </div>
      </div>

      <KpiRow>
        <Kpi label="Giá trị tồn kho (theo giá vốn)" value={compactMoney(value)} sub={`${units.toLocaleString("vi-VN")} sản phẩm trong kho`} />
        <Kpi label="Sản phẩm đang theo dõi" value={tracked.length.toLocaleString("vi-VN")} sub={`/ ${all.length} sản phẩm`} href={`/admin/inventory/${qs({ state: "ok", page: undefined })}`} />
        <Kpi label="Sắp hết hàng" value={String(counts.low ?? 0)} sub="Tồn ≤ ngưỡng cảnh báo" href={`/admin/inventory/${qs({ state: "low", page: undefined })}`} />
        <Kpi label="Hết hàng" value={String(counts.out ?? 0)} sub="Tồn ≤ 0" href={`/admin/inventory/${qs({ state: "out", page: undefined })}`} />
      </KpiRow>

      <form className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
        <label className="sr-only" htmlFor="inv-q">
          Tìm sản phẩm
        </label>
        <input id="inv-q" name="q" defaultValue={sp.q} placeholder="Tên hoặc SKU…" className="h-9 min-w-48 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
        <select name="cat" defaultValue={sp.cat ?? ""} aria-label="Danh mục" className="h-9 rounded-md border border-slate-300 px-2 text-sm">
          <option value="">Tất cả danh mục</option>
          {tops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="state" defaultValue={sp.state ?? ""} aria-label="Tình trạng" className="h-9 rounded-md border border-slate-300 px-2 text-sm">
          <option value="">Mọi tình trạng</option>
          <option value="ok">Còn hàng</option>
          <option value="low">Sắp hết</option>
          <option value="out">Hết hàng</option>
          <option value="untracked">Chưa theo dõi</option>
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} aria-label="Sắp xếp" className="h-9 rounded-md border border-slate-300 px-2 text-sm">
          <option value="">Theo tên</option>
          <option value="stock">Tồn ít trước</option>
          <option value="value">Giá trị tồn cao trước</option>
          <option value="margin">Biên lãi thấp trước</option>
        </select>
        <button className="h-9 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white">Lọc</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3 text-right">Tồn</th>
              <th className="px-4 py-3">Tình trạng</th>
              <th className="px-4 py-3 text-right">Giá vốn</th>
              <th className="px-4 py-3 text-right">Giá bán</th>
              <th className="px-4 py-3 text-right">Biên lãi</th>
              <th className="px-4 py-3 text-right">Giá trị tồn</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((p) => {
              const m = marginPct(p.price, p.cost_price);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.images?.[0] || PLACEHOLDER_IMG} alt="" className="h-10 w-10 shrink-0 rounded border border-slate-200 object-contain" />
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}/`} className="line-clamp-1 font-medium hover:text-teal-700">
                          {p.name}
                        </Link>
                        {p.sku && <div className="text-xs text-slate-500">SKU {p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{catName(p.category_id)}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{p.track_stock ? p.stock : "—"}</td>
                  <td className="px-4 py-2">
                    <StockBadge state={stockState(p)} />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.cost_price ? formatPrice(p.cost_price) : "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.price ? formatPrice(p.price) : "Liên hệ"}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${m !== null && m < 10 ? "font-semibold text-red-700" : ""}`}>
                    {m === null ? "—" : `${m.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.track_stock && p.cost_price ? formatPrice(Math.max(p.stock, 0) * p.cost_price) : "—"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Link href={`/admin/stock_movements/?product_id=${p.id}`} className="text-teal-700 hover:underline">
                      Thẻ kho
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!shown.length && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  Không có sản phẩm phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Biên lãi = (giá bán − giá vốn) / giá bán. Dưới 10% được tô đỏ. {rows.length} sản phẩm.
      </p>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/admin/inventory/${qs({ page: String(page - 1) })}`} className="rounded border bg-white px-3 py-1">
              ←
            </Link>
          )}
          <span>
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={`/admin/inventory/${qs({ page: String(page + 1) })}`} className="rounded border bg-white px-3 py-1">
              →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
