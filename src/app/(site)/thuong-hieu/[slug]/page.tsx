import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, type ListingSearchParams } from "@/components/site/product-listing";
import { Breadcrumb, PageTitle, RichContent } from "@/components/site/ui";
import { getBrands } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: ListingSearchParams };

const findBrand = async (slug: string) => (await getBrands()).find((b) => b.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = await findBrand((await params).slug);
  if (!brand) return {};
  return { title: `Thương hiệu ${brand.name}`, alternates: { canonical: `/thuong-hieu/${brand.slug}/` } };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const [brand, brands] = await Promise.all([findBrand((await params).slug), getBrands()]);
  if (!brand) notFound();
  const others = brands.filter((b) => b.featured || b.id === brand.id).slice(0, 12);
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Thương hiệu", href: "/thuong-hieu/" }, { label: brand.name }]} />
      <PageTitle sub={brand.description ? <RichContent html={brand.description} className="!text-[15px] text-muted" /> : `Sản phẩm ${brand.name} chính hãng.`}>
        {brand.name}
      </PageTitle>
      <ProductListing
        basePath={`/thuong-hieu/${brand.slug}/`}
        searchParams={searchParams}
        brandId={brand.id}
        sideTitle="Thương hiệu khác"
        sideLinks={others.map((b) => ({ href: `/thuong-hieu/${b.slug}/`, label: b.name, active: b.id === brand.id }))}
      />
    </div>
  );
}
