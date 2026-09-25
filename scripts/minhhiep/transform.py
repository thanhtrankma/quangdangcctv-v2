"""Step 2 of the minhhiepcctv.vn import: raw.json -> src/data/scraped.json (the app's seed data),
downloading every referenced image into scripts/minhhiep/images/ (uploaded by upload-images.ts).
Also renames the brand to "SmartHomeHP" in all text.
Run: python3 scripts/minhhiep/transform.py"""
import html, json, os, pathlib, re, subprocess, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
IMG_DIR = HERE / "images"
BRAND = "SmartHomeHP"
BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "media")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
if not SUPABASE_URL:
    sys.exit("SUPABASE_URL missing (run with: set -a; source .env.local; set +a)")
PUBLIC_BASE = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/import"
MAX_W = 1600

raw = json.loads((HERE / "raw.json").read_text())

# ---------------------------------------------------------------- images
wanted = {}  # absolute source url -> storage key


def img(src):
    """Register an image for download; return its future public URL."""
    if not src or src.startswith("data:"):
        return ""
    src = html.unescape(src.strip()).replace("/origianl/", "/original/")  # typo in the old site's og:image links
    if src.startswith("//"):
        src = "https:" + src
    elif src.startswith("/"):
        src = "https://minhhiepcctv.vn" + src
    if not src.startswith("http"):
        return src
    u = urllib.parse.urlparse(src)
    key = (u.netloc.replace("www.", "").split(".")[0] + u.path).replace("/original/", "/")
    key = re.sub(r"[^A-Za-z0-9._/-]", "-", urllib.parse.unquote(key))
    wanted[src] = key
    return f"{PUBLIC_BASE}/{key}"


def download(item):
    src, key = item
    dest = IMG_DIR / key
    if dest.exists():
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(urllib.parse.quote(src, safe=":/?=&%"), headers={"User-Agent": "Mozilla/5.0"})
        dest.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    except Exception as e:
        print("  ! image", src, e, file=sys.stderr)
        return False
    # Heavy PNG photos are stored as JPEG next to the requested key (see jpeg_key()).
    if dest.suffix.lower() == ".png" and dest.stat().st_size > 1_000_000:
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", str(dest), "--out", str(dest) + ".jpg"], capture_output=True)
        if pathlib.Path(str(dest) + ".jpg").exists():
            dest.write_bytes(b"")  # keep a marker so re-runs skip the download
            dest = pathlib.Path(str(dest) + ".jpg")
    # Banner originals are ~8000px wide; shrink anything huge (macOS sips, in place).
    if dest.suffix.lower() in (".jpg", ".jpeg", ".png") and dest.stat().st_size > 400_000:
        subprocess.run(["sips", "--resampleWidth", str(MAX_W), str(dest)], capture_output=True)
    return True


# ---------------------------------------------------------------- text helpers
BRAND_RE = re.compile(r"(?i)c[ôo]ng\s+ty\s+minh\s+hi[ệe]p\s+protech|minh\s+hi[ệe]p\s+pro\s*tech|minhhiep\s*protech|minh\s+hi[ệe]p(?=[\s,.!?:;)<\x22]|$)|minhhiepcctv(?:\.vn|\.com)?")


def rebrand(s):
    return BRAND_RE.sub(BRAND, s or "")


def rebrand_html(h):
    """Rename the brand in text nodes and alt/title attributes, never inside href/src."""
    parts = re.split(r"(<[^>]+>)", h)
    for i, p in enumerate(parts):
        if p.startswith("<"):
            parts[i] = re.sub(r'(alt|title)="([^"]*)"', lambda m: f'{m.group(1)}="{rebrand(m.group(2))}"', p)
        else:
            parts[i] = rebrand(p)
    return "".join(parts)


# Categories whose name/slug carried the old brand.
CAT_RENAMES = {"bo-luu-dien-ups-mhpro-bo-luu-dien-minh-hiep-protech": ("bo-luu-dien-ups-mhpro", "Bộ lưu điện UPS MHPRO")}
for c in raw["categories"]:
    if c["slug"] in CAT_RENAMES:
        c["old_slug"], (c["slug"], c["name"]) = c["slug"], CAT_RENAMES[c["slug"]]
    if c["parent"] in CAT_RENAMES:
        c["parent"] = CAT_RENAMES[c["parent"]][0]

