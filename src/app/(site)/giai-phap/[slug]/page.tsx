import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { Img } from "@/components/site/img";
import { ProcessSteps, SolutionCard, SolutionIcon } from "@/components/site/solutions";
import { Breadcrumb, btn, FaqSection, ProductGrid, RichContent } from "@/components/site/ui";
import { categoryHref, getCategories, getProducts, getSettings, getSolutionBySlug, getSolutions } from "@/lib/data";
import { PLACEHOLDER_IMG, stripHtml } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getSolutionBySlug((await params).slug);
  if (!s) return {};
  const description = s.seo_description || s.summary || stripHtml(s.content).slice(0, 160);
  return {
    title: s.seo_title || `Giải pháp ${s.title}`,
    description,
    alternates: { canonical: `/giai-phap/${s.slug}/` },
    openGraph: { title: s.title, description, images: s.cover ? [s.cover] : undefined },
  };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const s = await getSolutionBySlug(slug);
  if (!s) notFound();
  const [{ solutions_page: sp, general }, all, cats] = await Promise.all([getSettings(), getSolutions(), getCategories()]);

  const relatedCats = (s.related_categories ?? []).map((r) => cats.find((c) => c.id === r.category_id)).filter((c) => c !== undefined);
  const productLists = await Promise.all(relatedCats.map((c) => getProducts({ categoryId: c.id, limit: 8, withCount: false })));
  const seen = new Set<string>();
  const products = productLists
    .flatMap((r) => r.rows)
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .slice(0, 8);
  const others = all.filter((x) => x.id !== s.id);

  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Giải pháp", href: "/giai-phap/" }, { label: s.title }]} />

      <header className="grid overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center p-5 md:p-10">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-wider text-primary uppercase">
            <SolutionIcon name={s.icon} className="h-5 w-5" /> Giải pháp
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-bold md:text-[42px]">{s.title}</h1>
          {s.summary && <p className="mt-3 text-lg text-muted">{s.summary}</p>}
          {(s.highlights ?? []).length > 0 && (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {s.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 font-medium text-ink">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-trust" aria-hidden="true" />
                  {h.text}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#tu-van" className={btn.cta}>
              Nhận khảo sát & báo giá
            </a>
            <a href={`tel:${general.hotline}`} className={btn.outline}>
              <Phone size={18} aria-hidden="true" /> {general.hotline_display}
            </a>
          </div>
        </div>
        <div className="relative min-h-60 bg-tint">
          <Img src={s.cover || PLACEHOLDER_IMG} alt={s.title} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
        </div>
      </header>

      <section className="mt-10" aria-labelledby="process">
        <h2 id="process" className="mb-4 text-2xl font-bold">
          Quy trình triển khai
        </h2>
        <ProcessSteps steps={sp.steps} />
      </section>

      {s.content && (
        <section className="mt-10 rounded-2xl border border-border bg-white p-5 md:p-10">
          <RichContent html={s.content} className="mx-auto max-w-3xl" />
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-12" aria-labelledby="devices">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 id="devices" className="text-2xl font-bold">
              Thiết bị sử dụng trong giải pháp
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedCats.map((c) => (
                <Link key={c.id} href={categoryHref(cats, c)} className={`${btn.ghost} text-sm`}>
                  {c.name} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <ProductGrid products={products} />
        </section>
      )}

      <FaqSection faqs={s.faqs ?? []} />

      <section id="tu-van" className="mt-12 scroll-mt-40 grid gap-6 rounded-2xl bg-navy p-5 text-white md:p-8 lg:grid-cols-[1fr_420px]" aria-labelledby="quote-title">
        <div>
          <h2 id="quote-title" className="text-2xl font-bold text-white md:text-3xl">
            Nhận tư vấn giải pháp {s.title.toLowerCase()}
          </h2>
          <p className="mt-2 text-sky-100/85">{sp.cta_text}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`tel:${general.hotline}`} className={btn.cta}>
              <Phone size={18} aria-hidden="true" /> Gọi {general.hotline_display}
            </a>
            {general.zalo_url && (
              <a href={general.zalo_url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-white/70 px-5 font-semibold text-white hover:bg-white/10">
                <MessageCircle size={18} aria-hidden="true" /> Chat Zalo
              </a>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 text-body">
          <ContactForm source={`giai-phap-${s.slug}`} siteName={general.site_name} compact />
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-12" aria-labelledby="others">
          <h2 id="others" className="mb-4 text-2xl font-bold">
            Giải pháp khác
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 3).map((o) => (
              <li key={o.id}>
                <SolutionCard s={o} index={all.indexOf(o) + 1} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
