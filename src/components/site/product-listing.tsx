import Link from "next/link";
import { Suspense } from "react";
import { X } from "lucide-react";
import { getBrands, getProducts, PAGE_SIZE, type ProductSort } from "@/lib/data";
import { SortSelect } from "./sort-select";
import { Pagination, ProductGrid } from "./ui";

export type ListingSearchParams = Promise<{ page?: string; sort?: string; q?: string; brand?: string }>;

type SideLink = { href: string; label: string; active?: boolean; depth?: number };

/** Two-column listing: filter sidebar (sub-categories + brands) and the product grid. */
export async function ProductListing({
  basePath,
  searchParams,
  categoryId,
  brandId,
  sideTitle,
  sideLinks = [],
}: {
  basePath: string;
  searchParams: ListingSearchParams;
  categoryId?: string;
  brandId?: string;
  sideTitle?: string;
  sideLinks?: SideLink[];
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort = (sp.sort as ProductSort) || "default";
  const brandFilter = brandId ?? sp.brand;
  const [res, brands] = await Promise.all([
    getProducts({ categoryId, brandId: brandFilter, q: sp.q, sort, page }),
    brandId ? Promise.resolve([]) : getBrands(),
  ]);
  const from = res.count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, res.count);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, sort: sp.sort, brand: sp.brand, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `${basePath}${p.size ? `?${p}` : ""}`;
  };
  const activeBrand = brands.find((b) => b.id === sp.brand);

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start" aria-label="Bộ lọc">
        {sideLinks.length > 0 && (
          <nav aria-label={sideTitle ?? "Danh mục"} className="rounded-xl border border-border bg-white p-4">
            <h2 className="mb-2 font-heading text-base font-semibold">{sideTitle ?? "Danh mục"}</h2>
            <ul className="no-scrollbar flex gap-2 overflow-x-auto lg:block lg:space-y-0.5">
              {sideLinks.map((l) => (
                <li key={l.href} className="shrink-0">
                  <Link
                    href={l.href}
                    aria-current={l.active ? "page" : undefined}
                    style={{ paddingLeft: l.depth ? `${0.75 + l.depth * 0.85}rem` : undefined }}
                    className={`flex min-h-10 items-center rounded-lg px-3 text-[15px] whitespace-nowrap transition-colors duration-150 lg:whitespace-normal ${
                      l.active ? "bg-primary-soft font-semibold text-primary" : "border border-border text-body hover:bg-tint lg:border-0"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {brands.length > 0 && (
          <div className="hidden rounded-xl border border-border bg-white p-4 lg:block">
            <h2 className="mb-2 font-heading text-base font-semibold">Thương hiệu</h2>
            <ul className="flex flex-wrap gap-2">
              {brands.slice(0, 24).map((b) => {
                const on = b.id === sp.brand;
                return (
                  <li key={b.id}>
                    <Link
                      href={qs({ brand: on ? undefined : b.id, page: undefined })}
                      aria-pressed={on}
                      scroll={false}
                      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors duration-150 ${
                        on ? "border-primary bg-primary text-white" : "border-border text-body hover:border-primary hover:text-primary"
                      }`}
                    >
                      {b.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-2">
          <p className="text-sm text-muted" aria-live="polite">
            {sp.q && (
              <>
                Kết quả cho “<strong className="text-ink">{sp.q}</strong>” ·{" "}
              </>
            )}
            {res.count ? (
              <>
                Hiển thị <span className="tabular-nums">{from}–{to}</span> / <strong className="text-ink tabular-nums">{res.count}</strong> sản phẩm
              </>
            ) : (
              "Không có sản phẩm"
            )}
          </p>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>
        {(activeBrand || sp.q) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeBrand && (
              <Link href={qs({ brand: undefined, page: undefined })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-sm font-medium text-primary">
                Thương hiệu: {activeBrand.name} <X size={14} aria-label="Bỏ lọc" />
              </Link>
            )}
            {sp.q && (
              <Link href={qs({ q: undefined, page: undefined })} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-sm font-medium text-primary">
                Từ khoá: {sp.q} <X size={14} aria-label="Bỏ tìm kiếm" />
              </Link>
            )}
          </div>
        )}
        <ProductGrid products={res.rows} />
        <Pagination page={page} pages={res.pages} href={(n) => qs({ page: n > 1 ? String(n) : undefined })} />
      </div>
    </div>
  );
}
