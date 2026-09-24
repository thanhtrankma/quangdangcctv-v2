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
