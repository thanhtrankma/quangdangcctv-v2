import type { Metadata } from "next";
import Link from "next/link";
import { CategoryManager } from "@/components/admin/category-manager";
import { listAll } from "@/lib/admin/inventory";
import { db } from "@/lib/db";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Danh mục sản phẩm" };

export default async function CategoriesPage() {
  const [{ rows: cats }, products] = await Promise.all([
    db().list<Category>("categories", {
      columns: ["id", "name", "slug", "parent_id", "sort_order", "show_on_home"],
      order: [{ column: "sort_order" }, { column: "name" }],
    }),
    listAll<Pick<Product, "category_id">>("products", { columns: ["category_id"] }),
  ]);
  const direct: Record<string, number> = {};
  for (const p of products) if (p.category_id) direct[p.category_id] = (direct[p.category_id] ?? 0) + 1;
  // Count includes sub-categories, like the storefront does.
  const total = (id: string): number => (direct[id] ?? 0) + cats.filter((c) => c.parent_id === id).reduce((s, c) => s + total(c.id), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Danh mục sản phẩm</h1>
          <p className="mt-1 text-sm text-slate-600">
            Bấm ▲ ▼ để đổi thứ tự, bật công tắc để hiện danh mục lớn trên trang chủ. Thay đổi được lưu ngay và áp dụng cho menu, trang chủ, bộ lọc.
          </p>
        </div>
        <Link href="/admin/categories/new/" className="rounded-lg bg-teal-navy px-4 py-2 text-sm font-semibold text-white">
          + Thêm danh mục
        </Link>
      </div>
      <CategoryManager
        categories={cats.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parent_id: c.parent_id,
          sort_order: c.sort_order ?? 0,
          show_on_home: Boolean(c.show_on_home),
          count: total(c.id),
        }))}
      />
    </div>
  );
}
