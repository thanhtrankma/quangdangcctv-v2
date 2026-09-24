import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { formatDate, formatPrice, PLACEHOLDER_IMG } from "@/lib/format";
import type { Faq, Post, Product } from "@/lib/types";
import { AddToCartIconButton } from "./cart";
import { FaqItem } from "./faq-item";

export function cartItemOf(p: Product) {
  return { slug: p.slug, name: p.name, variant: p.variant_label ?? "", price: p.price, image: p.images?.[0] ?? "" };
}

export const discountOf = (p: Pick<Product, "price" | "compare_at_price">) =>
  p.compare_at_price && p.compare_at_price > p.price && p.price > 0 ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;

export { btn, inputCls } from "./ui-tokens";
import { btn } from "./ui-tokens";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-primary">
            <Home size={14} aria-hidden="true" />
            Trang chủ
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            <ChevronRight size={14} className="shrink-0 text-subtle" aria-hidden="true" />
            {it.href ? (
              <Link href={it.href} className="hover:text-primary">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 text-body">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PriceTag({ p, size = "md" }: { p: Pick<Product, "price" | "compare_at_price">; size?: "md" | "lg" }) {
  if (p.price <= 0) {
    return <span className={`font-semibold text-primary ${size === "lg" ? "text-2xl" : "text-[15px]"}`}>Liên hệ báo giá</span>;
  }
  const compare = p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : 0;
  if (size === "lg") {
    return (
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-3xl font-bold whitespace-nowrap text-price tabular-nums">{formatPrice(p.price)}</span>
        {compare > 0 && <del className="text-base whitespace-nowrap text-subtle tabular-nums">{formatPrice(compare)}</del>}
      </span>
    );
  }
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-base font-bold whitespace-nowrap text-price tabular-nums sm:text-[17px]">{formatPrice(p.price)}</span>
      {compare > 0 && <del className="text-[13px] whitespace-nowrap text-subtle tabular-nums">{formatPrice(compare)}</del>}
    </span>
  );
}

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const off = discountOf(p);
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-white shadow-card transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-lift">
      <Link
        href={`/san-pham/${p.slug}/`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-square overflow-hidden rounded-t-xl bg-white p-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.images?.[0] || PLACEHOLDER_IMG}
          alt=""
          loading={priority ? "eager" : "lazy"}
          width={400}
          height={400}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {off > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-price px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 border-t border-border/70 p-3">
        <h3 className="line-clamp-2 min-h-[2.75rem] font-sans text-[15px] leading-snug font-medium text-body">
          <Link href={`/san-pham/${p.slug}/`} className="after:absolute after:inset-0 hover:text-primary">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2">
          <PriceTag p={p} />
          <AddToCartIconButton item={cartItemOf(p)} className="relative z-10" />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, cols = 4 }: { products: Product[]; cols?: 4 | 5 }) {
  if (!products.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-6 py-14 text-center">
        <p className="font-medium text-ink">Không tìm thấy sản phẩm phù hợp.</p>
        <Link href="/cua-hang/" className={`${btn.ghost} mt-2 justify-center`}>
          Xem tất cả sản phẩm
        </Link>
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 ${cols === 5 ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-4"}`}>
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const cls = "grid h-11 min-w-11 place-items-center rounded-lg border px-3 text-sm font-medium tabular-nums transition-colors duration-200";
  return (
    <nav aria-label="Phân trang" className="mt-10 flex flex-wrap justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${cls} border-border bg-white hover:border-primary`} aria-label="Trang trước">
          ‹
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - nums[i - 1] > 1 && <span className="grid h-11 place-items-center px-1 text-subtle">…</span>}
          {n === page ? (
            <span aria-current="page" className={`${cls} border-primary bg-primary text-white`}>
              {n}
            </span>
          ) : (
            <Link href={href(n)} className={`${cls} border-border bg-white hover:border-primary`}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className={`${cls} border-border bg-white hover:border-primary`} aria-label="Trang sau">
          ›
        </Link>
      )}
    </nav>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  id,
}: {
  eyebrow?: string;
  title: string;
  action?: { href: string; label: string };
  id?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>}
        <h2 id={id} className="text-2xl font-bold md:text-[28px]">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className={`${btn.ghost} shrink-0 text-sm`}>
          {action.label}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function FaqSection({ title = "Câu hỏi thường gặp", faqs }: { title?: string; faqs: Faq[] }) {
  if (!faqs?.length) return null;
  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="mb-4 text-2xl font-bold">
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <FaqItem key={i} faq={f} />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </section>
  );
}

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card transition-shadow duration-200 hover:shadow-lift">
      <div className={`overflow-hidden bg-tint ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover || PLACEHOLDER_IMG}
          alt=""
          loading="lazy"
          className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.03] ${post.cover ? "object-cover" : "object-contain p-8"}`}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <time dateTime={post.published_at} className="text-xs font-medium text-subtle">
          {formatDate(post.published_at)}
        </time>
        <h3 className={`mt-1 line-clamp-2 font-semibold leading-snug ${featured ? "text-xl" : "text-base"}`}>
          <Link href={`/${post.slug}/`} className="after:absolute after:inset-0 hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>}
      </div>
    </article>
  );
}

export function RichContent({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`rich-content ${className}`} dangerouslySetInnerHTML={{ __html: html || "" }} />;
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-[28px] leading-tight font-bold md:text-4xl">{children}</h1>
      {sub && <div className="mt-2 max-w-3xl text-muted">{sub}</div>}
    </header>
  );
}
