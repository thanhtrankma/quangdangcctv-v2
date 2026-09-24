/** Read helpers for the public site. All filtering of drafts/inactive rows lives here. */
import { cache } from "react";
import { db } from "@/lib/db";
import type { Banner, Brand, Category, Page, Post, PostCategory, Product, Video } from "@/lib/types";

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

export const getSettings = cache(() => db().getSettings());

export const getCategories = cache(async () => {
  const { rows } = await db().list<Category>("categories", { order: [{ column: "sort_order" }, { column: "name" }] });
  return rows;
});

export const getCategoryTree = cache(async () => {
  const all = await getCategories();
  return all
    .filter((c) => !c.parent_id)
    .map((c) => ({ ...c, children: all.filter((s) => s.parent_id === c.id) }));
});

export const getBrands = cache(async () => {
  const { rows } = await db().list<Brand>("brands", { order: [{ column: "sort_order" }, { column: "name" }] });
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

export async function getProducts(opts: {
  categoryId?: string;
  brandId?: string;
  q?: string;
  sort?: ProductSort;
  page?: number;
  limit?: number;
  featured?: boolean;
  excludeId?: string;
}) {
  const where: Record<string, unknown> = { status: "published" };
  if (opts.categoryId) where.category_id = categoryWithDescendants(await getCategories(), opts.categoryId);
  if (opts.brandId) where.brand_id = opts.brandId;
  if (opts.featured) where.featured = true;
  const limit = opts.limit ?? PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const res = await db().list<Product>("products", {
    where,
    order: sortOrder(opts.sort),
    search: opts.q ? { columns: ["name", "sku"], term: opts.q } : undefined,
    limit: opts.excludeId ? limit + 1 : limit,
    offset: (page - 1) * limit,
  });
  if (opts.excludeId) res.rows = res.rows.filter((p) => p.id !== opts.excludeId).slice(0, limit);
  return { ...res, page, pages: Math.max(1, Math.ceil(res.count / limit)) };
}

export const getProductBySlug = cache((slug: string) =>
  db().findOne<Product>("products", { slug, status: "published" }),
);

export async function getProductCountsByBrand() {
  const { rows } = await db().list<Product>("products", { where: { status: "published" } });
  const counts: Record<string, number> = {};
  for (const p of rows) if (p.brand_id) counts[p.brand_id] = (counts[p.brand_id] ?? 0) + 1;
  return counts;
}

export const getBanners = cache(async (position: Banner["position"]) => {
  const { rows } = await db().list<Banner>("banners", { where: { position, active: true }, order: [{ column: "sort_order" }] });
  return rows;
});

export async function getPosts(opts: { page?: number; limit?: number; categoryId?: string } = {}) {
  const limit = opts.limit ?? POST_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const where: Record<string, unknown> = { status: "published" };
  if (opts.categoryId) where.category_id = opts.categoryId;
  const res = await db().list<Post>("posts", {
    where,
    order: [{ column: "published_at", ascending: false }],
    limit,
    offset: (page - 1) * limit,
  });
  return { ...res, page, pages: Math.max(1, Math.ceil(res.count / limit)) };
}

export const getPostBySlug = cache((slug: string) => db().findOne<Post>("posts", { slug, status: "published" }));
export const getPostCategory = cache((slug: string) => db().findOne<PostCategory>("post_categories", { slug }));
export const getPostCategoryById = cache((id: string) => db().get<PostCategory>("post_categories", id));
export const getPageBySlug = cache((slug: string) => db().findOne<Page>("pages", { slug, status: "published" }));

export async function getVideos() {
  const { rows } = await db().list<Video>("videos", { where: { active: true }, order: [{ column: "sort_order" }] });
  return rows;
}