cat_by_slug = {c["slug"]: c for c in raw["categories"]}
cat_by_slug.update({old: cat_by_slug[new] for old, (new, _) in CAT_RENAMES.items()})
product_slugs = {p["slug"] for p in raw["products"]}
article_slugs = {a["slug"] for a in raw["articles"]}
page_slug_map = {p["slug"]: ("gioi-thieu" if p["slug"] == "gioi-thieu" else p["slug"]) for p in raw["pages"]}
page_slug_map["tuyen-dung-minh-hiep-protech"] = "tuyen-dung"
page_slug_map["gioithieu"] = "gioi-thieu"


def cat_path(slug):
    chain = []
    while slug:
        chain.insert(0, slug)
        slug = cat_by_slug[slug]["parent"]
    return "/danh-muc/" + "/".join(chain) + "/"


def new_url(old):
    """Map an old minhhiepcctv link to this app's routes."""
    m = re.match(r"^(?:https?://(?:www\.)?minhhiepcctv\.(?:vn|com))?/?([^?#]*?)(?:\.html)?/?([?#].*)?$", old)
    if not m:
        return old
    slug = m.group(1).strip("/")
    if slug == "":
        return "/"
    if slug in cat_by_slug:
        return cat_path(cat_by_slug[slug]["slug"])
    if slug in product_slugs:
        return f"/san-pham/{slug}/"
    if slug in page_slug_map:
        return f"/{page_slug_map[slug]}/"
    if slug in article_slugs:
        return f"/{slug}/"
    if slug in dict(raw["news_categories"]):
        return f"/danh-muc-tin-tuc/{slug}/"
    if slug in ("lien-he", "tin-tuc", "gio-hang"):
        return f"/{slug}/"
    return old


def img_tag(m):
    alt = re.search(r'alt="([^"]*)"', m.group(0))
    return f'<img src="{img(m.group(1))}" alt="{alt.group(1) if alt else ""}">'


def clean_html(h):
    if not h:
        return ""
    h = re.sub(r"<(script|style|iframe[^>]*googletagmanager)[^>]*>.*?</\1>", "", h, flags=re.S | re.I)
    h = re.sub(r"<!--.*?-->", "", h, flags=re.S)
    # WordPress galleries/figures -> plain images + caption paragraphs (editable in the admin editor)
    h = re.sub(r"<figure\b[^>]*>\s*(<table.*?</table>)\s*</figure>", r"\1", h, flags=re.S)

    def fig(m):
        imgs = re.findall(r"<img\b[^>]*>", m.group(0))
        cap = re.search(r"<figcaption[^>]*>(.*?)</figcaption>", m.group(0), re.S)
        if not imgs:
            return m.group(0)
        return "".join(imgs) + (f"<p><em>{cap.group(1).strip()}</em></p>" if cap and len(imgs) == 1 else "")

    for _ in range(3):  # nested gallery figures
        h = re.sub(r"<figure\b(?:(?!<figure\b).)*?</figure>", fig, h, flags=re.S)
    h = re.sub(r"</?(span|font|div|section|article|o:p)\b[^>]*>", "", h, flags=re.I)
    h = re.sub(r'\s(style|class|id|width|height|srcset|sizes|data-[\w-]+|loading|decoding|align|border|dir|lang)=("[^"]*"|\'[^\']*\')', "", h)
    h = re.sub(r'<img\b[^>]*?src="([^"]+)"[^>]*>', img_tag, h)
    h = re.sub(r'href="([^"]+)"', lambda m: f'href="{new_url(html.unescape(m.group(1)))}"', h)
    h = re.sub(r"<p>(\s|&nbsp;|<br\s*/?>)*</p>", "", h)
    h = re.sub(r"\n\s*\n+", "\n", h)
    return rebrand_html(h.strip())


