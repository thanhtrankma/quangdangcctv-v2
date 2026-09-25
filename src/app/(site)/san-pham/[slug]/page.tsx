import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2, CircleAlert, CreditCard, Headset, MessageCircle, Phone, RefreshCcw, ShieldCheck, Truck, Wrench, type LucideIcon,
} from "lucide-react";
import { BuyBox, ExpandableDescription, Gallery } from "@/components/site/product-detail-client";
import { Breadcrumb, cartItemOf, discountOf, PriceTag, ProductGrid, RichContent } from "@/components/site/ui";
import { categoryChain, categoryHref, getBrands, getCategories, getProductBySlug, getProducts, getSettings } from "@/lib/data";
import { formatPrice, stripHtml } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };
const POLICY_ICONS: LucideIcon[] = [Truck, RefreshCcw, CreditCard, Headset, Wrench];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const description = p.seo_description || stripHtml(p.short_description || p.description).slice(0, 160);
  return {
    title: p.seo_title || p.name,
    description,
    alternates: { canonical: `/san-pham/${p.slug}/` },
    openGraph: { title: p.name, description, images: p.images?.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const [cats, brands, { general, product_page }] = await Promise.all([getCategories(), getBrands(), getSettings()]);
  const cat = cats.find((c) => c.id === p.category_id);
  const brand = brands.find((b) => b.id === p.brand_id);
  const related = p.category_id ? (await getProducts({ categoryId: p.category_id, limit: 10, excludeId: p.id })).rows : [];
  const off = discountOf(p);
  const saved = p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price - p.price : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku || undefined,
    image: p.images,
    description: stripHtml(p.short_description || "").slice(0, 300),
    brand: brand ? { "@type": "Brand", name: brand.name } : undefined,
    offers:
      p.price > 0
        ? {
            "@type": "Offer",
            priceCurrency: "VND",
            price: p.price,
            availability: p.track_stock && (p.stock ?? 0) <= 0 ? "https://schema.org/BackOrder" : "https://schema.org/InStock",
          }
        : undefined,
  };

  return (
    <div className="container-x">
      <Breadcrumb items={[...(cat ? categoryChain(cats, cat).map((c) => ({ label: c.name, href: categoryHref(cats, c) })) : []), { label: p.name }]} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px] [&>*]:min-w-0">
        <Gallery images={p.images ?? []} alt={p.name} />

        <div>
          {brand && (
            <Link href={`/thuong-hieu/${brand.slug}/`} className="text-sm font-semibold tracking-wide text-primary uppercase hover:underline">
              {brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl leading-snug font-bold md:text-[28px]">{p.name}</h1>
          {p.sku && <p className="mt-1 text-sm text-muted">Mã sản phẩm: {p.sku}</p>}

          <div className="mt-4 rounded-xl bg-tint p-4">
            <PriceTag p={p} size="lg" />
            {off > 0 && (
              <p className="mt-1 text-sm font-medium text-trust">
                Tiết kiệm {formatPrice(saved)} ({off}%)
              </p>
            )}
            {p.track_stock && (
              <p className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${(p.stock ?? 0) > 0 ? "text-trust" : "text-cta"}`}>
                {(p.stock ?? 0) > 0 ? <CheckCircle2 size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
                {(p.stock ?? 0) > 0 ? "Còn hàng" : "Tạm hết hàng – liên hệ để đặt trước"}
              </p>
            )}
            {p.variant_label && (
              <p className="mt-2 text-sm">
                Phân loại: <strong>{p.variant_label}</strong>
              </p>
            )}
          </div>

          {p.short_description && (
            <div className="mt-4">
              <h2 className="mb-2 font-sans text-base font-semibold text-ink">Điểm nổi bật</h2>
              <RichContent html={p.short_description} className="!text-[15px]" />
            </div>
          )}

          <div className="mt-5">
            <BuyBox item={cartItemOf(p)} canBuy={p.price > 0} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a href={`tel:${general.hotline}`} className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-primary px-3 text-center text-white transition-colors duration-200 hover:bg-primary-hover">
              <span className="flex items-center gap-1.5 font-semibold">
                <Phone size={16} aria-hidden="true" /> {p.price > 0 ? product_page.buy_now_text : "Gọi báo giá"}
              </span>
              <span className="text-xs text-sky-100">{general.hotline_display}</span>
            </a>
            {general.zalo_url && (
              <a href={general.zalo_url} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg border-2 border-[#0068ff] px-3 font-semibold text-[#0050c8] transition-colors duration-200 hover:bg-blue-50">
                <MessageCircle size={16} aria-hidden="true" /> Chat Zalo tư vấn
              </a>
            )}
          </div>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {cat && (
              <>
                <dt className="text-muted">Danh mục</dt>
                <dd>
                  <Link href={categoryHref(cats, cat)} className="text-primary hover:underline">
                    {cat.name}
                  </Link>
                </dd>
              </>
            )}
            {brand && (
              <>
                <dt className="text-muted">Thương hiệu</dt>
                <dd>
                  <Link href={`/thuong-hieu/${brand.slug}/`} className="text-primary hover:underline">
                    {brand.name}
                  </Link>
                </dd>
              </>
            )}
          </dl>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-5 lg:col-span-2 xl:col-span-1" aria-label="Chính sách mua hàng">
          <p className="flex items-center gap-2 font-heading font-semibold text-ink">
            <ShieldCheck size={20} className="text-trust" aria-hidden="true" /> Yên tâm mua sắm
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {product_page.policies.map((it, i) => {
              const Icon = POLICY_ICONS[i % POLICY_ICONS.length];
              return (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="[&_strong]:font-semibold [&_strong]:text-ink" dangerouslySetInnerHTML={{ __html: it.text }} />
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {p.description && (
        <section className="mt-10 rounded-2xl border border-border bg-white p-5 md:p-8" aria-labelledby="desc-title">
          <h2 id="desc-title" className="mb-4 text-2xl font-bold">
            Mô tả sản phẩm
          </h2>
          <div className="mx-auto max-w-3xl">
            <ExpandableDescription html={p.description} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-5 text-2xl font-bold">
            Sản phẩm tương tự
          </h2>
          <ProductGrid products={related} cols={5} />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
