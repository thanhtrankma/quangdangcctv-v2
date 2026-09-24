import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { categoryHref, getBrands, getCategories } from "@/lib/data";
import type { Page, Post, Product } from "@/lib/types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const published = { where: { status: "published" } };
  const [cats, brands, products, posts, pages] = await Promise.all([
    getCategories(),
    getBrands(),
    db().list<Product>("products", published),
    db().list<Post>("posts", published),
    db().list<Page>("pages", published),
  ]);
  const urls = [
    "/", "/cua-hang/", "/thuong-hieu/", "/tin-tuc/", "/videos/",
    ...cats.map((c) => categoryHref(cats, c)),
    ...brands.map((b) => `/thuong-hieu/${b.slug}/`),
    ...products.rows.map((p) => `/san-pham/${p.slug}/`),
    ...posts.rows.map((p) => `/${p.slug}/`),
    ...pages.rows.map((p) => `/${p.slug}/`),
  ];
  return urls.map((u) => ({ url: `${base}${u}` }));
}
