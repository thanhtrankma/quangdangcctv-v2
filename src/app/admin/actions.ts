"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createSessionToken, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getResource, getSettingsGroup, type Field } from "@/lib/admin/config";
import { hooksFor, logPrice } from "@/lib/admin/hooks";
import { db, isSupabaseConfigured } from "@/lib/db";
import { supabaseAdmin } from "@/lib/db/supabase";
import { slugify } from "@/lib/format";
import type { Product, Settings, SettingsKey } from "@/lib/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
}

export async function login(_: string | null, form: FormData) {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!checkCredentials(email, password)) return "Email hoặc mật khẩu không đúng.";
  const { token, maxAge } = createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  const next = String(form.get("next") || "/admin/");
  redirect(next.startsWith("/admin") ? next : "/admin/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login/");
}

/** Coerce raw form values into what the database expects, keeping only configured fields. */
function coerce(fields: Field[], values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "readonly" || f.type === "order_items") continue;
    const v = values[f.name];
    switch (f.type) {
      case "number":
        out[f.name] = Number(v) || 0;
        break;
      case "money":
        out[f.name] = v === "" || v === null || v === undefined ? (f.required ? 0 : null) : Math.max(0, Math.round(Number(v) || 0));
        break;
      case "boolean":
        out[f.name] = Boolean(v);
        break;
      case "relation":
        out[f.name] = v ? String(v) : null;
        break;
      case "images":
        out[f.name] = Array.isArray(v) ? v.filter(Boolean).map(String) : [];
        break;
      case "po_items":
        out[f.name] = Array.isArray(v)
          ? v.map((i: Record<string, unknown>) => ({
              product_id: String(i.product_id ?? ""),
              name: String(i.name ?? ""),
              sku: String(i.sku ?? ""),
              qty: Math.max(0, Math.round(Number(i.qty) || 0)),
              unit_cost: Math.max(0, Math.round(Number(i.unit_cost) || 0)),
            }))
          : [];
        break;
      case "list":
        out[f.name] = Array.isArray(v) ? v.map((item) => coerce(f.fields ?? [], (item ?? {}) as Record<string, unknown>)) : [];
        break;
      case "slug":
        out[f.name] = slugify(String(v ?? "")) || slugify(String(values[f.from ?? ""] ?? ""));
        break;
      case "date":
        out[f.name] = v ? String(v) : new Date().toISOString().slice(0, 10);
        break;
      default:
        out[f.name] = v === null || v === undefined ? "" : String(v);
    }
  }
  return out;
}

function validate(fields: Field[], data: Record<string, unknown>) {
  for (const f of fields) {
    if (!f.required) continue;
    const v = data[f.name];
    if (v === "" || v === null || v === undefined || (Array.isArray(v) && !v.length)) return `Vui lòng nhập “${f.label}”.`;
  }
  return null;
}

