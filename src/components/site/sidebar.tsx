import Link from "next/link";
import { Phone } from "lucide-react";
import { getPosts, getProducts, getSettings } from "@/lib/data";
import { formatDate, formatPrice, PLACEHOLDER_IMG } from "@/lib/format";

export async function BlogSidebar() {
  const [posts, featured, { general }] = await Promise.all([getPosts({ limit: 5 }), getProducts({ featured: true, limit: 5 }), getSettings()]);
  const box = "rounded-2xl border border-border bg-white p-5";
  return (
    <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start">
      <div className="rounded-2xl bg-navy p-5 text-white">
        <p className="font-heading text-lg font-bold">Cần tư vấn nhanh?</p>
        <p className="mt-1 text-sm text-sky-100/85">Kỹ thuật viên hỗ trợ chọn thiết bị và báo giá lắp đặt.</p>
        <a href={`tel:${general.hotline}`} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cta font-semibold text-white hover:bg-cta-hover">
          <Phone size={18} aria-hidden="true" /> {general.hotline_display}
        </a>
      </div>
      <section className={box} aria-labelledby="side-news">
        <h2 id="side-news" className="font-heading text-base font-semibold">
          Tin mới
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {posts.rows.map((p) => (
            <li key={p.id} className="relative flex gap-3 py-3 first:pt-0 last:pb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.cover || PLACEHOLDER_IMG} alt="" className="h-14 w-20 shrink-0 rounded-lg bg-tint object-cover" />
              <div className="min-w-0 text-sm">
                <Link href={`/${p.slug}/`} className="line-clamp-2 font-medium text-body after:absolute after:inset-0 hover:text-primary">
                  {p.title}
                </Link>
                <time dateTime={p.published_at} className="text-xs text-subtle">
                  {formatDate(p.published_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {featured.rows.length > 0 && (
        <section className={box} aria-labelledby="side-products">
          <h2 id="side-products" className="font-heading text-base font-semibold">
            Sản phẩm đang ưu đãi
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {featured.rows.map((p) => (
              <li key={p.id} className="relative flex gap-3 py-3 first:pt-0 last:pb-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images?.[0] || PLACEHOLDER_IMG} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-border object-contain" />
                <div className="min-w-0 text-sm">
                  <Link href={`/san-pham/${p.slug}/`} className="line-clamp-2 font-medium text-body after:absolute after:inset-0 hover:text-primary">
                    {p.name}
                  </Link>
                  <span className="font-semibold text-price tabular-nums">{formatPrice(p.price)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
