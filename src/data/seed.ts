/**
 * Demo data used when Supabase is not configured (and to generate supabase/seed.sql).
 * Content was imported from minhhiepcctv.vn by scripts/minhhiep/ (crawl.py → transform.py).
 */
import scraped from "./scraped.json";
import type {
  Banner, Brand, Category, ContactMessage, Order, Page, Post, PostCategory, PriceHistory, Product, PurchaseOrder,
  StockMovement, Supplier, Video,
} from "@/lib/types";

const now = "2026-09-24T00:00:00.000Z";
const stamp = <T extends object>(rows: T[]) => rows.map((r) => ({ created_at: now, updated_at: now, ...r }));

export { seedSettings } from "./settings";

const banners = scraped.banners as Banner[];
const postCategories = scraped.post_categories as PostCategory[];

const videos: Video[] = [];
const orders: Order[] = [];
const contactMessages: ContactMessage[] = [];

export const seedTables = {
  categories: stamp(
    scraped.categories.map((c: Partial<Category>) => ({ ...c, description: c.description ?? "", banner: c.banner ?? "" })) as Category[],
  ),
  brands: stamp(scraped.brands as Brand[]),
  products: stamp(scraped.products as Product[]),
  banners: stamp(banners),
  post_categories: stamp(postCategories),
  posts: stamp(scraped.posts as Post[]),
  pages: stamp(scraped.pages as Page[]),
  videos: stamp(videos),
  orders: stamp(orders),
  contact_messages: stamp(contactMessages),
  // Inventory & pricing (migration 002) – start empty.
  suppliers: [] as Supplier[],
  purchase_orders: [] as PurchaseOrder[],
  stock_movements: [] as StockMovement[],
  price_history: [] as PriceHistory[],
};

export type TableName = keyof typeof seedTables;
export const TABLES = Object.keys(seedTables) as TableName[];
