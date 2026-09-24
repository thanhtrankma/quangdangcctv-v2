import type { Metadata } from "next";
import { ProductListing, type ListingSearchParams } from "@/components/site/product-listing";
import { Breadcrumb, PageTitle } from "@/components/site/ui";
import { categoryHref, getCategories, getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getSettings();
  return { title: "Cửa hàng", description: general.seo_description, alternates: { canonical: "/cua-hang/" } };
}

export default async function ShopPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const [{ general }, cats] = await Promise.all([getSettings(), getCategories()]);
  const tops = cats.filter((c) => !c.parent_id);
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Cửa hàng" }]} />
      <PageTitle sub={general.seo_description}>Tất cả sản phẩm</PageTitle>
      <ProductListing
        basePath="/cua-hang/"
        searchParams={searchParams}
        sideTitle="Danh mục"
        sideLinks={[{ href: "/cua-hang/", label: "Tất cả sản phẩm", active: true }, ...tops.map((c) => ({ href: categoryHref(cats, c), label: c.name }))]}
      />
    </div>
  );
}
