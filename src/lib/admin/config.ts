/**
 * Declarative admin config: every manageable table and settings group is described here,
 * and the generic list/form pages render from it. Add a field here + a column in
 * supabase/schema.sql and it shows up in the admin.
 */
import type { SettingsKey } from "@/lib/types";
import type { TableName } from "@/lib/db";

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "money"
  | "boolean"
  | "select"
  | "relation"
  | "image"
  | "images"
  | "date"
  | "slug"
  | "color"
  | "list"
  | "order_items"
  | "po_items"
  | "readonly";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** Layout hint: "half" puts two fields side by side. */
  width?: "half" | "full";
  /** Which column of the form (main content vs. sidebar). */
  side?: boolean;
  options?: { value: string; label: string }[];
  /** For relation fields: table to pick from. */
  relation?: TableName;
  /** For slug fields: the field to generate from. */
  from?: string;
  /** For list fields: shape of each item. */
  fields?: Field[];
  itemLabel?: string;
  default?: unknown;
  /** How a readonly field is displayed. */
  format?: "money" | "number" | "datetime" | "text";
}

export interface Column {
  name: string;
  label: string;
  type?: "text" | "image" | "money" | "boolean" | "relation" | "date" | "datetime" | "status" | "images" | "number" | "stock" | "signed";
  relation?: TableName;
}

export interface Resource {
  key: TableName;
  label: string;
  singular: string;
  group: string;
  fields: Field[];
  columns: Column[];
  searchColumns: string[];
  defaultOrder: { column: string; ascending?: boolean }[];
  filters?: { name: string; label: string; options?: { value: string; label: string }[]; relation?: TableName }[];
  canCreate?: boolean;
  /** List + view only (history tables). */
  readOnly?: boolean;
  canDelete?: boolean;
  /** Public URL for the "Xem trên web" link. */
  viewPath?: (row: Record<string, unknown>) => string | null;
  titleField: string;
}

const STATUS = [
  { value: "published", label: "Hiển thị" },
  { value: "draft", label: "Nháp (ẩn)" },
];

const SEO: Field[] = [
  { name: "seo_title", label: "SEO title", type: "text", side: true, help: "Để trống sẽ dùng tên/tiêu đề" },
  { name: "seo_description", label: "SEO description", type: "textarea", side: true },
];

const FAQ_FIELDS: Field[] = [
  { name: "question", label: "Câu hỏi", type: "text" },
  { name: "answer", label: "Trả lời (cho phép HTML)", type: "textarea" },
];

const LINK_FIELDS: Field[] = [
  { name: "label", label: "Nhãn", type: "text", width: "half" },
  { name: "href", label: "Đường dẫn", type: "text", width: "half", placeholder: "/cua-hang/" },
];

