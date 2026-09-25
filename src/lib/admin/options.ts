import type { Field } from "./config";
import { db, type TableName } from "@/lib/db";

/** Load {value,label} options for every relation field (including ones nested in lists). */
export async function loadRelationOptions(fields: Field[], excludeId?: string) {
  const tables = new Set<TableName>();
  const walk = (fs: Field[]) =>
    fs.forEach((f) => {
      if (f.relation) tables.add(f.relation);
      if (f.fields) walk(f.fields);
    });
  walk(fields);
  const needsProducts = fields.some((f) => f.type === "po_items");
  const entries = await Promise.all(
    [...tables].map(async (t) => {
      const hasTree = t === "categories";
      const sortable = ["categories", "brands", "post_categories"].includes(t);
      const { rows } = await db().list<{ id: string; name?: string; parent_id?: string | null }>(t, {
        columns: hasTree ? ["id", "name", "parent_id"] : ["id", "name"],
        order: sortable ? [{ column: "sort_order" }, { column: "name" }] : [{ column: "name" }],
      });
      const label = (r: (typeof rows)[number]) => {
        const parent = r.parent_id ? rows.find((p) => p.id === r.parent_id) : null;
        return `${parent ? `${parent.name} › ` : ""}${r.name ?? r.id}`;
      };
      return [t, rows.filter((r) => r.id !== excludeId).map((r) => ({ value: r.id, label: label(r) }))] as const;
    }),
  );
  const out: Record<string, { value: string; label: string; meta?: Record<string, unknown> }[]> = Object.fromEntries(entries);
  if (needsProducts) {
    const { rows } = await db().list<{ id: string; name: string; sku: string; cost_price?: number; stock?: number }>("products", {
      columns: ["id", "name", "sku", "cost_price", "stock"],
      order: [{ column: "name" }],
    });
    out.products = rows.map((p) => ({ value: p.id, label: p.name, meta: { sku: p.sku, cost: p.cost_price ?? 0, stock: p.stock ?? 0 } }));
  }
  return out;
}

export function defaultsFor(fields: Field[]) {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.default ?? (f.type === "list" || f.type === "images" ? [] : f.type === "boolean" ? false : f.type === "date" ? new Date().toISOString().slice(0, 10) : ""),
    ]),
  );
}
