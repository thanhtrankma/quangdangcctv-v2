/**
 * Business rules that run around the generic admin save/delete (see app/admin/actions.ts):
 * purchase orders move stock in, orders move stock out, price edits are logged.
 */
import { db, type TableName } from "@/lib/db";
import type { Order, OrderItem, PriceHistory, Product, PurchaseItem, PurchaseOrder } from "@/lib/types";

type Row = Record<string, unknown>;
export interface SaveCtx {
  id: string | null;
  data: Row;
  old: Row | null;
}
interface Hooks {
  beforeSave?: (ctx: SaveCtx) => Promise<void> | void;
  afterSave?: (ctx: SaveCtx & { row: Row }) => Promise<void>;
  beforeDelete?: (old: Row) => Promise<void> | void;
}

const n = (v: unknown) => Math.round(Number(v) || 0);
const today = () => new Date().toISOString().slice(0, 10);

async function uniqueCode(table: TableName, prefix: string) {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  for (;;) {
    const code = `${prefix}${stamp}${Math.floor(Math.random() * 9000 + 1000)}`;
    if (!(await db().findOne(table, { code }))) return code;
  }
}

/** Spread shipping/discount over lines by value → landed unit cost used for the moving average. */
export function landedCosts(items: PurchaseItem[], shipping: number, discount: number) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
  const extra = shipping - discount;
  return items.map((i) => {
    const share = subtotal > 0 ? (i.qty * i.unit_cost) / subtotal : 1 / items.length;
    return Math.max(0, Math.round(i.unit_cost + (extra * share) / Math.max(i.qty, 1)));
  });
}

const STOCK_OUT_STATUSES = new Set(["confirmed", "shipping", "completed"]);