export async function saveRecord(resourceKey: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult> {
  try {
    await requireAdmin();
    const res = getResource(resourceKey);
    if (!res) return { ok: false, error: "Không tìm thấy mục quản lý" };
    if (res.readOnly) return { ok: false, error: "Mục này chỉ để xem." };
    const data = coerce(res.fields, values);
    const err = validate(res.fields, data);
    if (err) return { ok: false, error: err };

    if ("slug" in data) {
      const dup = await db().findOne<{ id: string }>(res.key, { slug: data.slug });
      if (dup && dup.id !== id) return { ok: false, error: `Đường dẫn “${data.slug}” đã được dùng, hãy chọn slug khác.` };
    }
    if (res.key === "categories" && id && data.parent_id === id) return { ok: false, error: "Danh mục không thể là cha của chính nó." };

    const hooks = hooksFor(res.key);
    const old = id ? await db().get<Record<string, unknown>>(res.key, id) : null;
    await hooks.beforeSave?.({ id, data, old });
    const row = id
      ? await db().update<Record<string, unknown> & { id: string }>(res.key, id, data)
      : await db().insert<Record<string, unknown> & { id: string }>(res.key, data);
    await hooks.afterSave?.({ id: row.id, data, old, row });
    revalidatePath("/", "layout");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const res = getResource(resourceKey);
    if (!res) return { ok: false, error: "Không tìm thấy mục quản lý" };
    if (res.readOnly || res.canDelete === false) return { ok: false, error: "Không thể xoá mục này." };
    const old = await db().get<Record<string, unknown>>(res.key, id);
    if (old) await hooksFor(res.key).beforeDelete?.(old);
    await db().remove(res.key, id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function saveSettings(groupKey: string, values: Record<string, unknown>): Promise<ActionResult> {
  try {
    await requireAdmin();
    const group = getSettingsGroup(groupKey);
    if (!group) return { ok: false, error: "Không tìm thấy nhóm cài đặt" };
    const current = await db().getSettings();
    const next = { ...current[group.key], ...coerce(group.fields, values) } as Settings[SettingsKey];
    await db().setSetting(group.key, next);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);

/** Upload an image: Supabase Storage when connected, otherwise public/uploads (local dev only). */
export async function uploadImage(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return { ok: false, error: "Chưa chọn file" };
    if (!ALLOWED.has(file.type)) return { ok: false, error: "Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF, SVG, AVIF" };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Ảnh tối đa 10MB" };

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 60) || "image";
    const d = new Date();
    const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${base}-${Date.now().toString(36)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    if (isSupabaseConfigured()) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
      const { error } = await supabaseAdmin().storage.from(bucket).upload(key, bytes, { contentType: file.type, upsert: false });
      if (error) return { ok: false, error: error.message };
      return { ok: true, url: supabaseAdmin().storage.from(bucket).getPublicUrl(key).data.publicUrl };
    }
    if (process.env.VERCEL) return { ok: false, error: "Cần kết nối Supabase để upload ảnh trên Vercel. Tạm thời hãy dán link ảnh." };
    const dest = path.join(process.cwd(), "public", "uploads", key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, bytes);
    return { ok: true, url: `/uploads/${key}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Stocktake: set counted quantities; the difference is written as an adjustment movement. */
export async function applyStocktake(counts: { productId: string; counted: number }[], note: string): Promise<ActionResult & { changed?: number }> {
  try {
    await requireAdmin();
    let changed = 0;
    for (const { productId, counted } of counts) {
      const target = Math.round(Number(counted));
      if (!Number.isFinite(target) || target < 0) continue;
      const p = await db().get<Product>("products", productId);
      if (!p) continue;
      const delta = target - Number(p.stock ?? 0);
      if (delta === 0 && p.track_stock) continue;
      await db().stockMove({
        productId,
        qty: delta,
        type: "adjustment",
        refType: "stocktake",
        refCode: `KK${new Date().toISOString().slice(2, 10).replace(/-/g, "")}`,
        note: note || "Kiểm kho",
      });
      changed++;
    }
    revalidatePath("/", "layout");
    return { ok: true, changed };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface BulkPriceInput {
  categoryIds: string[];
  brandId: string;
  q: string;
  field: "price" | "compare_at_price" | "wholesale_price";
  mode: "percent" | "amount" | "margin";
  value: number;
  round: number;
  note: string;
  apply: boolean;
}

export interface BulkPriceRow {
  id: string;
  name: string;
  cost: number;
  before: number | null;
  after: number | null;
}

/** Preview (apply=false) or apply a bulk price change. margin mode sets price = cost × (1 + value%). */
export async function bulkPrice(input: BulkPriceInput): Promise<{ ok: true; rows: BulkPriceRow[]; applied: number } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const where: Record<string, unknown> = {};
    if (input.categoryIds.length) where.category_id = input.categoryIds;
    if (input.brandId) where.brand_id = input.brandId;
    const { rows } = await db().list<Product>("products", {
      where,
      columns: ["id", "name", "price", "compare_at_price", "wholesale_price", "cost_price"],
      search: input.q ? { columns: ["name", "sku"], term: input.q } : undefined,
      order: [{ column: "name" }],
    });
    const round = Math.max(1, Math.round(input.round || 1));
    const calc = (p: Product) => {
      const before = (p[input.field] as number | null | undefined) ?? null;
      let after: number | null;
      if (input.mode === "margin") after = p.cost_price ? p.cost_price * (1 + input.value / 100) : null;
      else if (before == null || before <= 0) after = before;
      else after = input.mode === "percent" ? before * (1 + input.value / 100) : before + input.value;
      if (after != null) after = Math.max(0, Math.round(after / round) * round);
      return { id: p.id, name: p.name, cost: p.cost_price ?? 0, before, after };
    };
    const result = rows.map(calc);
    let applied = 0;
    if (input.apply) {
      for (const r of result) {
        if (r.after == null || r.after === r.before) continue;
        const before = await db().get<Product>("products", r.id);
        if (!before) continue;
        const after = await db().update<Product>("products", r.id, { [input.field]: r.after });
        await logPrice(before, after, "bulk", input.note);
        applied++;
      }
      revalidatePath("/", "layout");
    }
    return { ok: true, rows: result, applied };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
