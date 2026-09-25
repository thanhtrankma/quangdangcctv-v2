import { db, type Query, type TableName } from "@/lib/db";
import type { Product } from "@/lib/types";

/** Fetch every matching row, 1000 at a time (Supabase caps a single response at 1000 rows). */
export async function listAll<T>(table: TableName, q: Omit<Query, "limit" | "offset"> = {}) {
  const out: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { rows } = await db().list<T>(table, { ...q, limit: 1000, offset });
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

export type StockProduct = Pick<
  Product,
  "id" | "name" | "sku" | "slug" | "images" | "category_id" | "brand_id" | "price" | "status"
> & { cost_price: number; stock: number; low_stock_threshold: number; track_stock: boolean };

export async function listStockProducts() {
  const rows = await listAll<Product>("products", {
    columns: ["id", "name", "sku", "slug", "images", "category_id", "brand_id", "price", "status", "cost_price", "stock", "low_stock_threshold", "track_stock"],
    order: [{ column: "name" }],
  });
  return rows.map(
    (p): StockProduct => ({
      ...p,
      cost_price: Number(p.cost_price ?? 0),
      stock: Number(p.stock ?? 0),
      low_stock_threshold: Number(p.low_stock_threshold ?? 2),
      track_stock: Boolean(p.track_stock),
    }),
  );
}

export type StockState = "untracked" | "out" | "low" | "ok";
export function stockState(p: Pick<StockProduct, "track_stock" | "stock" | "low_stock_threshold">): StockState {
  if (!p.track_stock) return "untracked";
  if (p.stock <= 0) return "out";
  if (p.stock <= p.low_stock_threshold) return "low";
  return "ok";
}

export const marginPct = (price: number, cost: number) => (price > 0 && cost > 0 ? ((price - cost) / price) * 100 : null);

/** KPI-tile money: 1,2 tỷ · 12,9 tr · 850.000 ₫ */
export function compactMoney(v: number) {
  const a = Math.abs(v);
  const fmt = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (a >= 1e9) return `${fmt(v / 1e9)} tỷ`;
  if (a >= 1e6) return `${fmt(v / 1e6)} tr`;
  return `${Math.round(v).toLocaleString("vi-VN")} ₫`;
}
