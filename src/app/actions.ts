"use server";

import { db } from "@/lib/db";
import type { ContactMessage, Order, OrderItem, Product } from "@/lib/types";

type Result = { ok: true; code?: string } | { ok: false; error: string };

const clean = (v: FormDataEntryValue | null, max = 500) => String(v ?? "").trim().slice(0, max);

export async function submitContact(_: Result | null, form: FormData): Promise<Result> {
  if (clean(form.get("_hp"))) return { ok: true }; // bot trap
  const name = clean(form.get("name"), 120);
  const phone = clean(form.get("phone"), 30);
  if (!name || !/^[0-9+ .()-]{8,20}$/.test(phone)) return { ok: false, error: "Vui lòng nhập họ tên và số điện thoại hợp lệ." };
  await db().insert<ContactMessage>("contact_messages", {
    name,
    phone,
    email: clean(form.get("email"), 120),
    message: clean(form.get("message"), 4000),
    source: clean(form.get("source"), 200) || "lien-he",
    status: "new",
  });
  return { ok: true };
}

export async function placeOrder(_: Result | null, form: FormData): Promise<Result> {
  if (clean(form.get("_hp"))) return { ok: false, error: "Không thể đặt hàng." };
  const required = ["name", "phone", "province", "address"] as const;
  if (required.some((k) => !clean(form.get(k)))) return { ok: false, error: "Vui lòng điền đầy đủ các trường bắt buộc." };

  let requested: { slug: string; variant: string; qty: number }[] = [];
  try {
    requested = JSON.parse(String(form.get("items") || "[]"));
  } catch {}
  if (!requested.length) return { ok: false, error: "Giỏ hàng đang trống." };

  // Prices come from the database, never from the browser.
  const { rows } = await db().list<Product>("products", {
    where: { slug: requested.map((r) => r.slug), status: "published" },
  });
  const items: OrderItem[] = requested.flatMap((r) => {
    const p = rows.find((x) => x.slug === r.slug);
    const qty = Math.min(99, Math.max(1, Math.floor(Number(r.qty) || 1)));
    return p ? [{ slug: p.slug, name: p.name, variant: String(r.variant ?? ""), price: p.price, qty, image: p.images?.[0] ?? "" }] : [];
  });
  if (!items.length) return { ok: false, error: "Sản phẩm trong giỏ không còn tồn tại." };

  const d = new Date();
  const code = `DH${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}${Math.floor(Math.random() * 90000 + 10000)}`;
  await db().insert<Order>("orders", {
    code,
    customer_name: clean(form.get("name"), 120),
    phone: clean(form.get("phone"), 30),
    email: clean(form.get("email"), 120),
    province: clean(form.get("province"), 120),
    ward: clean(form.get("ward"), 120),
    address: clean(form.get("address"), 300),
    note: clean(form.get("note"), 2000),
    items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    status: "new",
    admin_note: "",
  });
  return { ok: true, code };
}
