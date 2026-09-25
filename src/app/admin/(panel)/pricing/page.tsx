import type { Metadata } from "next";
import { BulkPriceClient } from "@/components/admin/bulk-price-client";
import { getBrands, getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Cập nhật giá hàng loạt" };

export default async function PricingPage() {
  const [cats, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cập nhật giá hàng loạt</h1>
        <p className="mt-1 text-sm text-slate-600">
          Chọn nhóm sản phẩm, cách tính giá mới, bấm <strong>Xem trước</strong> để kiểm tra rồi mới <strong>Áp dụng</strong>. Mọi thay đổi được ghi vào Lịch sử giá.
        </p>
      </div>
      <BulkPriceClient
        categories={cats.map((c) => ({ id: c.id, name: c.name, parent_id: c.parent_id }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
