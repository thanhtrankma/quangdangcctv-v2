import Link from "next/link";
import { ORDER_STATUS } from "@/lib/admin/config";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { ContactMessage, Order } from "@/lib/types";

export default async function Dashboard() {
  const repo = db();
  const [products, posts, categories, newOrders, orders, messages, newMessages] = await Promise.all([
    repo.list("products", { limit: 0 }),
    repo.list("posts", { limit: 0 }),
    repo.list("categories", { limit: 0 }),
    repo.list("orders", { where: { status: "new" }, limit: 0 }),
    repo.list<Order>("orders", { order: [{ column: "created_at", ascending: false }], limit: 6 }),
    repo.list<ContactMessage>("contact_messages", { order: [{ column: "created_at", ascending: false }], limit: 6 }),
    repo.list("contact_messages", { where: { status: "new" }, limit: 0 }),
  ]);
  const stats = [
    { label: "Đơn hàng mới", value: newOrders.count, href: "/admin/orders/?status=new", accent: "text-orange-600" },
    { label: "Liên hệ chưa xử lý", value: newMessages.count, href: "/admin/contact_messages/?status=new", accent: "text-pink-600" },
    { label: "Sản phẩm", value: products.count, href: "/admin/products/", accent: "text-teal-700" },
    { label: "Danh mục", value: categories.count, href: "/admin/categories/", accent: "text-teal-700" },
    { label: "Bài viết", value: posts.count, href: "/admin/posts/", accent: "text-teal-700" },
  ];
  const statusLabel = (s: string) => ORDER_STATUS.find((x) => x.value === s)?.label ?? s;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <div className="flex gap-2">
          <Link href="/admin/products/new/" className="rounded-lg bg-teal-navy px-4 py-2 text-sm font-semibold text-white">
            + Thêm sản phẩm
          </Link>
          <Link href="/admin/posts/new/" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
            + Viết bài
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl bg-white p-4 shadow-sm hover:shadow">
            <div className={`text-3xl font-bold ${s.accent}`}>{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex justify-between">
            <h2 className="font-bold">Đơn hàng gần đây</h2>
            <Link href="/admin/orders/" className="text-sm text-teal-700">
              Xem tất cả →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {orders.rows.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}/`} className="flex justify-between gap-3 py-2 hover:text-teal-700">
                  <span>
                    <strong>{o.code}</strong> · {o.customer_name}
                    <span className="block text-xs text-slate-500">{formatDateTime(o.created_at)}</span>
                  </span>
                  <span className="text-right">
                    {formatPrice(o.total)}
                    <span className="block text-xs text-slate-500">{statusLabel(o.status)}</span>
                  </span>
                </Link>
              </li>
            ))}
            {!orders.rows.length && <li className="py-4 text-slate-500">Chưa có đơn hàng.</li>}
          </ul>
        </section>
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex justify-between">
            <h2 className="font-bold">Liên hệ gần đây</h2>
            <Link href="/admin/contact_messages/" className="text-sm text-teal-700">
              Xem tất cả →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {messages.rows.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/contact_messages/${m.id}/`} className="block py-2 hover:text-teal-700">
                  <strong>{m.name}</strong> · {m.phone}
                  <span className="line-clamp-1 text-xs text-slate-500">{m.message}</span>
                </Link>
              </li>
            ))}
            {!messages.rows.length && <li className="py-4 text-slate-500">Chưa có liên hệ.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
