import Link from "next/link";
import { Clock, MapPin, Phone, Search } from "lucide-react";
import { categoryHref, getCategories, getSettings } from "@/lib/data";
import { HeaderCart } from "./cart";
import { MainNav, type NavCategory } from "./main-nav";

export async function SiteHeader() {
  const [{ general, header }, cats] = await Promise.all([getSettings(), getCategories()]);
  const node = (id: string | null): NavCategory[] =>
    cats
      .filter((c) => c.parent_id === id)
      .map((c) => ({ id: c.id, name: c.name, href: categoryHref(cats, c), children: node(c.id) }));
  const tree = node(null);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">
        Bỏ qua đến nội dung chính
      </a>
      <div className="bg-navy text-[13px] text-sky-100">
        <div className="container-x flex min-h-9 items-center justify-between gap-4">
          <p className="flex items-center gap-1.5">
            <MapPin size={14} aria-hidden="true" className="shrink-0 text-sky-300" />
            <span className="line-clamp-1">{general.address || header.topbar_left}</span>
          </p>
          <div className="hidden items-center gap-5 md:flex">
            <span className="flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" className="text-sky-300" />
              {general.working_hours}
            </span>
            <span>{header.topbar_right}</span>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-x flex min-h-[72px] items-center gap-3 md:gap-6">
          <Link href="/" className="shrink-0" aria-label={`${general.site_name} – Trang chủ`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={general.logo} alt={general.site_name} width={176} height={55} className="h-11 w-auto md:h-[52px]" />
          </Link>

          <form action="/cua-hang/" method="get" role="search" className="relative hidden flex-1 md:block">
            <label htmlFor="q-desktop" className="sr-only">
              Tìm kiếm sản phẩm
            </label>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              id="q-desktop"
              type="search"
              name="q"
              placeholder={header.search_placeholder}
              className="min-h-11 w-full rounded-full border border-border bg-surface pl-10 pr-28 text-base outline-none transition-colors duration-200 focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/20"
            />
            <button type="submit" className="absolute right-1 top-1/2 min-h-9 -translate-y-1/2 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              Tìm kiếm
            </button>
          </form>

          <div className="ml-auto flex items-center gap-1 md:gap-3">
            <a href={`tel:${general.hotline}`} className="hidden min-h-11 items-center gap-2.5 rounded-lg px-2 lg:flex">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
                <Phone size={18} aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-xs text-muted">Hotline tư vấn</span>
                <strong className="text-[15px] text-ink tabular-nums">{general.hotline_display}</strong>
              </span>
            </a>
            <HeaderCart />
          </div>
        </div>
        <MainNav tree={tree} links={header.nav_links} hotline={general.hotline} hotlineDisplay={general.hotline_display} />
      </header>
      <form action="/cua-hang/" method="get" role="search" className="container-x relative bg-white py-2 md:hidden">
        <label htmlFor="q-mobile" className="sr-only">
          Tìm kiếm sản phẩm
        </label>
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          id="q-mobile"
          type="search"
          name="q"
          placeholder={header.search_placeholder}
          className="min-h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-base outline-none focus:border-primary focus:bg-white"
        />
      </form>
    </>
  );
}
