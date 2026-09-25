# SmartHomeHP v2 – giao diện mới

Bản v2 dùng **chung backend và dữ liệu** với project `dolphinhouse` (cùng Supabase, cùng trang admin `/admin`),
chỉ thay giao diện khách. Design system tạo bằng skill ui-ux-pro-max, xem `design-system/quangdang-cctv/MASTER.md`
(màu, font, quy tắc tương phản, thứ tự các khối trang chủ).

# SmartHomeHP – Next.js + Tailwind + Supabase

Website bán hàng kèm trang quản trị `/admin` để quản lý toàn bộ nội dung. Khung giao diện dựng từ dolphinhouse.vn; dữ liệu hiện tại được nhập từ minhhiepcctv.vn và đổi tên thương hiệu thành "SmartHomeHP".

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền thông tin
npm run dev                  # http://localhost:3000
```

- Website: `/` · Admin: `/admin` (đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Chưa có Supabase (hoặc `DATA_SOURCE=mock`): dữ liệu demo lưu ở `.data/db.json`, ảnh upload vào `public/uploads`.

## Kết nối Supabase (1 lần)

1. Supabase → **SQL Editor** → dán toàn bộ `supabase/schema.sql` → **Run**.
2. `npm run db:seed` — đổ dữ liệu mẫu + tạo bucket ảnh `media` (chạy lại an toàn, không ghi đè dữ liệu đã sửa).
3. Bỏ dòng `DATA_SOURCE=mock` trong `.env.local`, khởi động lại `npm run dev`.

Mọi truy vấn chạy phía server bằng secret key; bảng bật RLS và không có policy public, nên publishable key không đọc/ghi được gì.

## Nhập lại dữ liệu từ minhhiepcctv.vn

```bash
python3 scripts/minhhiep/crawl.py                                              # 1. quét site → scripts/minhhiep/raw.json
set -a; source .env.local; set +a; python3 scripts/minhhiep/transform.py        # 2. chuyển đổi → src/data/scraped.json + tải ảnh
node --env-file=.env.local --import tsx scripts/minhhiep/upload-images.ts      # 3. đẩy ảnh lên Supabase Storage
npm run db:seed -- --reset                                                     # 4. THAY TOÀN BỘ sản phẩm/nội dung/cài đặt
```

`--reset` xoá toàn bộ sản phẩm, danh mục, thương hiệu, banner, tin tức, trang, video và ghi đè cài đặt (đơn hàng và liên hệ được giữ lại). Link cũ dạng `/ten-san-pham.html` tự chuyển hướng 301 sang link mới.

## Kho hàng, nhập hàng & giá (migration 002)

Chạy `supabase/migrations/002_inventory_pricing.sql` trong Supabase → SQL Editor **trước khi deploy** code có phần kho.

- **Phiếu nhập hàng**: Nháp → Đã nhập kho (cộng tồn, tính giá vốn bình quân, phí ship/chiết khấu phân bổ theo giá trị) → Huỷ (trừ lại tồn).
- **Đơn hàng**: chuyển sang Đã xác nhận / Đang giao / Hoàn thành → trừ kho & chốt giá vốn; Huỷ → hàng về kho.
- **Kiểm kho** (`/admin/inventory/stocktake/`): nhập số đếm thực tế, chênh lệch ghi vào thẻ kho. Dùng để khai báo tồn đầu kỳ.
- **Tồn kho** (`/admin/inventory/`), **Thẻ kho**, **Lịch sử giá**, **Cập nhật giá hàng loạt** (`/admin/pricing/`), **Báo cáo** (`/admin/reports/`).
- Tồn kho chỉ thay đổi qua hàm SQL `apply_stock_movement` (khoá dòng, không lệch số khi thao tác đồng thời).

## Deploy Vercel

1. Đẩy code lên GitHub → Vercel **Add New Project** → import repo (Framework: Next.js).
2. **Environment Variables**: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`. **Không** đặt `DATA_SOURCE=mock` trên Vercel.
3. Đổi domain: Vercel → Settings → Domains → thêm `dolphinhouse.vn`, rồi cập nhật `NEXT_PUBLIC_SITE_URL`.

## Admin quản lý được gì

| Nhóm | Mục |
| --- | --- |
| Bán hàng | Đơn hàng (từ trang thanh toán), Liên hệ/Tư vấn (từ form liên hệ) |
| Sản phẩm | Sản phẩm (giá, giá gốc, ảnh, mô tả, SEO…), Danh mục (cha/con, banner, hiện trang chủ), Thương hiệu |
| Nội dung | Banner trang chủ, Tin tức, Chuyên mục tin, Trang nội dung (giới thiệu, chính sách, liên hệ… + FAQ), Videos |
| Giao diện & cài đặt | Thông tin chung/SEO, Header & menu, Trang chủ (tiêu đề, FAQ), Footer, Trang sản phẩm (nút mua, khối chính sách) |

Thêm trường/mục mới: khai báo trong `src/lib/admin/config.ts` (form + danh sách tự sinh) và thêm cột tương ứng trong `supabase/schema.sql`.

## Cấu trúc

```
src/app/(site)/        Giao diện khách (URL giữ nguyên như site cũ: /san-pham/x/, /danh-muc/x/, /<bai-viet>/)
src/app/admin/         Trang quản trị + server actions
src/lib/db/            Lớp dữ liệu: mock (JSON) ↔ Supabase, cùng một interface
src/lib/admin/config.ts  Khai báo mọi mục quản trị
src/data/              Dữ liệu mẫu (scraped.json lấy từ site cũ bởi scripts/scrape-seed.py)
supabase/schema.sql    Schema database
```