# ---------------------------------------------------------------- categories
PALETTE = ["#e03232", "#2563eb", "#ef8f1c", "#0e9488", "#7c3aed", "#db2777", "#0f5b5d", "#65a30d"]
cats_out, top_i = [], -1
children = lambda s: [c for c in raw["categories"] if c["parent"] == s]
for c in raw["categories"]:
    if c["parent"] is None:
        top_i += 1
    kids = children(c["slug"])
    cats_out.append({
        "id": c["slug"], "slug": c["slug"], "name": rebrand(c["name"]), "parent_id": c["parent"],
        "tagline": rebrand(", ".join(k["name"] for k in kids[:3])) if c["parent"] is None else "",
        "description": clean_html(c.get("description", "")) if len(re.sub(r"<[^>]+>", "", c.get("description", "")).strip()) > 40 else "",
        "banner": "", "color": PALETTE[top_i % len(PALETTE)], "sort_order": c["order"],
        "show_on_home": c["parent"] is None, "seo_title": "", "seo_description": "",
    })

depth = {}
for c in raw["categories"]:
    d, s = 0, c["parent"]
    while s:
        d, s = d + 1, cat_by_slug[s]["parent"]
    depth[c["slug"]] = d

# Each product goes in the most specific category that lists it.
home_cat, listing_pos = {}, {}
for c in sorted(raw["categories"], key=lambda c: (-depth[c["slug"]], c["order"])):
    for i, p in enumerate(c["products"]):
        home_cat.setdefault(p, c["slug"])
        listing_pos.setdefault(p, i)

# ---------------------------------------------------------------- brands (detected from product names)
KNOWN_BRANDS = [
    "Hikvision", "Ezviz", "Hilook", "Imou", "Dahua", "KBVision", "TP-Link", "Ruijie", "Reyee", "Ubiquiti", "UniFi", "Totolink",
    "Tenda", "Mercusys", "Ugreen", "Vention", "Seagate", "Western Digital", "Sandisk", "Hiksemi", "Kingston", "Samsung", "LG",
    "Sony", "Toshiba", "Panasonic", "Philips", "Dell", "HP", "Asus", "Acer", "Lenovo", "MSI", "AOC", "Viewsonic", "SingPC",
    "Logitech", "Rapoo", "Forter", "Newmen", "Advantech", "ZKTeco", "Canon", "Coex", "Karofi", "Kangaroo", "Takawa",
    "Electrolux", "Hitachi", "Ariston", "Gree", "Daikin", "Tefal", "Fissler", "Elmich", "Goldsun", "Whirlpool", "Sunhouse",
    "Smartcook", "Bluestone", "Canaval", "Daikiosan", "Phong Lan", "Qinlian", "Zidli", "MHPRO", "Aqara", "Tuya", "Veggieg",
]


def detect_brand(name):
    for b in KNOWN_BRANDS:
        if re.search(r"(?<![\w-])" + re.escape(b) + r"(?![\w-])", name, re.I):
            return {"UniFi": "Ubiquiti", "Reyee": "Ruijie"}.get(b, b)
    return None


