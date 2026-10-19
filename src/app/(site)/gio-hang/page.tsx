import type { Metadata } from "next";
import { CartPageClient } from "@/components/site/cart-page";
import { Breadcrumb, isQuoteMode, PageTitle } from "@/components/site/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await isQuoteMode()) ? "Yêu cầu báo giá" : "Giỏ hàng", robots: { index: false } };
}

export default async function CartPage() {
  const quote = await isQuoteMode();
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: quote ? "Yêu cầu báo giá" : "Giỏ hàng" }]} />
      <PageTitle sub={quote ? "Chọn sản phẩm và số lượng bạn quan tâm, chúng tôi sẽ gửi báo giá kèm phương án lắp đặt." : undefined}>
        {quote ? "Danh sách yêu cầu báo giá" : "Giỏ hàng của bạn"}
      </PageTitle>
      <CartPageClient />
    </div>
  );
}
