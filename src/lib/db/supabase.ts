import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedSettings } from "@/data/seed";
import type { Settings, SettingsKey } from "@/lib/types";
import type { Query, Repo, TableName } from "./types";

let client: SupabaseClient | null = null;

/** Server-only client. Uses the secret (service role) key so admin writes bypass RLS. */
export function supabaseAdmin() {
  if (!client) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(`[supabase] ${error.message}`);
}

export const supabaseRepo: Repo = {
  kind: "supabase",
  async list<T>(table: TableName, q: Query = {}) {
    // limit: 0 means "count only".
    const head = q.limit === 0;
    let query = supabaseAdmin().from(table).select("*", { count: "exact", head });
    for (const [col, val] of Object.entries(q.where ?? {})) {
      if (Array.isArray(val)) query = query.in(col, val);
      else if (val === null) query = query.is(col, null);
      else query = query.eq(col, val);
    }
    if (q.search?.term) {
      const term = q.search.term.replace(/[,()%*]/g, " ").trim();
      if (term) query = query.or(q.search.columns.map((c) => `${c}.ilike.%${term}%`).join(","));
    }
    for (const { column, ascending = true } of q.order ?? []) query = query.order(column, { ascending, nullsFirst: false });
    if (q.limit !== undefined && !head) {
      const from = q.offset ?? 0;
      query = query.range(from, from + q.limit - 1);
    }
    const { data, error, count } = await query;
    fail(error);
    return { rows: (data ?? []) as T[], count: count ?? 0 };
  },
  async get<T>(table: TableName, id: string) {
    const { data, error } = await supabaseAdmin().from(table).select("*").eq("id", id).maybeSingle();
    fail(error);
    return data as T | null;
  },
  async findOne<T>(table: TableName, where: Record<string, unknown>) {
    const { rows } = await this.list<T>(table, { where, limit: 1 });
    return rows[0] ?? null;
  },
  async insert<T>(table: TableName, data: Record<string, unknown>) {
    const payload = { ...data };
    if (!payload.id) delete payload.id;
    const { data: row, error } = await supabaseAdmin().from(table).insert(payload).select().single();
    fail(error);
    return row as T;
  },
  async update<T>(table: TableName, id: string, data: Record<string, unknown>) {
    const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    delete payload.id;
    delete payload.created_at;
    const { data: row, error } = await supabaseAdmin().from(table).update(payload).eq("id", id).select().single();
    fail(error);
    return row as T;
  },
  async remove(table: TableName, id: string) {
    const { error } = await supabaseAdmin().from(table).delete().eq("id", id);
    fail(error);
  },
  async getSettings() {
    const { data, error } = await supabaseAdmin().from("settings").select("key, value");
    fail(error);
    const merged = structuredClone(seedSettings);
    for (const row of data ?? []) {
      const key = row.key as SettingsKey;
      if (key in merged) Object.assign(merged[key], row.value);
    }
    return merged;
  },
  async setSetting<K extends SettingsKey>(key: K, value: Settings[K]) {
    const { error } = await supabaseAdmin()
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    fail(error);
  },
};
