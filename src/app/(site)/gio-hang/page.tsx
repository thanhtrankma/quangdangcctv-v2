import type { Metadata } from "next";
import { CartPageClient } from "@/components/site/cart-page";
import { Breadcrumb, PageTitle } from "@/components/site/ui";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
      <PageTitle>Giỏ hàng của bạn</PageTitle>
      <CartPageClient />
    </div>
  );
}