def slugify(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    return re.sub(r"[^a-z0-9]+", "-", "".join(ch for ch in s if unicodedata.category(ch) != "Mn").lower()).strip("-")


# ---------------------------------------------------------------- products
products_out, brand_count = [], {}
for p in raw["products"]:
    brand = detect_brand(p["name"])
    if brand:
        brand_count[brand] = brand_count.get(brand, 0) + 1
    summary = "".join(f"<li>{html.escape(rebrand(s))}</li>" for s in p["summary"])
    short = (f"<ul>{summary}</ul>" if summary else "") + (f"<p><strong>Bảo hành:</strong> {html.escape(p['warranty'])}</p>" if p["warranty"] else "")
    products_out.append({
        "id": p["slug"], "slug": p["slug"], "name": rebrand(p["name"]), "sku": "",
        "price": p["price"], "compare_at_price": p["market"] if p["market"] > p["price"] else None,
        "variant_label": "", "images": [u for u in (img(s) for s in p["images"]) if u],
        "category_id": home_cat.get(p["slug"]), "brand_id": slugify(brand) if brand else None,
        "short_description": short, "description": clean_html(p["description"]),
        "status": "published", "featured": bool(p["market"] and p["market"] > p["price"] * 1.3),
        "sort_order": listing_pos.get(p["slug"], 999), "seo_title": "", "seo_description": "",
    })

top_brands = sorted(brand_count, key=lambda b: -brand_count[b])
brands_out = [{
    "id": slugify(b), "slug": slugify(b), "name": b, "tagline": f"{brand_count[b]} sản phẩm", "logo": "", "description": "",
    "featured": i < 10, "sort_order": i + 1,
} for i, b in enumerate(top_brands)]

# ---------------------------------------------------------------- news
post_cats = [{"id": s, "slug": s, "name": n, "description": "", "sort_order": i + 1} for i, (s, n) in enumerate(raw["news_categories"])]
def cover_of(a):
    """og:image, unless it is just the old site logo; then the first image in the article."""
    if a["cover"] and "/assets/logo/" not in a["cover"]:
        return a["cover"]
    m = re.search(r'<img[^>]+src="([^"]+)"', a["content"])
    return m.group(1) if m else ""


posts_out = [{
    "id": a["slug"], "slug": a["slug"], "title": rebrand(a["title"]), "excerpt": rebrand(a["excerpt"])[:300],
    "cover": img(cover_of(a)), "content": clean_html(a["content"]), "category_id": a["category"],
    "published_at": a["date"], "views": a["views"], "status": "published", "seo_title": "", "seo_description": "",
} for a in raw["articles"]]

# ---------------------------------------------------------------- pages
pages_out = []
for p in raw["pages"]:
    content = clean_html(p["content"])
    if not re.sub(r"<[^>]+>", "", content).strip() and "<img" not in content:
        continue
    pages_out.append({"id": page_slug_map[p["slug"]], "slug": page_slug_map[p["slug"]], "title": rebrand(p["title"]),
                      "content": content, "template": "default", "faqs": [], "status": "published", "seo_title": "", "seo_description": ""})
# About page: the old one is a separate WordPress landing page, rebuilt here from its text.
about = raw.get("about_text", "")
projects = re.search(r"khắp 3 miền (.*?) VỊ TRÍ", about)
pages_out.append({"id": "gioi-thieu", "slug": "gioi-thieu", "title": f"Giới thiệu {BRAND}", "template": "default", "status": "published",
                  "seo_title": "", "seo_description": "", "content": f"""<h2>Lắp đặt camera số 1 Hải Phòng</h2>
<p><strong>{BRAND}</strong> chuyên dự án, giải pháp CNTT: lắp đặt hệ thống camera, mạng LAN, nhà thông minh, laptop và PC văn phòng.</p>
<h2>Sản phẩm hướng đến</h2>
<p>{BRAND} hướng đến sản phẩm giải pháp cho các nhà máy, KCN, văn phòng để nâng cao, đảm bảo an ninh, quy trình sản xuất, đồng thời cung cấp thiết bị đáp ứng nhu cầu mạng, máy tính, CCTV.</p>
<h3>Các dự án chức năng</h3>
<ul><li>Camera giám sát</li><li>Cửa báo từ, cửa báo động</li><li>Bộ lưu điện, camera ở khu vực không có điện lưới</li><li>Chuông báo động</li><li>Máy tính, laptop văn phòng</li><li>Mạng LAN, thiết bị mạng</li><li>Nhà thông minh</li></ul>
<h2>Về chúng tôi</h2>
<p>Với hơn 10 năm trong lĩnh vực IT, CCTV, <strong>{BRAND}</strong> đáp ứng mọi nhu cầu của khách hàng.</p>
<ul><li><strong>Nhanh chóng:</strong> đội ngũ nhân viên dày dặn kinh nghiệm, luôn đảm bảo thời hạn dự án được giao.</li>
<li><strong>An toàn:</strong> đảm bảo an toàn khi thi công bất cứ công trình, dự án nào.</li>
<li><strong>Hậu mãi:</strong> bảo hành hậu mãi nhanh chóng, xử lý sự cố khắc phục nhanh nhất có thể.</li>
<li><strong>Giải pháp:</strong> luôn lắng nghe, đưa ra những giải pháp tốt nhất, tiết kiệm nhất.</li></ul>
<h2>Dự án đã thực hiện</h2>
<p>Chúng tôi đã đồng hành cùng các dự án lớn nhỏ khắp 3 miền: {html.escape(projects.group(1)) if projects else ""}.</p>
<p>Xem thêm hình ảnh tại trang <a href="/du-an-tieu-bieu/">Dự án tiêu biểu</a>.</p>
<h2>Liên hệ</h2>
<p><strong>Địa chỉ:</strong> 79 Phương Lưu, Đông Hải 1, Hải An, Hải Phòng<br><strong>Hotline:</strong> 091.7799.091</p>""", "faqs": []})
pages_out.append({"id": "lien-he", "slug": "lien-he", "title": "Liên hệ", "template": "contact", "faqs": [], "status": "published",
                  "seo_title": "", "seo_description": "",
                  "content": f"""<h2>Liên hệ {BRAND}</h2>
<p><strong>Showroom:</strong> 79 Phương Lưu, Đông Hải 1, Hải An, Hải Phòng (<a href="https://maps.app.goo.gl/kurNK7z9deiqACcb9">xem bản đồ</a>)</p>
<p><strong>Hotline:</strong> 0917 799 091 – Quốc Khánh</p>
<h3>Bán hàng trực tuyến – hỗ trợ Hà Nội/toàn quốc (Zalo)</h3>
<ul><li>0772 236 529 – Thanh Nhàn</li><li>0981 791 129 – Công Hoà</li><li>0936 921 299 – Nguyễn Hà</li></ul>
<p>Để lại thông tin bên dưới, {BRAND} sẽ liên hệ tư vấn cho bạn sớm nhất.</p>"""})

banners_out = [{
    "id": f"home-hero-{i + 1}", "title": t, "eyebrow": BRAND, "subtitle": s, "image": img(src), "image_mobile": "",
    "link": new_url(link) if "minhhiepcctv" in link else link, "button_text": "Xem ngay →", "position": "home_hero",
    "active": True, "sort_order": i + 1,
} for i, ((link, src), (t, s)) in enumerate(zip(raw["slides"], [
    ("Camera an ninh chính hãng", "Hikvision, Ezviz – lắp đặt trọn gói, bảo hành tận nơi."),
    ("Thiết bị điện máy chính hãng", "Hiện đại – tiện nghi – bền bỉ cho mọi gia đình."),
    ("Giải pháp wifi phủ sóng", "Wifi mesh, access point cho nhà ở, văn phòng, nhà xưởng."),
    ("Bộ lưu điện UPS & năng lượng mặt trời", "Nguồn điện ổn định cho camera, máy tính, thiết bị mạng."),
    ("Máy tính & phụ kiện", "PC văn phòng, gaming, đồ hoạ – cấu hình theo nhu cầu."),
] * 4))]

home_faqs = [{"question": rebrand(q), "answer": clean_html(a)} for q, a in raw["home_faq"]]

print(f"images to fetch: {len(wanted)}")
with ThreadPoolExecutor(12) as ex:
    ok = sum(ex.map(download, wanted.items()))
print(f"images downloaded: {ok}/{len(wanted)}")
missing = {f"{PUBLIC_BASE}/{k}" for s, k in wanted.items() if not (IMG_DIR / k).exists()}
# PNGs converted to JPEG during download: point URLs at the .jpg file.
converted = {f"{PUBLIC_BASE}/{k}": f"{PUBLIC_BASE}/{k}.jpg" for k in wanted.values() if (IMG_DIR / (k + ".jpg")).exists()}


def drop_missing(h):
    return re.sub(r'<img src="([^"]+)"[^>]*>', lambda m: "" if m.group(1) in missing else m.group(0), h)


for p in products_out:
    p["images"] = [u for u in p["images"] if u not in missing]
    p["description"] = drop_missing(p["description"])
for a in posts_out:
    a["cover"] = "" if a["cover"] in missing else a["cover"]
    a["content"] = drop_missing(a["content"])
for p in pages_out:
    p["content"] = drop_missing(p["content"])

def swap(v):
    if isinstance(v, str):
        for a, b in converted.items():
            if a in v:
                v = v.replace(a + '"', b + '"') if v != a else b
        return v
    if isinstance(v, list):
        return [swap(x) for x in v]
    if isinstance(v, dict):
        return {k: swap(x) for k, x in v.items()}
    return v


products_out, posts_out, pages_out, banners_out = swap(products_out), swap(posts_out), swap(pages_out), swap(banners_out)

out = {"categories": cats_out, "brands": brands_out, "products": products_out, "post_categories": post_cats,
       "posts": posts_out, "pages": pages_out, "banners": [b for b in banners_out if b["image"] not in missing],
       "home_faqs": home_faqs}
(ROOT / "src/data/scraped.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print({k: len(v) for k, v in out.items()})
