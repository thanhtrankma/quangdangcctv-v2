import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CalendarDays, Eye, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { BlogSidebar } from "@/components/site/sidebar";
import { Breadcrumb, FaqSection, PostCard, RichContent } from "@/components/site/ui";
import {
  categoryHref, getCategories, getPageBySlug, getPostBySlug, getPostCategory, getPostCategoryById, getPosts, getProductBySlug, getSettings,
} from "@/lib/data";
import { formatDate, stripHtml } from "@/lib/format";

/** Root-level slugs are either a content page (giới thiệu, chính sách…) or a blog post, as on the old site. */
type Props = { params: Promise<{ slug: string }> };

// Old site URLs (/<slug>.html) that were renamed during the import.
const LEGACY_SLUGS: Record<string, string> = {
  "tuyen-dung-minh-hiep-protech": "tuyen-dung",
  gioithieu: "gioi-thieu",
  "bo-luu-dien-ups-mhpro-bo-luu-dien-minh-hiep-protech": "bo-luu-dien-ups-mhpro",
};

/** Permanently redirect old-site URLs like /camera-ip.html to their new home, keeping SEO. */
async function redirectLegacy(raw: string) {
  const slug = decodeURIComponent(raw).replace(/\.html$/, "");
  const target = LEGACY_SLUGS[slug] ?? slug;
  if (await getProductBySlug(target)) permanentRedirect(`/san-pham/${target}/`);
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === target);
  if (cat) permanentRedirect(categoryHref(cats, cat));
  if (await getPostCategory(target)) permanentRedirect(`/danh-muc-tin-tuc/${target}/`);
  if (["tin-tuc", "gio-hang", "lien-he"].includes(target) && target !== raw) permanentRedirect(`/${target}/`);
  if (target !== raw && ((await getPageBySlug(target)) || (await getPostBySlug(target)))) permanentRedirect(`/${target}/`);
}

async function resolve(slug: string) {
  const page = await getPageBySlug(slug);
  if (page) return { page } as const;
  const post = await getPostBySlug(slug);
  if (post) return { post } as const;
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return {};
  const item = r.page ?? r.post;
  const title = item.seo_title || item.title;
  const description = item.seo_description || ("excerpt" in item && item.excerpt) || stripHtml(item.content).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/${slug}/` },
    openGraph: r.post ? { type: "article", title, description, images: r.post.cover ? [r.post.cover] : undefined } : undefined,
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) {
    await redirectLegacy(slug);
    notFound();
  }
  const { general } = await getSettings();

  if (r.page) {
    const { page } = r;
    const isContact = page.template === "contact";
    return (
      <div className="container-x">
        <Breadcrumb items={[{ label: page.title }]} />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="min-w-0 rounded-2xl border border-border bg-white p-5 md:p-10">
            <h1 className="mb-6 text-[28px] leading-tight font-bold md:text-4xl">{page.title}</h1>
            {isContact ? (
              <div className="grid gap-8 xl:grid-cols-2">
                <div>
                  <ul className="mb-6 space-y-3">
                    <li className="flex gap-3">
                      <MapPin className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" />
                      {general.address}
                    </li>
                    <li className="flex gap-3">
                      <Phone className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" />
                      <a href={`tel:${general.hotline}`} className="font-semibold text-primary hover:underline">
                        {general.hotline_display}
                      </a>
                    </li>
                    {general.email && (
                      <li className="flex gap-3">
                        <Mail className="mt-0.5 shrink-0 text-primary" size={20} aria-hidden="true" />
                        <a href={`mailto:${general.email}`} className="break-all hover:underline">
                          {general.email}
                        </a>
                      </li>
                    )}
                  </ul>
                  <RichContent html={page.content} />
                </div>
                <div className="rounded-xl bg-tint p-5">
                  <h2 className="mb-4 text-xl font-bold">Gửi yêu cầu tư vấn</h2>
                  <ContactForm siteName={general.site_name} />
                </div>
              </div>
            ) : (
              <RichContent html={page.content} className="max-w-3xl" />
            )}
            <FaqSection faqs={page.faqs ?? []} />
          </article>
          <BlogSidebar />
        </div>
      </div>
    );
  }

  const { post } = r;
  const [cat, more] = await Promise.all([
    post.category_id ? getPostCategoryById(post.category_id) : null,
    getPosts({ limit: 4, categoryId: post.category_id ?? undefined }),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.cover ? [post.cover] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
  };
  const related = more.rows.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Tin tức", href: "/tin-tuc/" }, ...(cat ? [{ label: cat.name, href: `/danh-muc-tin-tuc/${cat.slug}/` }] : []), { label: post.title }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0 rounded-2xl border border-border bg-white p-5 md:p-10">
          <header className="mx-auto max-w-3xl">
            {cat && (
              <Link href={`/danh-muc-tin-tuc/${cat.slug}/`} className="text-sm font-semibold tracking-wide text-primary uppercase hover:underline">
                {cat.name}
              </Link>
            )}
            <h1 className="mt-2 text-[28px] leading-tight font-bold md:text-[40px]">{post.title}</h1>
            <p className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={16} aria-hidden="true" />
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              </span>
              {post.views > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye size={16} aria-hidden="true" /> {post.views} lượt xem
                </span>
              )}
            </p>
            {post.excerpt && <p className="mt-4 text-lg text-muted">{post.excerpt}</p>}
          </header>
          <RichContent html={post.content} className="mx-auto mt-8 max-w-3xl" />
        </article>
        <BlogSidebar />
      </div>
      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="related-posts">
          <h2 id="related-posts" className="mb-5 text-2xl font-bold">
            Bài viết liên quan
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