export const ORDER_STATUS = [
  { value: "new", label: "Mới" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã huỷ" },
];

export const PURCHASE_STATUS = [
  { value: "draft", label: "Nháp" },
  { value: "received", label: "Đã nhập kho" },
  { value: "cancelled", label: "Đã huỷ" },
];

export const MOVEMENT_TYPES = [
  { value: "purchase", label: "Nhập hàng" },
  { value: "purchase_cancel", label: "Huỷ phiếu nhập" },
  { value: "sale", label: "Xuất bán" },
  { value: "sale_return", label: "Hoàn / huỷ đơn" },
  { value: "adjustment", label: "Kiểm kho / điều chỉnh" },
];

export const PRICE_SOURCES = [
  { value: "manual", label: "Sửa tay" },
  { value: "bulk", label: "Cập nhật hàng loạt" },
  { value: "purchase", label: "Nhập hàng" },
];

export const CONTACT_STATUS = [
  { value: "new", label: "Mới" },
  { value: "read", label: "Đã xem" },
  { value: "done", label: "Đã xử lý" },
];

export const resources: Resource[] = [
  {
    key: "orders",
    label: "Đơn hàng",
    singular: "đơn hàng",
    group: "Bán hàng",
    titleField: "code",
    canCreate: false,
    searchColumns: ["code", "customer_name", "phone"],
    defaultOrder: [{ column: "created_at", ascending: false }],
    filters: [{ name: "status", label: "Trạng thái", options: ORDER_STATUS }],
    columns: [
      { name: "code", label: "Mã đơn" },
      { name: "customer_name", label: "Khách hàng" },
      { name: "phone", label: "SĐT" },
      { name: "total", label: "Tổng tiền", type: "money" },
      { name: "status", label: "Trạng thái", type: "status" },
      { name: "created_at", label: "Ngày đặt", type: "datetime" },
    ],
    fields: [
      { name: "items", label: "Sản phẩm", type: "order_items" },
      { name: "customer_name", label: "Họ tên", type: "text", width: "half", required: true },
      { name: "phone", label: "Số điện thoại", type: "text", width: "half", required: true },
      { name: "email", label: "Email", type: "text", width: "half" },
      { name: "province", label: "Tỉnh/Thành", type: "text", width: "half" },
      { name: "ward", label: "Phường/Xã", type: "text", width: "half" },
      { name: "address", label: "Địa chỉ", type: "text", width: "half" },
      { name: "note", label: "Ghi chú của khách", type: "textarea" },
      { name: "code", label: "Mã đơn", type: "readonly", side: true },
      { name: "total", label: "Tổng tiền", type: "readonly", side: true },
      {
        name: "status",
        label: "Trạng thái",
        type: "select",
        options: ORDER_STATUS,
        side: true,
        default: "new",
        help: "Chuyển sang Đã xác nhận / Đang giao / Hoàn thành sẽ tự trừ kho; chuyển sang Đã huỷ sẽ trả hàng về kho.",
      },
      { name: "cost_total", label: "Giá vốn đơn hàng", type: "readonly", format: "money", side: true, help: "Ghi nhận lúc trừ kho" },
      { name: "admin_note", label: "Ghi chú nội bộ", type: "textarea", side: true },
    ],
  },
  {
    key: "contact_messages",
    label: "Liên hệ / Tư vấn",
    singular: "liên hệ",
    group: "Bán hàng",
    titleField: "name",
    canCreate: false,
    searchColumns: ["name", "phone", "email", "message"],
    defaultOrder: [{ column: "created_at", ascending: false }],
    filters: [{ name: "status", label: "Trạng thái", options: CONTACT_STATUS }],
    columns: [
      { name: "name", label: "Họ tên" },
      { name: "phone", label: "SĐT" },
      { name: "message", label: "Nội dung" },
      { name: "status", label: "Trạng thái", type: "status" },
      { name: "created_at", label: "Ngày gửi", type: "datetime" },
    ],
    fields: [
      { name: "name", label: "Họ tên", type: "text", width: "half" },
      { name: "phone", label: "Số điện thoại", type: "text", width: "half" },
      { name: "email", label: "Email", type: "text", width: "half" },
      { name: "source", label: "Nguồn", type: "readonly", width: "half" },
      { name: "message", label: "Nội dung", type: "textarea" },
      { name: "status", label: "Trạng thái", type: "select", options: CONTACT_STATUS, side: true, default: "new" },
    ],
  },
  {
    key: "products",
    label: "Sản phẩm",
    singular: "sản phẩm",
    group: "Sản phẩm",
    titleField: "name",
    searchColumns: ["name", "sku"],
    defaultOrder: [{ column: "sort_order" }, { column: "created_at", ascending: false }],
    viewPath: (r) => `/san-pham/${r.slug}/`,
    filters: [
      { name: "status", label: "Trạng thái", options: STATUS },
      { name: "category_id", label: "Danh mục", relation: "categories" },
      { name: "brand_id", label: "Thương hiệu", relation: "brands" },
    ],
    columns: [
      { name: "images", label: "Ảnh", type: "images" },
      { name: "name", label: "Tên sản phẩm" },
      { name: "price", label: "Giá bán", type: "money" },
      { name: "cost_price", label: "Giá vốn", type: "money" },
      { name: "stock", label: "Tồn", type: "stock" },
      { name: "category_id", label: "Danh mục", type: "relation", relation: "categories" },
      { name: "status", label: "Trạng thái", type: "status" },
    ],
    fields: [
      { name: "name", label: "Tên sản phẩm", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "slug", from: "name", required: true, help: "URL: /san-pham/<slug>/" },
      { name: "price", label: "Giá bán (₫)", type: "money", width: "half", required: true, help: "Nhập 0 để hiển thị “Liên hệ”" },
      { name: "compare_at_price", label: "Giá gốc (₫) – để hiện % giảm", type: "money", width: "half" },
      { name: "cost_price", label: "Giá vốn (₫)", type: "money", width: "half", help: "Tự cập nhật theo bình quân khi nhập hàng" },
      { name: "wholesale_price", label: "Giá sỉ / đại lý (₫)", type: "money", width: "half" },
      { name: "stock", label: "Tồn kho hiện tại", type: "readonly", format: "number", width: "half", help: "Thay đổi qua Nhập hàng, Đơn hàng hoặc Kiểm kho" },
      { name: "low_stock_threshold", label: "Cảnh báo khi tồn ≤", type: "number", width: "half", default: 2 },
      { name: "sku", label: "SKU", type: "text", width: "half" },
      { name: "variant_label", label: "Phân loại / màu / size", type: "text", width: "half" },
      { name: "images", label: "Ảnh sản phẩm (ảnh đầu tiên là ảnh đại diện)", type: "images" },
      { name: "short_description", label: "Mô tả ngắn", type: "richtext" },
      { name: "description", label: "Mô tả chi tiết", type: "richtext" },
      { name: "status", label: "Trạng thái", type: "select", options: STATUS, side: true, default: "published" },
      { name: "category_id", label: "Danh mục", type: "relation", relation: "categories", side: true },
      { name: "brand_id", label: "Thương hiệu", type: "relation", relation: "brands", side: true },
      { name: "featured", label: "Sản phẩm nổi bật (hiện ở sidebar)", type: "boolean", side: true },
      {
        name: "track_stock",
        label: "Theo dõi tồn kho (hiện Còn/Hết hàng trên web)",
        type: "boolean",
        side: true,
        help: "Tự bật khi sản phẩm có phiếu nhập hoặc kiểm kho",
      },
      { name: "sort_order", label: "Thứ tự (nhỏ lên trước)", type: "number", side: true, default: 0 },
      ...SEO,
    ],
  },
  {
    key: "categories",
    label: "Danh mục sản phẩm",
    singular: "danh mục",
    group: "Sản phẩm",
    titleField: "name",
    searchColumns: ["name", "slug"],
    defaultOrder: [{ column: "sort_order" }, { column: "name" }],
    viewPath: (r) => `/danh-muc/${r.slug}/`,
    columns: [
      { name: "name", label: "Tên danh mục" },
      { name: "parent_id", label: "Danh mục cha", type: "relation", relation: "categories" },
      { name: "show_on_home", label: "Trang chủ", type: "boolean" },
      { name: "sort_order", label: "Thứ tự" },
    ],
    fields: [
      { name: "name", label: "Tên danh mục", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "slug", from: "name", required: true },
      { name: "tagline", label: "Mô tả ngắn (hiện ở menu trang chủ)", type: "text" },
      { name: "banner", label: "Ảnh banner danh mục", type: "image" },
      { name: "description", label: "Mô tả danh mục", type: "richtext" },
      { name: "parent_id", label: "Danh mục cha", type: "relation", relation: "categories", side: true },
      { name: "show_on_home", label: "Hiện trên trang chủ (menu + kệ sản phẩm)", type: "boolean", side: true },
      { name: "sort_order", label: "Thứ tự", type: "number", side: true, default: 0 },
      { name: "color", label: "Màu biểu tượng", type: "color", side: true, default: "#0e9488" },
      ...SEO,
    ],
  },
  {
    key: "brands",
    label: "Thương hiệu",
    singular: "thương hiệu",
    group: "Sản phẩm",
    titleField: "name",
    searchColumns: ["name", "slug"],
    defaultOrder: [{ column: "sort_order" }, { column: "name" }],
    viewPath: (r) => `/thuong-hieu/${r.slug}/`,
    columns: [
      { name: "logo", label: "Logo", type: "image" },
      { name: "name", label: "Tên" },
      { name: "tagline", label: "Mô tả ngắn" },
      { name: "featured", label: "Trang chủ", type: "boolean" },
      { name: "sort_order", label: "Thứ tự" },
    ],
    fields: [
      { name: "name", label: "Tên thương hiệu", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "slug", from: "name", required: true },
      { name: "tagline", label: "Mô tả ngắn", type: "text", placeholder: "Đồ bếp Đức" },
      { name: "description", label: "Giới thiệu thương hiệu", type: "richtext" },
      { name: "logo", label: "Logo (tuỳ chọn)", type: "image", side: true },
      { name: "featured", label: "Hiện ở trang chủ", type: "boolean", side: true },
      { name: "sort_order", label: "Thứ tự", type: "number", side: true, default: 0 },
    ],
  },
  {
    key: "banners",
    label: "Banner",
    singular: "banner",
    group: "Nội dung",
    titleField: "title",
    searchColumns: ["title"],
    defaultOrder: [{ column: "sort_order" }],
    columns: [
      { name: "image", label: "Ảnh", type: "image" },
      { name: "title", label: "Tiêu đề" },
      { name: "position", label: "Vị trí" },
      { name: "active", label: "Hiển thị", type: "boolean" },
      { name: "sort_order", label: "Thứ tự" },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "eyebrow", label: "Dòng chữ nhỏ phía trên", type: "text" },
      { name: "subtitle", label: "Mô tả", type: "textarea" },
      { name: "image", label: "Ảnh desktop (khuyến nghị 1400×933)", type: "image", required: true },
      { name: "image_mobile", label: "Ảnh mobile (tuỳ chọn)", type: "image" },
      { name: "link", label: "Link khi bấm nút", type: "text", width: "half", placeholder: "/cua-hang/" },
      { name: "button_text", label: "Chữ trên nút", type: "text", width: "half" },
      {
        name: "position",
        label: "Vị trí",
        type: "select",
        side: true,
        default: "home_hero",
        options: [{ value: "home_hero", label: "Trang chủ – banner chính" }],
      },
      { name: "active", label: "Đang hiển thị", type: "boolean", side: true, default: true },
      { name: "sort_order", label: "Thứ tự", type: "number", side: true, default: 0 },
    ],
  },
  {
    key: "posts",
    label: "Tin tức",
    singular: "bài viết",
    group: "Nội dung",
    titleField: "title",
    searchColumns: ["title"],
    defaultOrder: [{ column: "published_at", ascending: false }],
    viewPath: (r) => `/${r.slug}/`,
    filters: [{ name: "status", label: "Trạng thái", options: STATUS }],
    columns: [
      { name: "cover", label: "Ảnh", type: "image" },
      { name: "title", label: "Tiêu đề" },
      { name: "category_id", label: "Chuyên mục", type: "relation", relation: "post_categories" },
      { name: "published_at", label: "Ngày đăng", type: "date" },
      { name: "status", label: "Trạng thái", type: "status" },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "slug", from: "title", required: true, help: "URL: /<slug>/" },
      { name: "excerpt", label: "Tóm tắt", type: "textarea" },
      { name: "content", label: "Nội dung", type: "richtext" },
      { name: "cover", label: "Ảnh đại diện", type: "image", side: true },
      { name: "status", label: "Trạng thái", type: "select", options: STATUS, side: true, default: "published" },
      { name: "category_id", label: "Chuyên mục", type: "relation", relation: "post_categories", side: true },
      { name: "published_at", label: "Ngày đăng", type: "date", side: true },
      ...SEO,
    ],
  },
  {
    key: "post_categories",
    label: "Chuyên mục tin",
    singular: "chuyên mục",
    group: "Nội dung",
    titleField: "name",
    searchColumns: ["name"],
    defaultOrder: [{ column: "sort_order" }],
    viewPath: (r) => `/danh-muc-tin-tuc/${r.slug}/`,
    columns: [
      { name: "name", label: "Tên" },
      { name: "slug", label: "Slug" },
      { name: "sort_order", label: "Thứ tự" },
    ],
    fields: [
      { name: "name", label: "Tên chuyên mục", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "slug", from: "name", required: true },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "sort_order", label: "Thứ tự", type: "number", side: true, default: 0 },
    ],
  },
  {
    key: "pages",
    label: "Trang nội dung",
    singular: "trang",
    group: "Nội dung",
    titleField: "title",
    searchColumns: ["title", "slug"],
    defaultOrder: [{ column: "title" }],
    viewPath: (r) => `/${r.slug}/`,
    columns: [
      { name: "title", label: "Tiêu đề" },
      { name: "slug", label: "Đường dẫn" },
      { name: "template", label: "Mẫu" },
      { name: "status", label: "Trạng thái", type: "status" },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "slug", from: "title", required: true, help: "Ví dụ: gioi-thieu → /gioi-thieu/" },
      { name: "content", label: "Nội dung", type: "richtext" },
      { name: "faqs", label: "Câu hỏi thường gặp (FAQ)", type: "list", fields: FAQ_FIELDS, itemLabel: "question" },
      { name: "status", label: "Trạng thái", type: "select", options: STATUS, side: true, default: "published" },
      {
        name: "template",
        label: "Mẫu trang",
        type: "select",
        side: true,
        default: "default",
        options: [
          { value: "default", label: "Mặc định" },
          { value: "contact", label: "Liên hệ (có form)" },
        ],
      },
      ...SEO,
    ],
  },
  {
    key: "videos",
    label: "Videos",
    singular: "video",
    group: "Nội dung",
    titleField: "title",
    searchColumns: ["title"],
    defaultOrder: [{ column: "sort_order" }],
    viewPath: () => "/videos/",
    columns: [
      { name: "title", label: "Tiêu đề" },
      { name: "youtube_url", label: "Link YouTube" },
      { name: "active", label: "Hiển thị", type: "boolean" },
      { name: "sort_order", label: "Thứ tự" },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "youtube_url", label: "Link YouTube", type: "text", required: true, placeholder: "https://www.youtube.com/watch?v=..." },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "active", label: "Hiển thị", type: "boolean", side: true, default: true },
      { name: "sort_order", label: "Thứ tự", type: "number", side: true, default: 0 },
    ],
  },
];

