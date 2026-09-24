import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, Headset, Phone, RefreshCcw, ShieldCheck, Truck, Wrench, type LucideIcon } from "lucide-react";
import { CategoryIcon } from "@/components/site/category-icon";
import { ContactForm } from "@/components/site/contact-form";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { btn, FaqSection, PostCard, ProductCard, SectionHeading } from "@/components/site/ui";
import { categoryHref, getBanners, getBrands, getCategories, getPosts, getProducts, getSettings } from "@/lib/data";

const POLICY_ICONS: LucideIcon[] = [Truck, RefreshCcw, CreditCard, Headset, Wrench];

/** "<strong>Title</strong><br>Detail" → { title, detail } */
function splitPolicy(html: string) {
  const [first, ...rest] = html.split(/<br\s*\/?>/i).map((s) => s.replace(/<[^>]+>/g, "").trim());
  return { title: first, detail: rest.join(" ") };
}

export default async function HomePage() {
  const [{ general, home, product_page }, cats, brands, banners, posts, all, deals] = await Promise.all([
    getSettings(),
    getCategories(),
    getBrands(),
    getBanners("home_hero"),
    getPosts({ limit: 4 }),
    getProducts({ limit: 0 }),
    getProducts({ featured: true, limit: 10 }),
  ]);
  const tops = cats.filter((c) => !c.parent_id && c.show_on_home);
  const shelves = await Promise.all(
    tops.map(async (c) => {
      const res = await getProducts({ categoryId: c.id, limit: 10 });
      return { cat: c, products: res.rows, count: res.count, subs: cats.filter((s) => s.parent_id === c.id) };
    }),
  );
  const featuredBrands = brands.filter((b) => b.featured);
  const stats = [
    { value: `${all.count}+`, label: "Sản phẩm chính hãng" },
    { value: String(brands.length), label: "Thương hiệu phân phối" },
    { value: String(cats.length), label: "Danh mục sản phẩm" },
    { value: "24/7", label: "Hỗ trợ kỹ thuật" },
  ];

  return (
    <div className="container-x pt-5">
      <h1 className="sr-only">{home.heading}</h1>

      {/* Hero + quote request */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <HeroCarousel banners={banners} />
        <aside aria-labelledby="quote-title" className="rounded-2xl border border-border bg-white p-5 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-trust uppercase">
            <ShieldCheck size={16} aria-hidden="true" /> Khảo sát miễn phí
          </p>
          <h2 id="quote-title" className="mt-1 text-xl font-bold">
            Nhận tư vấn & báo giá lắp đặt
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted">Để lại số điện thoại, kỹ thuật viên gọi lại trong giờ làm việc.</p>
          <ContactForm source="trang-chu-bao-gia" siteName={general.site_name} compact />
          <a href={`tel:${general.hotline}`} className="mt-3 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Phone size={16} aria-hidden="true" /> Hoặc gọi ngay {general.hotline_display}
          </a>
        </aside>
      </div>

      {/* Intro */}
      <section className="mt-10 grid items-end gap-4 md:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="text-2xl leading-snug font-bold text-ink md:text-[32px]">{home.heading}</p>
          <p className="mt-2 text-muted">{home.intro}</p>
        </div>
        <Link href="/cua-hang/" className={btn.primary}>
          Xem tất cả sản phẩm <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>

      {/* Trust strip */}
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Cam kết dịch vụ">
        {product_page.policies.slice(0, 4).map((p, i) => {
          const Icon = POLICY_ICONS[i % POLICY_ICONS.length];
          const { title, detail } = splitPolicy(p.text);
          return (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{title}</span>
                {detail && <span className="block text-sm text-muted">{detail}</span>}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Categories */}
      <section className="mt-14" aria-labelledby="cats-title">
        <SectionHeading id="cats-title" eyebrow={home.menu_eyebrow} title={home.menu_title} action={{ href: "/cua-hang/", label: "Tất cả" }} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shelves.map(({ cat, count, subs }) => (
            <li key={cat.id}>
              <Link
                href={categoryHref(cats, cat)}
                className="group flex h-full flex-col rounded-xl border border-border bg-white p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-lift"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-tint text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                  <CategoryIcon name={cat.name} className="h-6 w-6" />
                </span>
                <span className="mt-3 font-heading font-semibold text-ink">{cat.name}</span>
                <span className="text-sm text-muted">{count} sản phẩm</span>
                {subs.length > 0 && <span className="mt-2 line-clamp-1 text-xs text-subtle">{subs.map((s) => s.name).join(" · ")}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Deals */}
      {deals.rows.length > 0 && (
        <section className="mt-14 rounded-2xl bg-gradient-to-br from-primary to-ink p-5 md:p-7" aria-labelledby="deals-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wider text-sky-200 uppercase">Ưu đãi</p>
              <h2 id="deals-title" className="text-2xl font-bold text-white md:text-[28px]">
                Giá tốt hôm nay
              </h2>
            </div>
            <Link href="/cua-hang/?sort=price-asc" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-white hover:underline">
              Xem thêm <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {deals.rows.map((p, i) => (
              <div key={p.id} className={i >= 6 ? "hidden lg:block" : ""}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category shelves */}
      {shelves
        .filter((s) => s.products.length)
        .map(({ cat, products, subs }) => (
          <section key={cat.id} className="mt-14" aria-labelledby={`shelf-${cat.id}`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <h2 id={`shelf-${cat.id}`} className="flex items-center gap-2.5 text-2xl font-bold">
                <CategoryIcon name={cat.name} className="h-7 w-7 text-primary" />
                {cat.name}
              </h2>
              <Link href={categoryHref(cats, cat)} className={`${btn.ghost} text-sm`}>
                Xem tất cả <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {subs.length > 0 && (
              <ul className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" aria-label={`Danh mục con của ${cat.name}`}>
                {subs.map((s) => (
                  <li key={s.id} className="shrink-0">
                    <Link
                      href={categoryHref(cats, s)}
                      className="inline-flex min-h-9 items-center rounded-full border border-border bg-white px-3.5 text-sm text-body transition-colors duration-200 hover:border-primary hover:text-primary"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
              {products.map((p, i) => (
                <div key={p.id} className={i >= 6 ? "hidden lg:block" : ""}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </section>
        ))}

      {/* Proof: stats + brands */}
      <section className="mt-16 grid gap-6 rounded-2xl border border-border bg-white p-6 md:p-8 lg:grid-cols-[1fr_1.4fr]" aria-labelledby="proof-title">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-trust uppercase">
            <BadgeCheck size={16} aria-hidden="true" /> Hàng chính hãng
          </p>
          <h2 id="proof-title" className="mt-1 text-2xl font-bold md:text-[28px]">
            {home.brands_title}
          </h2>
          <p className="mt-2 text-muted">{home.brands_subtitle}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-tint p-4">
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="font-heading text-2xl font-bold text-primary tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {featuredBrands.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/thuong-hieu/${b.slug}/`}
                  className="flex min-h-16 flex-col justify-center rounded-xl border border-border px-4 py-3 transition-colors duration-200 hover:border-primary hover:bg-tint"
                >
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt={b.name} className="h-8 w-auto object-contain" />
                  ) : (
                    <span className="font-heading font-bold text-ink">{b.name}</span>
                  )}
                  <span className="text-xs text-muted">{b.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/thuong-hieu/" className={`${btn.ghost} mt-3 text-sm`}>
            Tất cả {brands.length} thương hiệu <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* News */}
      {posts.rows.length > 0 && (
        <section className="mt-16" aria-labelledby="news-title">
          <SectionHeading id="news-title" eyebrow="Tin tức" title={home.news_title} action={{ href: "/tin-tuc/", label: "Xem tất cả" }} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {posts.rows.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <FaqSection title={home.faq_title} faqs={home.faqs} />

      {/* Closing CTA */}
      <section className="mt-16 flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy p-6 text-white md:flex-row md:items-center md:p-10">
        <div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">Cần lắp camera, wifi hay bộ lưu điện?</h2>
          <p className="mt-2 text-sky-100/85">Khảo sát tận nơi, tư vấn giải pháp phù hợp ngân sách — {general.site_name} luôn sẵn sàng.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${general.hotline}`} className={btn.cta}>
            <Phone size={18} aria-hidden="true" /> Gọi {general.hotline_display}
          </a>
          <Link href="/lien-he/" className="inline-flex min-h-11 items-center rounded-lg border-2 border-white/70 px-5 font-semibold text-white hover:bg-white/10">
            Gửi yêu cầu
          </Link>
        </div>
      </section>
    </div>
  );
}
