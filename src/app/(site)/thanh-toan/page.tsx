import type { Metadata } from "next";
import { CheckoutClient } from "@/components/site/checkout";
import { Breadcrumb, PageTitle } from "@/components/site/ui";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getSettings();
  return { title: general.price_mode === "contact" ? "Gửi yêu cầu báo giá" : "Thanh toán", robots: { index: false } };
}

export default async function CheckoutPage() {
  const { general } = await getSettings();
  const quote = general.price_mode === "contact";
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: quote ? "Gửi yêu cầu báo giá" : "Thanh toán" }]} />
      <PageTitle>{quote ? "Gửi yêu cầu báo giá" : "Thanh toán"}</PageTitle>
      <CheckoutClient siteName={general.site_name} />
    </div>
  );
}