const hooks: Partial<Record<TableName, Hooks>> = {
  purchase_orders: {
    async beforeSave({ data, old }) {
      const oldStatus = (old?.status as string) ?? "draft";
      const next = data.status as string;
      if (oldStatus === "cancelled" && next !== "cancelled") throw new Error("Phiếu đã huỷ không thể mở lại. Hãy tạo phiếu mới.");
      if (oldStatus === "received" && next === "draft") throw new Error("Phiếu đã nhập kho không thể chuyển về Nháp. Hãy huỷ phiếu nếu nhập sai.");
      if (oldStatus !== "draft") {
        // Lines and money that drove stock/cost are frozen once received.
        for (const k of ["items", "shipping_fee", "discount"]) data[k] = old![k];
      }

      const items = ((data.items as PurchaseItem[]) ?? [])
        .map((i) => ({ ...i, qty: n(i.qty), unit_cost: n(i.unit_cost) }))
        .filter((i) => i.product_id && i.qty > 0);
      if (next === "received" && !items.length) throw new Error("Phiếu nhập chưa có sản phẩm nào.");
      data.items = items;
      data.subtotal = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
      data.total = Math.max(0, n(data.subtotal) + n(data.shipping_fee) - n(data.discount));
      data.paid_amount = Math.min(n(data.paid_amount), n(data.total));
      data.ordered_at = data.ordered_at || today();
      data.code = old?.code || (await uniqueCode("purchase_orders", "PN"));
      data.received_at = old?.received_at ?? null;
      if (next === "received" && oldStatus !== "received") data.received_at = new Date().toISOString();
    },
    async afterSave({ row, old }) {
      const po = row as unknown as PurchaseOrder;
      const oldStatus = (old?.status as string) ?? "draft";
      if (po.status === "received" && oldStatus !== "received") {
        const costs = landedCosts(po.items, po.shipping_fee, po.discount);
        for (const [k, it] of po.items.entries()) {
          const before = await db().get<Product>("products", it.product_id);
          await db().stockMove({
            productId: it.product_id,
            qty: it.qty,
            type: "purchase",
            unitCost: costs[k],
            refType: "purchase_order",
            refId: po.id,
            refCode: po.code,
          });
          const after = await db().get<Product>("products", it.product_id);
          if (before && after && n(before.cost_price) !== n(after.cost_price)) {
            await logPrice(before, after, "purchase", `Nhập ${it.qty} × ${costs[k].toLocaleString("vi-VN")} ₫ (${po.code})`);
          }
        }
      } else if (po.status === "cancelled" && oldStatus === "received") {
        for (const it of po.items) {
          await db().stockMove({
            productId: it.product_id,
            qty: -it.qty,
            type: "purchase_cancel",
            refType: "purchase_order",
            refId: po.id,
            refCode: po.code,
            note: "Huỷ phiếu nhập",
          });
        }
      }
    },
    beforeDelete(old) {
      if (old.status === "received") throw new Error("Phiếu đã nhập kho không thể xoá. Hãy chuyển trạng thái sang Đã huỷ.");
    },
  },

  orders: {
    beforeSave({ data, old }) {
      // Stock bookkeeping is owned by afterSave; never let the form overwrite it.
      data.stock_deducted = Boolean(old?.stock_deducted);
      data.cost_total = n(old?.cost_total);
      data.items = old?.items ?? data.items;
    },
    async afterSave({ row }) {
      const order = row as unknown as Order;
      const wantOut = STOCK_OUT_STATUSES.has(order.status);
      if (wantOut && !order.stock_deducted) {
        const items: OrderItem[] = [];
        let cost = 0;
        for (const it of order.items) {
          const p = await db().findOne<Product>("products", { slug: it.slug });
          if (!p) {
            items.push(it);
            continue;
          }
          const unit = n(p.cost_price);
          await db().stockMove({ productId: p.id, qty: -it.qty, type: "sale", unitCost: unit, refType: "order", refId: order.id, refCode: order.code });
          items.push({ ...it, cost: unit });
          cost += unit * it.qty;
        }
        await db().update("orders", order.id, { stock_deducted: true, cost_total: cost, items });
      } else if (order.status === "cancelled" && order.stock_deducted) {
        for (const it of order.items) {
          const p = await db().findOne<Product>("products", { slug: it.slug });
          if (p) {
            await db().stockMove({
              productId: p.id,
              qty: it.qty,
              type: "sale_return",
              unitCost: it.cost ?? null,
              refType: "order",
              refId: order.id,
              refCode: order.code,
              note: "Huỷ đơn – nhập lại kho",
            });
          }
        }
        await db().update("orders", order.id, { stock_deducted: false });
      }
    },
    beforeDelete(old) {
      if (old.stock_deducted) throw new Error("Đơn đã trừ kho. Hãy chuyển sang Đã huỷ (hàng tự về kho) trước khi xoá.");
    },
  },

  products: {
    beforeSave({ data, old }) {
      if (old) {
        // Stock only changes through stock movements.
        delete data.stock;
      }
    },
    async afterSave({ row, old }) {
      if (old) await logPrice(old as unknown as Product, row as unknown as Product, "manual", "");
    },
  },

  stock_movements: {
    beforeDelete() {
      throw new Error("Thẻ kho là lịch sử, không thể xoá.");
    },
  },
  price_history: {
    beforeDelete() {
      throw new Error("Lịch sử giá không thể xoá.");
    },
  },
};

/** Write a price_history row if price, compare-at or cost changed. */
export async function logPrice(before: Product, after: Product, source: PriceHistory["source"], note: string) {
  const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null) || n(a) === n(b);
  if (same(before.price, after.price) && same(before.compare_at_price, after.compare_at_price) && same(before.cost_price, after.cost_price)) return;
  await db().insert<PriceHistory>("price_history", {
    product_id: after.id,
    product_name: after.name,
    old_price: before.price ?? null,
    new_price: after.price ?? null,
    old_compare_at_price: before.compare_at_price ?? null,
    new_compare_at_price: after.compare_at_price ?? null,
    old_cost_price: before.cost_price ?? null,
    new_cost_price: after.cost_price ?? null,
    source,
    note,
  });
}

export const hooksFor = (table: TableName): Hooks => hooks[table] ?? {};
