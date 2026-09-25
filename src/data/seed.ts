/**
 * Demo data used when Supabase is not configured (and to generate supabase/seed.sql).
 * Content was imported from minhhiepcctv.vn by scripts/minhhiep/ (crawl.py → transform.py).
 */
import scraped from "./scraped.json";
import type {
  Banner, Brand, Category, ContactMessage, Order, Page, Post, PostCategory, PriceHistory, Product, PurchaseOrder, Settings,
  StockMovement, Supplier, Video,
} from "@/lib/types";

const now = "2026-09-24T00:00:00.000Z";
const stamp = <T extends object>(rows: T[]) => rows.map((r) => ({ created_at: now, updated_at: now, ...r }));

export const seedSettings: Settings = {
  general: {
    site_name: "SmartHomeHP",
    logo: "/assets/images/site/quangdang-cctv-logo.svg",
    favicon: "/assets/favicon/favicon.svg",
    hotline: "0917799091",
    hotline_display: "0917 799 091",
    email: "cameraminhhiep@gmail.com",
    address: "79 Phương Lưu, Đông Hải 1, Hải An, Hải Phòng",
    working_hours: "Mở cửa từ 8h hằng ngày",
    zalo_url: "https://zalo.me/0917799091",
    facebook_url: "https://www.facebook.com/minhhiepprotech2016",
    youtube_url: "",
    messenger_url: "https://www.facebook.com/minhhiepprotech2016",
    seo_title: "SmartHomeHP | Camera an ninh, bộ lưu điện, máy tính, thiết bị mạng",
    seo_description:
      "SmartHomeHP cung cấp và lắp đặt camera an ninh Hikvision, Ezviz, thiết bị mạng, bộ lưu điện UPS, máy tính và giải pháp công nghệ tại Hải Phòng và toàn miền Bắc.",
    og_image: "/assets/images/site/quangdang-cctv-logo.svg",
    ga_id: "",
  },
  header: {
    topbar_left: "Showroom: 79 Phương Lưu, Hải An, Hải Phòng",
    topbar_center: "☎ HOTLINE 0917 799 091",
    topbar_right: "Giao hàng & lắp đặt toàn quốc",
    search_placeholder: "Tìm camera, wifi, bộ lưu điện...",
    nav_links: [
      { label: "Trang chủ", href: "/" },
      { label: "Cửa hàng", href: "/cua-hang/" },
      { label: "Dự án tiêu biểu", href: "/du-an-tieu-bieu/" },
      { label: "Giải pháp công nghệ", href: "/giai-phap-cong-nghe/" },
      { label: "Tư vấn lắp đặt", href: "/tu-van-lap-dat/" },
      { label: "Tin tức", href: "/tin-tuc/" },
      { label: "Giới thiệu", href: "/gioi-thieu/" },
      { label: "Liên hệ", href: "/lien-he/" },
    ],
  },
  home: {
    heading: "SmartHomeHP – Camera an ninh, thiết bị mạng & giải pháp công nghệ",
    intro:
      "Camera Hikvision, Ezviz, wifi, bộ lưu điện, máy tính và thiết bị điện máy chính hãng — tư vấn, lắp đặt trọn gói tại Hải Phòng và toàn miền Bắc.",
    menu_eyebrow: "Danh mục SmartHomeHP",
    menu_title: "Chọn theo nhu cầu",
    brands_title: "Thương hiệu phân phối",
    brands_subtitle: "Hàng chính hãng, bảo hành theo tiêu chuẩn của hãng.",
    shelf_limit: 12,
    news_title: "Tin tức & kinh nghiệm",
    faq_title: "Câu hỏi thường gặp",
    faqs: scraped.home_faqs,
  },
  footer: {
    contact_title: "SmartHomeHP",
    contact_html:
      "Địa chỉ: 79 Phương Lưu, Đông Hải 1, Hải An, Hải Phòng<br>Hotline: 0917 799 091 (Quốc Khánh)<br>Zalo bán hàng: 0772 236 529 · 0981 791 129 · 0936 921 299<br>Giao hàng toàn quốc – trả tiền sau (COD)",
    columns: [
      {
        title: "Về SmartHomeHP",
        links: [
          { label: "Giới thiệu", href: "/gioi-thieu/" },
          { label: "Địa chỉ công ty", href: "/dia-chi-cong-ty/" },
          { label: "Dự án tiêu biểu", href: "/du-an-tieu-bieu/" },
          { label: "Tuyển dụng", href: "/tuyen-dung/" },
          { label: "Tin tức", href: "/tin-tuc/" },
          { label: "Liên hệ", href: "/lien-he/" },
        ],
      },
      {
        title: "Hỗ trợ khách hàng",
        links: [
          { label: "Hỗ trợ đổi trả", href: "/ho-tro-doi-tra/" },
          { label: "Chính sách bảo hành", href: "/chinh-sach-bao-hanh/" },
          { label: "Vận chuyển", href: "/van-chuyen/" },
          { label: "Gói lắp đặt", href: "/goi-lap-dat/" },
          { label: "Tư vấn lắp đặt", href: "/tu-van-lap-dat/" },
        ],
      },
    ],
    map_title: "Bản đồ",
    map_image: "",
    map_url: "https://maps.app.goo.gl/kurNK7z9deiqACcb9",
    copyright: "Copyright © 2026 SmartHomeHP - All Rights Reserved.",
  },
  product_page: {
    buy_now_text: "ĐẶT HÀNG NGAY",
    buy_now_sub: "Gọi điện xác nhận và giao hàng tận nơi",
    chat_text: "💬 Chat Facebook tư vấn — phản hồi nhanh",
    policies: [
      { icon: "/assets/images/site/policy-icons/icon-policy-1.png", text: "<strong>Giao hàng toàn quốc</strong><br>Giao hàng trước, trả tiền sau (COD)" },
      { icon: "/assets/images/site/policy-icons/icon-policy-2.png", text: "<strong>Đổi trả dễ dàng</strong><br>Đổi mới trong 30 ngày đầu" },
      { icon: "/assets/images/site/policy-icons/icon-policy-3.png", text: "<strong>Thanh toán tiện lợi</strong><br>Tiền mặt, chuyển khoản, trả góp 0%" },
      { icon: "/assets/images/site/policy-icons/icon-policy-4.png", text: "<strong>Hỗ trợ nhiệt tình 24/7</strong><br>Hotline <strong>0917 799 091</strong>" },
      { icon: "/assets/images/site/policy-icons/icon-policy-5.png", text: "Lắp đặt trọn gói tại Hải Phòng & miền Bắc" },
    ],
  },
};

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
