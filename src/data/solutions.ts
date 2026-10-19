/** Starter solutions (from the SmartHomeHP brochure). Edited in Admin → Nội dung → Giải pháp once migration 003 is run. */
import type { Solution } from "@/lib/types";

const img = (n: string) => `/assets/images/solutions/${n}.jpg`;
const now = "2026-10-19T00:00:00.000Z";

const base = (s: Omit<Solution, "id" | "status" | "faqs" | "show_on_home" | "created_at" | "updated_at"> & Partial<Solution>): Solution => ({
  id: s.slug,
  status: "published",
  faqs: [],
  show_on_home: true,
  created_at: now,
  updated_at: now,
  ...s,
});

export const seedSolutions: Solution[] = [
  base({
    slug: "he-thong-mang-camera",
    title: "Hệ thống mạng & camera",
    summary: "Camera an ninh, wifi phủ sóng và hệ thống mạng ổn định cho nhà ở, cửa hàng, văn phòng và nhà xưởng.",
    icon: "cctv",
    cover: img("mang-camera"),
    highlights: [{ text: "Camera an ninh" }, { text: "Hệ thống mạng WiFi" }, { text: "Giải pháp Ruijie chính hãng" }, { text: "Giám sát mọi lúc, mọi nơi" }],
    content:
      "<h2>Giải pháp an ninh và kết nối trọn gói</h2><p>Chúng tôi khảo sát mặt bằng, xác định điểm mù và vùng phủ sóng, sau đó đề xuất số lượng camera, đầu ghi, ổ cứng lưu trữ cùng hệ thống wifi phù hợp với diện tích và ngân sách.</p><ul><li>Camera Hikvision, Ezviz: trong nhà, ngoài trời, quay quét, có màu ban đêm</li><li>Wifi Mesh, Access Point Ruijie, TP-Link cho nhà nhiều tầng và văn phòng</li><li>Đi dây âm tường, tủ mạng gọn gàng, cấu hình xem từ xa trên điện thoại</li></ul>",
    related_categories: [{ category_id: "camera-an-ninh" }, { category_id: "thiet-bi-mang" }],
    sort_order: 1,
  }),
  base({
    slug: "dieu-hoa",
    title: "Điều hòa",
    summary: "Tư vấn công suất, cung cấp và lắp đặt điều hòa chính hãng, tối ưu hiệu suất và tiết kiệm điện.",
    icon: "snowflake",
    cover: img("dieu-hoa"),
    highlights: [{ text: "Tư vấn – cung cấp" }, { text: "Lắp đặt chuyên nghiệp" }, { text: "Tối ưu hiệu suất" }, { text: "Bảo hành chính hãng" }],
    content:
      "<h2>Chọn đúng công suất, lắp đúng kỹ thuật</h2><p>Công suất điều hòa được tính theo diện tích, hướng nắng và số người sử dụng. Chúng tôi tư vấn dòng máy inverter phù hợp, thi công đường ống đúng tiêu chuẩn và vệ sinh, bảo dưỡng định kỳ.</p>",
    related_categories: [],
    sort_order: 2,
  }),
  base({
    slug: "smart-home-nha-thong-minh",
    title: "Smart Home – nhà thông minh",
    summary: "Điều khiển thiết bị từ xa, tự động hóa theo ngữ cảnh, khóa cửa và chuông hình thông minh.",
    icon: "house",
    cover: img("smart-home"),
    highlights: [{ text: "Điều khiển thiết bị từ xa" }, { text: "Tự động hóa theo ngữ cảnh" }, { text: "An toàn – tiện nghi" }, { text: "Tiết kiệm điện – nâng tầm cuộc sống" }],
    content:
      "<h2>Ngôi nhà vận hành theo thói quen của bạn</h2><p>Công tắc, rèm, đèn, điều hòa, khóa cửa và chuông hình được kết nối về một ứng dụng duy nhất. Thiết lập kịch bản như “Về nhà”, “Đi ngủ”, “Vắng nhà” để mọi thứ tự động vận hành.</p>",
    related_categories: [{ category_id: "thiet-bi-nha-thong-minh" }],
    sort_order: 3,
  }),
  base({
    slug: "dien-mat-troi",
    title: "Điện mặt trời",
    summary: "Tư vấn, thiết kế và thi công hệ điện mặt trời, bộ lưu điện cho gia đình và doanh nghiệp.",
    icon: "sun",
    cover: img("dien-mat-troi"),
    highlights: [{ text: "Tư vấn – thiết kế – thi công" }, { text: "Giải pháp tiết kiệm điện" }, { text: "Bền vững – hiệu quả" }, { text: "Bảo trì, bảo hành" }],
    content:
      "<h2>Giảm hóa đơn điện, chủ động nguồn năng lượng</h2><p>Khảo sát mái, tính sản lượng theo nhu cầu sử dụng và đề xuất hệ hòa lưới, hybrid có lưu trữ hoặc độc lập. Kết hợp bộ lưu điện để camera và thiết bị quan trọng hoạt động cả khi mất điện.</p>",
    related_categories: [{ category_id: "bo-luu-dien-ups" }],
    sort_order: 4,
  }),
  base({
    slug: "noi-that",
    title: "Nội thất",
    summary: "Thiết kế và thi công nội thất trọn gói, tối ưu công năng, phong cách hiện đại.",
    icon: "sofa",
    cover: img("noi-that"),
    highlights: [{ text: "Thiết kế nội thất" }, { text: "Thi công trọn gói" }, { text: "Tối ưu công năng" }, { text: "Phong cách hiện đại" }],
    content:
      "<h2>Nội thất đồng bộ với hệ thống thông minh</h2><p>Bố trí nội thất được tính toán cùng vị trí camera, wifi, công tắc thông minh ngay từ đầu, giúp không gian gọn gàng và không phải đục sửa về sau.</p>",
    related_categories: [],
    sort_order: 5,
  }),
  base({
    slug: "xay-nha-tron-goi",
    title: "Xây nhà trọn gói",
    summary: "Tư vấn thiết kế, thi công trọn gói, giám sát chất lượng và bàn giao đúng tiến độ.",
    icon: "building",
    cover: img("xay-nha-tron-goi"),
    highlights: [{ text: "Tư vấn thiết kế" }, { text: "Thi công trọn gói" }, { text: "Giám sát chất lượng" }, { text: "Bàn giao đúng tiến độ" }],
    content:
      "<h2>Một đầu mối từ phần thô đến hoàn thiện</h2><p>Hạ tầng điện nhẹ, camera, mạng, điện mặt trời và nhà thông minh được thiết kế cùng bản vẽ kiến trúc, giúp tiết kiệm chi phí và đảm bảo thẩm mỹ khi bàn giao.</p>",
    related_categories: [],
    sort_order: 6,
  }),
];
