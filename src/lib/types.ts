export type Status = "published" | "draft";

export interface BaseRow {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category extends BaseRow {
  slug: string;
  name: string;
  parent_id: string | null;
  tagline: string;
  description: string;
  banner: string;
  color: string;
  sort_order: number;
  show_on_home: boolean;
  seo_title?: string;
  seo_description?: string;
}

export interface Brand extends BaseRow {
  slug: string;
  name: string;
  tagline: string;
  logo: string;
  description?: string;
  featured: boolean;
  sort_order: number;
}

export interface Product extends BaseRow {
  slug: string;
  name: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  variant_label: string;
  images: string[];
  category_id: string | null;
  brand_id: string | null;
  short_description: string;
  description: string;
  status: Status;
  featured: boolean;
  sort_order: number;
  seo_title?: string;
  seo_description?: string;
  /** Inventory & pricing (migration 002). Optional so older rows / the mock DB still type-check. */
  cost_price?: number;
  wholesale_price?: number | null;
  stock?: number;
  low_stock_threshold?: number;
  track_stock?: boolean;
}

export interface Banner extends BaseRow {
  title: string;
  eyebrow: string;
  subtitle: string;
  image: string;
  image_mobile: string;
  link: string;
  button_text: string;
  position: "home_hero" | "home_strip";
  active: boolean;
  sort_order: number;
}

export interface PostCategory extends BaseRow {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface Post extends BaseRow {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  content: string;
  category_id: string | null;
  published_at: string;
  views: number;
  status: Status;
  seo_title?: string;
  seo_description?: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface Page extends BaseRow {
  slug: string;
  title: string;
  content: string;
  template: "default" | "contact";
  faqs: Faq[];
  status: Status;
  seo_title?: string;
  seo_description?: string;
}

export interface Video extends BaseRow {
  title: string;
  youtube_url: string;
  description: string;
  active: boolean;
  sort_order: number;
}

export interface OrderItem {
  slug: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  image: string;
  /** Unit cost snapshot taken when stock was deducted (for gross profit). */
  cost?: number;
}

export type OrderStatus = "new" | "confirmed" | "shipping" | "completed" | "cancelled";

export interface Order extends BaseRow {
  code: string;
  customer_name: string;
  phone: string;
  email: string;
  province: string;
  ward: string;
  address: string;
  note: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  admin_note: string;
  stock_deducted?: boolean;
  cost_total?: number;
}

export interface Supplier extends BaseRow {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  tax_code: string;
  bank_account: string;
  note: string;
  active: boolean;
}

export interface PurchaseItem {
  product_id: string;
  name: string;
  sku: string;
  qty: number;
  unit_cost: number;
}

export type PurchaseStatus = "draft" | "received" | "cancelled";

export interface PurchaseOrder extends BaseRow {
  code: string;
  supplier_id: string | null;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  paid_amount: number;
  ordered_at: string;
  received_at: string | null;
  note: string;
}

export type StockMovementType = "purchase" | "purchase_cancel" | "sale" | "sale_return" | "adjustment";

export interface StockMovement extends BaseRow {
  product_id: string;
  product_name: string;
  type: StockMovementType;
  qty: number;
  stock_after: number;
  unit_cost: number;
  ref_type: string;
  ref_id: string;
  ref_code: string;
  note: string;
}

export interface PriceHistory extends BaseRow {
  product_id: string;
  product_name: string;
  old_price: number | null;
  new_price: number | null;
  old_compare_at_price: number | null;
  new_compare_at_price: number | null;
  old_cost_price: number | null;
  new_cost_price: number | null;
  source: "manual" | "bulk" | "purchase";
  note: string;
}

export interface ContactMessage extends BaseRow {
  name: string;
  phone: string;
  email: string;
  message: string;
  source: string;
  status: "new" | "read" | "done";
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface PolicyItem {
  icon: string;
  text: string;
}

/** Singleton settings, stored as one row per group in the `settings` table. */
export interface Settings {
  general: {
    site_name: string;
    logo: string;
    favicon: string;
    hotline: string;
    hotline_display: string;
    email: string;
    address: string;
    working_hours: string;
    zalo_url: string;
    facebook_url: string;
    youtube_url: string;
    messenger_url: string;
    seo_title: string;
    seo_description: string;
    og_image: string;
    ga_id: string;
  };
  header: {
    topbar_left: string;
    topbar_center: string;
    topbar_right: string;
    search_placeholder: string;
    nav_links: NavLink[];
  };
  home: {
    heading: string;
    intro: string;
    menu_eyebrow: string;
    menu_title: string;
    brands_title: string;
    brands_subtitle: string;
    shelf_limit: number;
    news_title: string;
    faq_title: string;
    faqs: Faq[];
  };
  footer: {
    contact_title: string;
    contact_html: string;
    columns: FooterColumn[];
    map_title: string;
    map_image: string;
    map_url: string;
    copyright: string;
  };
  product_page: {
    buy_now_text: string;
    buy_now_sub: string;
    chat_text: string;
    policies: PolicyItem[];
  };
}

export type SettingsKey = keyof Settings;
