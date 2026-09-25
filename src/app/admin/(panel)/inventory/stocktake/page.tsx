import type { Metadata } from "next";
import { StocktakeClient } from "@/components/admin/stocktake-client";
import { listStockProducts } from "@/lib/admin/inventory";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Kiểm kho" };

export default async function StocktakePage() {
  const [products, cats] = await Promise.all([listStockProducts(), getCategories()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Kiểm kho</h1>
        <p className="mt-1 text-sm text-slate-600">
          Nhập số lượng đếm thực tế. Chênh lệch so với tồn trên hệ thống được ghi vào Thẻ kho (loại “Kiểm kho / điều chỉnh”). Ô để trống sẽ bỏ qua.
          Dùng trang này để khai báo tồn kho ban đầu cho các sản phẩm.
        </p>
      </div>
      <StocktakeClient
        products={products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, category_id: p.category_id, stock: p.stock, track: p.track_stock }))}
        categories={cats.map((c) => ({ id: c.id, name: c.name, parent_id: c.parent_id }))}
      />
    </div>
  );
}
