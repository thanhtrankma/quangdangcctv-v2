import type { Metadata } from "next";
import Link from "next/link";
import { Kpi, KpiRow } from "@/components/admin/kpi";
import { StockBadge } from "@/components/admin/stock-badge";
import { compactMoney, listAll, listStockProducts, stockState } from "@/lib/admin/inventory";
import { formatPrice } from "@/lib/format";
import type { Order, PurchaseOrder, Supplier } from "@/lib/types";

export const metadata: Metadata = { title: "Báo cáo" };

const COUNTED = new Set(["confirmed", "shipping", "completed"]);
const vnDate = (d: Date) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10); // Asia/Ho_Chi_Minh

type SP = Promise<{ from?: string; to?: string }>;

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const now = new Date();
  const from = sp.from || `${vnDate(now).slice(0, 8)}01`;
  const to = sp.to || vnDate(now);
  const inRange = (iso?: string | null) => {
    if (!iso) return false;
    const d = vnDate(new Date(iso));
    return d >= from && d <= to;
  };

  const [orders, pos, suppliers, products] = await Promise.all([
    listAll<Order>("orders", { columns: ["id", "code", "status", "total", "cost_total", "stock_deducted", "items", "created_at"] }),
    listAll<PurchaseOrder>("purchase_orders", { columns: ["id", "code", "supplier_id", "status", "total", "paid_amount", "received_at"] }),
    listAll<Supplier>("suppliers", { columns: ["id", "name", "phone"] }),
    listStockProducts(),
  ]);

  const period = orders.filter((o) => inRange(o.created_at));
  const counted = period.filter((o) => COUNTED.has(o.status));
  const revenue = counted.reduce((s, o) => s + (o.total ?? 0), 0);
  const withCost = counted.filter((o) => o.stock_deducted);
  const cogs = withCost.reduce((s, o) => s + (o.cost_total ?? 0), 0);
  const revenueWithCost = withCost.reduce((s, o) => s + (o.total ?? 0), 0);
  const profit = revenueWithCost - cogs;
  const cancelled = period.filter((o) => o.status === "cancelled").length;
  const pending = period.filter((o) => o.status === "new").length;

  const received = pos.filter((p) => p.status === "received" && inRange(p.received_at));
  const purchased = received.reduce((s, p) => s + p.total, 0);

  // Top sellers in the period
  const agg = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
  for (const o of counted) {
    for (const it of o.items ?? []) {
      const a = agg.get(it.slug) ?? { name: it.name, qty: 0, revenue: 0, cost: 0 };
      a.qty += it.qty;
      a.revenue += it.qty * it.price;
      a.cost += it.qty * (it.cost ?? 0);
      agg.set(it.slug, a);
    }
  }
  const top = [...agg.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);

  // Supplier payables (all received POs, any date)
  const owed = new Map<string, number>();
  for (const p of pos) if (p.status === "received") owed.set(p.supplier_id ?? "", (owed.get(p.supplier_id ?? "") ?? 0) + Math.max(0, p.total - p.paid_amount));
  const payables = [...owed.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "Chưa chọn nhà cung cấp";

  const stockValue = products.filter((p) => p.track_stock).reduce((s, p) => s + Math.max(p.stock, 0) * p.cost_price, 0);
  const lowList = products.filter((p) => ["low", "out"].includes(stockState(p))).sort((a, b) => a.stock - b.stock).slice(0, 12);

  const presets = [
    { label: "Tháng này", from: `${vnDate(now).slice(0, 8)}01`, to: vnDate(now) },
    { label: "7 ngày", from: vnDate(new Date(now.getTime() - 6 * 864e5)), to: vnDate(now) },
    { label: "30 ngày", from: vnDate(new Date(now.getTime() - 29 * 864e5)), to: vnDate(now) },
    { label: "Năm nay", from: `${now.getFullYear()}-01-01`, to: vnDate(now) },
  ];
  const card = "rounded-xl bg-white p-4 shadow-sm";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Doanh thu & lợi nhuận</h1>
        <form className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="r-from" className="block text-xs text-slate-500">
              Từ ngày
            </label>
            <input id="r-from" type="date" name="from" defaultValue={from} className="h-9 rounded-md border border-slate-300 px-2 text-sm" />
          </div>
          <div>
            <label htmlFor="r-to" className="block text-xs text-slate-500">
              Đến ngày
            </label>
            <input id="r-to" type="date" name="to" defaultValue={to} className="h-9 rounded-md border border-slate-300 px-2 text-sm" />
          </div>
          <button className="h-9 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white">Xem</button>
        </form>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Link
            key={p.label}
            href={`/admin/reports/?from=${p.from}&to=${p.to}`}
            aria-current={p.from === from && p.to === to ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${p.from === from && p.to === to ? "border-teal-navy bg-teal-navy text-white" : "border-slate-300 bg-white"}`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <KpiRow>
        <Kpi label="Doanh thu" value={compactMoney(revenue)} sub={`${counted.length} đơn đã xác nhận · ${formatPrice(revenue)}`} />
        <Kpi
          label="Lãi gộp"
          value={compactMoney(profit)}
          sub={revenueWithCost ? `Biên ${((profit / revenueWithCost) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% trên ${withCost.length} đơn có giá vốn` : "Chưa có đơn nào đã trừ kho"}
        />
        <Kpi label="Giá trị đơn trung bình" value={compactMoney(counted.length ? revenue / counted.length : 0)} sub={`${pending} đơn mới chờ xử lý · ${cancelled} đơn huỷ`} />
        <Kpi label="Tiền nhập hàng" value={compactMoney(purchased)} sub={`${received.length} phiếu đã nhập kho`} href="/admin/purchase_orders/?status=received" />
      </KpiRow>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className={card} aria-labelledby="top-title">
          <h2 id="top-title" className="mb-3 font-bold">
            Sản phẩm bán chạy trong kỳ
          </h2>
          {top.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="py-2">Sản phẩm</th>
                    <th className="py-2 text-right">SL</th>
                    <th className="py-2 text-right">Doanh thu</th>
                    <th className="py-2 text-right">Lãi gộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top.map(([slug, a]) => (
                    <tr key={slug}>
                      <td className="py-2 pr-3">{a.name}</td>
                      <td className="py-2 text-right tabular-nums">{a.qty}</td>
                      <td className="py-2 text-right tabular-nums">{formatPrice(a.revenue)}</td>
                      <td className="py-2 text-right tabular-nums">{a.cost ? formatPrice(a.revenue - a.cost) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">Chưa có đơn hàng đã xác nhận trong khoảng thời gian này.</p>
          )}
        </section>

        <section className={card} aria-labelledby="debt-title">
          <h2 id="debt-title" className="mb-3 font-bold">
            Công nợ nhà cung cấp
          </h2>
          {payables.length ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {payables.map(([id, v]) => (
                  <tr key={id}>
                    <td className="py-2 pr-3">
                      {id ? (
                        <Link href={`/admin/purchase_orders/?supplier_id=${id}&status=received`} className="hover:text-teal-700">
                          {supplierName(id)}
                        </Link>
                      ) : (
                        supplierName(id)
                      )}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">{formatPrice(v)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td className="pt-2 font-semibold">Tổng phải trả</td>
                  <td className="pt-2 text-right font-bold tabular-nums">{formatPrice(payables.reduce((s, [, v]) => s + v, 0))}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">Không còn công nợ.</p>
          )}
        </section>
      </div>

      <section className={card} aria-labelledby="low-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="low-title" className="font-bold">
            Cần nhập thêm
          </h2>
          <span className="text-sm text-slate-500">Giá trị tồn kho hiện tại: {formatPrice(stockValue)}</span>
        </div>
        {lowList.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {lowList.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <Link href={`/admin/stock_movements/?product_id=${p.id}`} className="line-clamp-1 hover:text-teal-700">
                  {p.name}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums">{p.stock}</span>
                  <StockBadge state={stockState(p)} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">Không có sản phẩm nào sắp hết (chỉ tính sản phẩm đang theo dõi tồn kho).</p>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Doanh thu tính các đơn có trạng thái Đã xác nhận, Đang giao, Hoàn thành, theo ngày đặt hàng. Lãi gộp = doanh thu − giá vốn ghi nhận lúc trừ kho (chỉ các
        đơn đã trừ kho).
      </p>
    </div>
  );
}
