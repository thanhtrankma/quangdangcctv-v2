import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb, PageTitle } from "@/components/site/ui";
import { getBrands, getProductCountsByBrand, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Thương hiệu", alternates: { canonical: "/thuong-hieu/" } };

export default async function BrandsPage() {
  const [brands, counts, { general }] = await Promise.all([getBrands(), getProductCountsByBrand(), getSettings()]);
  const sorted = [...brands].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.name.localeCompare(b.name, "vi"));
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Thương hiệu" }]} />
      <PageTitle sub={`${brands.length} thương hiệu chính hãng đang được ${general.site_name} phân phối.`}>Thương hiệu</PageTitle>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {sorted.map((b) => (
          <li key={b.id}>
            <Link
              href={`/thuong-hieu/${b.slug}/`}
              className="flex h-full min-h-20 flex-col justify-center rounded-xl border border-border bg-white p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-lift"
            >
              {b.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt={b.name} className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-heading text-lg font-bold text-ink">{b.name}</span>
              )}
              <span className="text-sm text-muted tabular-nums">{counts[b.id] ?? 0} sản phẩm</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