resources.push(
  {
    key: "purchase_orders",
    label: "Phiếu nhập hàng",
    singular: "phiếu nhập",
    group: "Kho hàng",
    titleField: "code",
    searchColumns: ["code", "note"],
    defaultOrder: [{ column: "ordered_at", ascending: false }, { column: "created_at", ascending: false }],
    canDelete: true,
    filters: [
      { name: "status", label: "Trạng thái", options: PURCHASE_STATUS },
      { name: "supplier_id", label: "Nhà cung cấp", relation: "suppliers" },
    ],
    columns: [
      { name: "code", label: "Mã phiếu" },
      { name: "supplier_id", label: "Nhà cung cấp", type: "relation", relation: "suppliers" },
      { name: "total", label: "Tổng tiền", type: "money" },
      { name: "paid_amount", label: "Đã trả", type: "money" },
      { name: "status", label: "Trạng thái", type: "status" },
      { name: "ordered_at", label: "Ngày", type: "date" },
    ],
    fields: [
      { name: "items", label: "Hàng nhập", type: "po_items", help: "Giá nhập chưa gồm phí ship; phí ship và chiết khấu được phân bổ vào giá vốn theo giá trị từng dòng." },
      { name: "note", label: "Ghi chú", type: "textarea" },
      { name: "code", label: "Mã phiếu", type: "readonly", side: true, help: "Tự tạo khi lưu" },
      {
        name: "status",
        label: "Trạng thái",
        type: "select",
        options: PURCHASE_STATUS,
        side: true,
        default: "draft",
        help: "Chọn “Đã nhập kho” và lưu để cộng tồn kho. Phiếu đã nhập chỉ có thể huỷ (tồn kho được trừ lại).",
      },
      { name: "supplier_id", label: "Nhà cung cấp", type: "relation", relation: "suppliers", side: true },
      { name: "ordered_at", label: "Ngày nhập", type: "date", side: true },
      { name: "subtotal", label: "Tiền hàng", type: "readonly", format: "money", side: true },
      { name: "shipping_fee", label: "Phí vận chuyển (₫)", type: "money", side: true },
      { name: "discount", label: "Chiết khấu (₫)", type: "money", side: true },
      { name: "total", label: "Tổng phải trả", type: "readonly", format: "money", side: true },
      { name: "paid_amount", label: "Đã thanh toán (₫)", type: "money", side: true },
      { name: "received_at", label: "Thời điểm nhập kho", type: "readonly", format: "datetime", side: true },
    ],
  },
  {
    key: "suppliers",
    label: "Nhà cung cấp",
    singular: "nhà cung cấp",
    group: "Kho hàng",
    titleField: "name",
    searchColumns: ["name", "phone", "contact_name"],
    defaultOrder: [{ column: "name" }],
    columns: [
      { name: "name", label: "Tên" },
      { name: "contact_name", label: "Người liên hệ" },
      { name: "phone", label: "SĐT" },
      { name: "active", label: "Đang giao dịch", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Tên nhà cung cấp", type: "text", required: true },
      { name: "contact_name", label: "Người liên hệ", type: "text", width: "half" },
      { name: "phone", label: "Số điện thoại", type: "text", width: "half" },
      { name: "email", label: "Email", type: "text", width: "half" },
      { name: "tax_code", label: "Mã số thuế", type: "text", width: "half" },
      { name: "address", label: "Địa chỉ", type: "text" },
      { name: "bank_account", label: "Tài khoản ngân hàng", type: "text" },
      { name: "note", label: "Ghi chú", type: "textarea" },
      { name: "active", label: "Đang giao dịch", type: "boolean", side: true, default: true },
    ],
  },
  {
    key: "stock_movements",
    label: "Thẻ kho",
    singular: "phát sinh kho",
    group: "Kho hàng",
    titleField: "product_name",
    readOnly: true,
    canCreate: false,
    searchColumns: ["product_name", "ref_code", "note"],
    defaultOrder: [{ column: "created_at", ascending: false }],
    filters: [
      { name: "type", label: "Loại", options: MOVEMENT_TYPES },
      { name: "product_id", label: "Sản phẩm", relation: "products" },
    ],
    columns: [
      { name: "created_at", label: "Thời gian", type: "datetime" },
      { name: "product_name", label: "Sản phẩm" },
      { name: "type", label: "Loại", type: "status" },
      { name: "qty", label: "SL", type: "signed" },
      { name: "stock_after", label: "Tồn sau", type: "number" },
      { name: "unit_cost", label: "Đơn giá vốn", type: "money" },
      { name: "ref_code", label: "Chứng từ" },
    ],
    fields: [
      { name: "product_name", label: "Sản phẩm", type: "readonly" },
      { name: "type", label: "Loại", type: "readonly" },
      { name: "qty", label: "Số lượng", type: "readonly", format: "number" },
      { name: "stock_after", label: "Tồn sau", type: "readonly", format: "number" },
      { name: "unit_cost", label: "Đơn giá vốn", type: "readonly", format: "money" },
      { name: "ref_code", label: "Chứng từ", type: "readonly" },
      { name: "note", label: "Ghi chú", type: "readonly" },
      { name: "created_at", label: "Thời gian", type: "readonly", format: "datetime" },
    ],
  },
  {
    key: "price_history",
    label: "Lịch sử giá",
    singular: "thay đổi giá",
    group: "Kho hàng",
    titleField: "product_name",
    readOnly: true,
    canCreate: false,
    searchColumns: ["product_name", "note"],
    defaultOrder: [{ column: "created_at", ascending: false }],
    filters: [{ name: "source", label: "Nguồn", options: PRICE_SOURCES }],
    columns: [
      { name: "created_at", label: "Thời gian", type: "datetime" },
      { name: "product_name", label: "Sản phẩm" },
      { name: "old_price", label: "Giá cũ", type: "money" },
      { name: "new_price", label: "Giá mới", type: "money" },
      { name: "new_cost_price", label: "Giá vốn", type: "money" },
      { name: "source", label: "Nguồn", type: "status" },
      { name: "note", label: "Ghi chú" },
    ],
    fields: [
      { name: "product_name", label: "Sản phẩm", type: "readonly" },
      { name: "old_price", label: "Giá bán cũ", type: "readonly", format: "money", width: "half" },
      { name: "new_price", label: "Giá bán mới", type: "readonly", format: "money", width: "half" },
      { name: "old_compare_at_price", label: "Giá gốc cũ", type: "readonly", format: "money", width: "half" },
      { name: "new_compare_at_price", label: "Giá gốc mới", type: "readonly", format: "money", width: "half" },
      { name: "old_cost_price", label: "Giá vốn cũ", type: "readonly", format: "money", width: "half" },
      { name: "new_cost_price", label: "Giá vốn mới", type: "readonly", format: "money", width: "half" },
      { name: "note", label: "Ghi chú", type: "readonly" },
      { name: "created_at", label: "Thời gian", type: "readonly", format: "datetime" },
    ],
  },
);

/** Hand-built admin pages shown in the sidebar next to the generic resources. */
export const adminPages = [
  { group: "Kho hàng", href: "/admin/inventory/", label: "Tồn kho" },
  { group: "Kho hàng", href: "/admin/inventory/stocktake/", label: "Kiểm kho" },
  { group: "Kho hàng", href: "/admin/pricing/", label: "Cập nhật giá hàng loạt" },
  { group: "Báo cáo", href: "/admin/reports/", label: "Doanh thu & lợi nhuận" },
];

export const getResource = (key: string) => resources.find((r) => r.key === key);

export interface SettingsGroup {
  key: SettingsKey;
  label: string;
  description: string;
  fields: Field[];
}

export const settingsGroups: SettingsGroup[] = [
  {
    key: "general",
    label: "Thông tin chung",
    description: "Logo, hotline, email, mạng xã hội và SEO mặc định.",
    fields: [
      { name: "site_name", label: "Tên website", type: "text", width: "half" },
      { name: "hotline_display", label: "Hotline (hiển thị)", type: "text", width: "half" },
      { name: "hotline", label: "Hotline (số để gọi, không dấu cách)", type: "text", width: "half" },
      { name: "email", label: "Email", type: "text", width: "half" },
      { name: "address", label: "Địa chỉ", type: "text" },
      { name: "working_hours", label: "Giờ làm việc", type: "text", width: "half" },
      { name: "zalo_url", label: "Link Zalo", type: "text", width: "half" },
      { name: "facebook_url", label: "Link Facebook", type: "text", width: "half" },
      { name: "messenger_url", label: "Link Messenger (nút chat ở trang sản phẩm)", type: "text", width: "half" },
      { name: "youtube_url", label: "Link YouTube", type: "text", width: "half" },
      { name: "logo", label: "Logo", type: "image", width: "half" },
      { name: "favicon", label: "Favicon", type: "image", width: "half" },
      { name: "seo_title", label: "SEO title mặc định (trang chủ)", type: "text" },
      { name: "seo_description", label: "SEO description mặc định", type: "textarea" },
      { name: "og_image", label: "Ảnh chia sẻ mạng xã hội (OG image)", type: "image" },
    ],
  },
  {
    key: "header",
    label: "Header & Menu",
    description: "Thanh trên cùng, ô tìm kiếm và menu chính.",
    fields: [
      { name: "topbar_left", label: "Topbar – trái", type: "text", width: "half" },
      { name: "topbar_right", label: "Topbar – phải", type: "text", width: "half" },
      { name: "topbar_center", label: "Topbar – giữa (nút hotline)", type: "text", width: "half" },
      { name: "search_placeholder", label: "Placeholder ô tìm kiếm", type: "text", width: "half" },
      { name: "nav_links", label: "Menu chính", type: "list", fields: LINK_FIELDS, itemLabel: "label" },
    ],
  },
  {
    key: "home",
    label: "Trang chủ",
    description: "Tiêu đề, các khối và FAQ trang chủ. Kệ sản phẩm lấy theo danh mục có bật “Hiện trên trang chủ”.",
    fields: [
      { name: "heading", label: "Tiêu đề H1", type: "text" },
      { name: "intro", label: "Đoạn giới thiệu", type: "textarea" },
      { name: "menu_eyebrow", label: "Khối danh mục – dòng nhỏ", type: "text", width: "half" },
      { name: "menu_title", label: "Khối danh mục – tiêu đề", type: "text", width: "half" },
      { name: "brands_title", label: "Khối thương hiệu – tiêu đề", type: "text", width: "half" },
      { name: "brands_subtitle", label: "Khối thương hiệu – mô tả", type: "text", width: "half" },
      { name: "shelf_limit", label: "Số sản phẩm mỗi kệ", type: "number", width: "half" },
      { name: "news_title", label: "Khối tin tức – tiêu đề", type: "text", width: "half" },
      { name: "faq_title", label: "Tiêu đề FAQ", type: "text" },
      { name: "faqs", label: "Câu hỏi thường gặp", type: "list", fields: FAQ_FIELDS, itemLabel: "question" },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    description: "Thông tin liên hệ, các cột link và bản đồ ở chân trang.",
    fields: [
      { name: "contact_title", label: "Tiêu đề cột liên hệ", type: "text" },
      { name: "contact_html", label: "Nội dung cột liên hệ (cho phép HTML, xuống dòng dùng <br>)", type: "textarea" },
      {
        name: "columns",
        label: "Các cột link",
        type: "list",
        itemLabel: "title",
        fields: [
          { name: "title", label: "Tiêu đề cột", type: "text" },
          { name: "links", label: "Links", type: "list", fields: LINK_FIELDS, itemLabel: "label" },
        ],
      },
      { name: "map_title", label: "Tiêu đề cột bản đồ", type: "text", width: "half" },
      { name: "map_url", label: "Link Google Maps", type: "text", width: "half" },
      { name: "map_image", label: "Ảnh bản đồ", type: "image" },
      { name: "copyright", label: "Dòng copyright", type: "text" },
    ],
  },
  {
    key: "product_page",
    label: "Trang sản phẩm",
    description: "Nút mua ngay, nút chat và khối chính sách bên phải trang chi tiết sản phẩm.",
    fields: [
      { name: "buy_now_text", label: "Nút mua ngay – chữ chính", type: "text", width: "half" },
      { name: "buy_now_sub", label: "Nút mua ngay – chữ phụ", type: "text", width: "half" },
      { name: "chat_text", label: "Nút chat Facebook", type: "text" },
      {
        name: "policies",
        label: "Khối chính sách",
        type: "list",
        itemLabel: "text",
        fields: [
          { name: "icon", label: "Icon", type: "image" },
          { name: "text", label: "Nội dung (cho phép HTML)", type: "textarea" },
        ],
      },
    ],
  },
];

export const getSettingsGroup = (key: string) => settingsGroups.find((g) => g.key === key);
