import type { Metadata } from "next";
import { CheckoutClient } from "@/components/site/checkout";
import { Breadcrumb, PageTitle } from "@/components/site/ui";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false } };

export default async function CheckoutPage() {
  const { general } = await getSettings();
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Thanh toán" }]} />
      <PageTitle>Thanh toán</PageTitle>
      <CheckoutClient siteName={general.site_name} />
    </div>
  );
}
