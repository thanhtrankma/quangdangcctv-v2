/**
 * JSON-file database used until Supabase is connected.
 * Local dev writes to .data/db.json; on Vercel the filesystem is read-only, so writes
 * go to /tmp and only live as long as the serverless instance (demo only).
 */
import fs from "node:fs";
import path from "node:path";
import { seedSettings, seedTables } from "@/data/seed";
import type { Settings, SettingsKey } from "@/lib/types";
import type { ListResult, Query, Repo, StockMoveInput, TableName } from "./types";

type Row = Record<string, unknown> & { id: string };
type Store = { tables: Record<string, Row[]>; settings: Partial<Settings> };

const FILE = process.env.VERCEL ? "/tmp/dolphinhouse-db.json" : path.join(process.cwd(), ".data", "db.json");

const g = globalThis as unknown as { __dhStore?: Store };

function load(): Store {
  if (g.__dhStore) return g.__dhStore;
  let store: Store | null = null;
  try {
    store = JSON.parse(fs.readFileSync(FILE, "utf8")) as Store;
  } catch {
    store = { tables: structuredClone(seedTables) as unknown as Record<string, Row[]>, settings: structuredClone(seedSettings) };
  }
  // New tables added to the seed later still show up in an older db.json.
  for (const [name, rows] of Object.entries(seedTables)) {
    if (!store.tables[name]) store.tables[name] = structuredClone(rows) as unknown as Row[];
  }
  g.__dhStore = store;
  return store;
}

function persist() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(g.__dhStore));
  } catch (e) {
    console.warn("[mock-db] could not persist:", (e as Error).message);
  }
}

const norm = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

function applyQuery<T>(rows: Row[], q: Query = {}): ListResult<T> {
  let out = rows;
  for (const [col, val] of Object.entries(q.where ?? {})) {
    out = Array.isArray(val) ? out.filter((r) => val.includes(r[col])) : out.filter((r) => r[col] === val);
  }
  if (q.search?.term) {
    const term = norm(q.search.term);
    out = out.filter((r) => q.search!.columns.some((c) => norm(r[c]).includes(term)));
  }
  if (q.order?.length) {
    out = [...out].sort((a, b) => {
      for (const { column, ascending = true } of q.order!) {
        const x = a[column] as string | number | null;
        const y = b[column] as string | number | null;
        if (x === y) continue;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        return (x < y ? -1 : 1) * (ascending ? 1 : -1);
      }
      return 0;
    });
  }
  const count = out.length;
  const offset = q.offset ?? 0;
  out = q.limit !== undefined ? out.slice(offset, offset + q.limit) : out.slice(offset);
  if (q.columns) out = out.map((r) => Object.fromEntries(q.columns!.map((c) => [c, r[c]])) as Row);
  return { rows: structuredClone(out) as T[], count };
}

export const mockRepo: Repo = {
  kind: "mock",
  async list<T>(table: TableName, q?: Query) {
    return applyQuery<T>(load().tables[table] ?? [], q);
  },
  async get<T>(table: TableName, id: string) {
    const row = (load().tables[table] ?? []).find((r) => r.id === id);
    return row ? (structuredClone(row) as T) : null;
  },
  async findOne<T>(table: TableName, where: Record<string, unknown>) {
    return applyQuery<T>(load().tables[table] ?? [], { where, limit: 1 }).rows[0] ?? null;
  },
  async insert<T>(table: TableName, data: Record<string, unknown>) {
    const now = new Date().toISOString();
    const row = { ...data, id: (data.id as string) || crypto.randomUUID(), created_at: now, updated_at: now } as Row;
    const rows = load().tables[table];
    if (rows.some((r) => r.id === row.id)) throw new Error("Bản ghi với ID này đã tồn tại");
    rows.unshift(row);
    persist();
    return structuredClone(row) as T;
  },
  async update<T>(table: TableName, id: string, data: Record<string, unknown>) {
    const rows = load().tables[table];
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error("Không tìm thấy bản ghi");
    rows[i] = { ...rows[i], ...data, id, updated_at: new Date().toISOString() };
    persist();
    return structuredClone(rows[i]) as T;
  },
  async remove(table: TableName, id: string) {
    const store = load();
    store.tables[table] = store.tables[table].filter((r) => r.id !== id);
    persist();
  },
  async getSettings() {
    const s = load().settings;
    const merged = structuredClone(seedSettings);
    for (const k of Object.keys(merged) as SettingsKey[]) Object.assign(merged[k], s[k] ?? {});
    return merged;
  },
  async setSetting(key, value) {
    load().settings[key] = structuredClone(value);
    persist();
  },
  // Same rules as the apply_stock_movement SQL function (supabase/migrations/002).
  async stockMove(m: StockMoveInput) {
    const store = load();
    const p = store.tables.products.find((r) => r.id === m.productId);
    if (!p) throw new Error(`Không tìm thấy sản phẩm ${m.productId}`);
    const stock = Number(p.stock ?? 0);
    const cost = Number(p.cost_price ?? 0);
    let newCost = cost;
    if (m.type === "purchase" && m.qty > 0 && m.unitCost != null) {
      const base = Math.max(stock, 0);
      newCost = Math.round((base * cost + m.qty * m.unitCost) / (base + m.qty));
    }
    const now = new Date().toISOString();
    Object.assign(p, { stock: stock + m.qty, cost_price: newCost, track_stock: true, updated_at: now });
    store.tables.stock_movements.unshift({
      id: crypto.randomUUID(),
      product_id: m.productId,
      product_name: String(p.name ?? ""),
      type: m.type,
      qty: m.qty,
      stock_after: stock + m.qty,
      unit_cost: m.unitCost ?? cost,
      ref_type: m.refType ?? "",
      ref_id: m.refId ?? "",
      ref_code: m.refCode ?? "",
      note: m.note ?? "",
      created_at: now,
      updated_at: now,
    });
    persist();
    return stock + m.qty;
  },
};
