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
  const entries = await Promise.all(
    [...tables].map(async (t) => {
      const { rows } = await db().list<{ id: string; name?: string; title?: string; parent_id?: string | null }>(t, {
        order: [{ column: "sort_order" }, { column: "name" }],
      });
      const label = (r: (typeof rows)[number]) => {
        const parent = r.parent_id ? rows.find((p) => p.id === r.parent_id) : null;
        return `${parent ? `${parent.name} › ` : ""}${r.name ?? r.title ?? r.id}`;
      };
      return [t, rows.filter((r) => r.id !== excludeId).map((r) => ({ value: r.id, label: label(r) }))] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function defaultsFor(fields: Field[]) {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.default ?? (f.type === "list" || f.type === "images" ? [] : f.type === "boolean" ? false : f.type === "date" ? new Date().toISOString().slice(0, 10) : ""),
    ]),
  );
}
