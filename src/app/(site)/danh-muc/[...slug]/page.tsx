import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/site/category-icon";
import { ProductListing, type ListingSearchParams } from "@/components/site/product-listing";
import { Breadcrumb, RichContent } from "@/components/site/ui";
import { categoryChain, categoryHref, getCategories } from "@/lib/data";
import { stripHtml } from "@/lib/format";

type Props = { params: Promise<{ slug: string[] }>; searchParams: ListingSearchParams };

async function resolve(slugs: string[]) {
  const all = await getCategories();
  const cat = all.find((c) => c.slug === slugs[slugs.length - 1]);
  if (!cat) return null;
  return { cat, all, chain: categoryChain(all, cat) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolve((await params).slug);
  if (!r) return {};
  return {
    title: r.cat.seo_title || r.cat.name,
    description: r.cat.seo_description || stripHtml(r.cat.description).slice(0, 160) || undefined,
    alternates: { canonical: categoryHref(r.all, r.cat) },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const r = await resolve((await params).slug);
  if (!r) notFound();
  const { cat, all, chain } = r;
  const root = chain[0];

  // Sidebar: the whole branch under the top-level category, indented by depth.
  const sideLinks: { href: string; label: string; active?: boolean; depth?: number }[] = [];
  const walk = (parentId: string, depth: number) =>
    all
      .filter((c) => c.parent_id === parentId)
      .forEach((c) => {
        sideLinks.push({ href: categoryHref(all, c), label: c.name, active: c.id === cat.id, depth });
        if (chain.some((x) => x.id === c.id)) walk(c.id, depth + 1);
      });
  sideLinks.push({ href: categoryHref(all, root), label: `Tất cả ${root.name}`, active: root.id === cat.id });
  walk(root.id, 1);

  return (
    <div className="container-x">
      <Breadcrumb items={chain.map((c, i) => (i < chain.length - 1 ? { label: c.name, href: categoryHref(all, c) } : { label: c.name }))} />
      <header className="mb-6 flex items-start gap-4 rounded-2xl border border-border bg-white p-5">
        <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-xl bg-tint text-primary sm:grid">
          <CategoryIcon name={root.name} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-bold md:text-[32px]">{cat.name}</h1>
          {cat.description ? (
            <RichContent html={cat.description} className="mt-2 line-clamp-3 !text-[15px] text-muted" />
          ) : (
            <p className="mt-1 text-muted">Sản phẩm {cat.name.toLowerCase()} chính hãng, bảo hành đầy đủ, hỗ trợ lắp đặt.</p>
          )}
        </div>
      </header>
      {cat.banner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cat.banner} alt="" className="mb-6 max-h-[320px] w-full rounded-2xl object-cover" />
      )}
      <ProductListing basePath={categoryHref(all, cat)} searchParams={searchParams} categoryId={cat.id} sideTitle={root.name} sideLinks={sideLinks} />
    </div>
  );
}
