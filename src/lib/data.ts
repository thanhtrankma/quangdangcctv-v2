/**
 * Read helpers for the public site. All filtering of drafts/inactive rows lives here.
 * Every read is cached across requests under CONTENT_TAG; admin writes expire it with updateTag.
 */
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Banner, Brand, Category, Page, Post, PostCategory, Product, Video } from "@/lib/types";

export const CONTENT_TAG = "content";

/** Cross-request cache (keyed by `key` + arguments) with per-request dedupe on top. Fallback expiry matches the site layout. */
const cached = <A extends unknown[], R>(key: string, fn: (...args: A) => Promise<R>) =>
  cache(unstable_cache(fn, [key], { tags: [CONTENT_TAG], revalidate: 300 }));

/** Only what product cards need; `description` alone is most of a product row. */
const PRODUCT_CARD_COLUMNS = ["id", "slug", "name", "price", "compare_at_price", "variant_label", "images"] as const;
export type ProductCardData = Pick<Product, (typeof PRODUCT_CARD_COLUMNS)[number]>;

const POST_CARD_COLUMNS = ["id", "slug", "title", "excerpt", "cover", "published_at", "category_id"] as const;
export type PostCardData = Pick<Post, (typeof POST_CARD_COLUMNS)[number]>;

export const PAGE_SIZE = 16;
export const POST_PAGE_SIZE = 9;

export type ProductSort = "default" | "latest" | "price-asc" | "price-desc";

const sortOrder = (sort: ProductSort = "default") => {
  switch (sort) {
    case "latest":
      return [{ column: "created_at", ascending: false }];
    case "price-asc":
      return [{ column: "price", ascending: true }];
    case "price-desc":
      return [{ column: "price", ascending: false }];
    default:
      return [{ column: "sort_order", ascending: true }, { column: "created_at", ascending: false }];
  }
};

export const getSettings = cached("settings", () => db().getSettings());

export const getCategories = cached("categories", async () => {
  const { rows } = await db().list<Category>("categories", { order: [{ column: "sort_order" }, { column: "name" }], withCount: false });
  return rows;
});

export const getCategoryTree = cache(async () => {
  const all = await getCategories();
  return all
    .filter((c) => !c.parent_id)
    .map((c) => ({ ...c, children: all.filter((s) => s.parent_id === c.id) }));
});

export const getBrands = cached("brands", async () => {
  const { rows } = await db().list<Brand>("brands", { order: [{ column: "sort_order" }, { column: "name" }], withCount: false });
  return rows;
});

/** Ancestors first, the category itself last. */
export function categoryChain(all: Category[], cat: Category) {
  const chain = [cat];
  for (let c = cat; c.parent_id; ) {
    const parent = all.find((x) => x.id === c.parent_id);
    if (!parent || chain.includes(parent)) break;
    chain.unshift(parent);
    c = parent;
  }
  return chain;
}

export const categoryHref = (all: Category[], cat: Category) =>
  `/danh-muc/${categoryChain(all, cat).map((c) => c.slug).join("/")}/`;

/** The category plus all of its descendants, for "products in this category" queries. */
export function categoryWithDescendants(all: Category[], id: string) {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) all.filter((c) => c.parent_id === ids[i]).forEach((c) => ids.push(c.id));
  return ids;
}

export const getProducts = cached("products", async (opts: {
  categoryId?: string;
  brandId?: string;
  q?: string;
  sort?: ProductSort;
  page?: number;
  limit?: number;
  featured?: boolean;
  excludeId?: string;
  /** Skip the total count when the caller doesn't paginate or show it. */
  withCount?: boolean;
}) => {
  const where: Record<string, unknown> = { status: "published" };
  if (opts.categoryId) where.category_id = categoryWithDescendants(await getCategories(), opts.categoryId);
  if (opts.brandId) where.brand_id = opts.brandId;
  if (opts.featured) where.featured = true;
  const limit = opts.limit ?? PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const withCount = opts.withCount ?? true;
  const res = await db().list<ProductCardData>("products", {
    columns: [...PRODUCT_CARD_COLUMNS],
    withCount,
    where,
    order: sortOrder(opts.sort),
    search: opts.q ? { columns: ["name", "sku"], term: opts.q } : undefined,
    limit: opts.excludeId ? limit + 1 : limit,
    offset: (page - 1) * limit,
  });
  if (opts.excludeId) res.rows = res.rows.filter((p) => p.id !== opts.excludeId).slice(0, limit);
  return { ...res, page, pages: withCount ? Math.max(1, Math.ceil(res.count / limit)) : 1 };
});

export const getProductBySlug = cached("product-by-slug", (slug: string) =>
  db().findOne<Product>("products", { slug, status: "published" }),
);

export const getProductCountsByBrand = cached("product-counts-by-brand", async () => {
  const counts: Record<string, number> = {};
  // Paged: Supabase caps a response at 1000 rows.
  for (let offset = 0; ; offset += 1000) {
    const { rows } = await db().list<Pick<Product, "brand_id">>("products", {
      columns: ["brand_id"],
      where: { status: "published" },
      order: [{ column: "id" }],
      limit: 1000,
      offset,
      withCount: false,
    });
    for (const p of rows) if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] ?? 0) + 1;
    if (rows.length < 1000) return counts;
  }
});

export const getBanners = cached("banners", async (position: Banner["position"]) => {
  const { rows } = await db().list<Banner>("banners", { where: { position, active: true }, order: [{ column: "sort_order" }], withCount: false });
  return rows;
});

export const getPosts = cached("posts", async (opts: { page?: number; limit?: number; categoryId?: string; withCount?: boolean } = {}) => {
  const limit = opts.limit ?? POST_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const where: Record<string, unknown> = { status: "published" };
  if (opts.categoryId) where.category_id = opts.categoryId;
  const withCount = opts.withCount ?? true;
  const res = await db().list<PostCardData>("posts", {
    columns: [...POST_CARD_COLUMNS],
    withCount,
    where,
    order: [{ column: "published_at", ascending: false }],
    limit,
    offset: (page - 1) * limit,
  });
  return { ...res, page, pages: withCount ? Math.max(1, Math.ceil(res.count / limit)) : 1 };
});

export const getPostBySlug = cached("post-by-slug", (slug: string) => db().findOne<Post>("posts", { slug, status: "published" }));
export const getPostCategories = cached("post-categories", async () => {
  const { rows } = await db().list<PostCategory>("post_categories", { order: [{ column: "sort_order" }], withCount: false });
  return rows;
});
export const getPostCategory = cached("post-category", (slug: string) => db().findOne<PostCategory>("post_categories", { slug }));
export const getPostCategoryById = cached("post-category-by-id", (id: string) => db().get<PostCategory>("post_categories", id));
export const getPageBySlug = cached("page-by-slug", (slug: string) => db().findOne<Page>("pages", { slug, status: "published" }));

export const getVideos = cached("videos", async () => {
  const { rows } = await db().list<Video>("videos", { where: { active: true }, order: [{ column: "sort_order" }], withCount: false });
  return rows;
});
