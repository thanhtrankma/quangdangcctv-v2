"""Crawl minhhiepcctv.vn into scripts/minhhiep/raw.json (step 1 of the import).
Run: python3 scripts/minhhiep/crawl.py"""
import html, json, pathlib, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://minhhiepcctv.vn"
OUT = pathlib.Path(__file__).parent / "raw.json"
CACHE = pathlib.Path(__file__).parent / ".cache"
CACHE.mkdir(exist_ok=True)


def get(url):
    if url.startswith("/"):
        url = BASE + url
    key = CACHE / re.sub(r"[^a-zA-Z0-9._-]", "_", url.replace(BASE, ""))[:200]
    if key.exists():
        return key.read_text()
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            body = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
            key.write_text(body)
            return body
        except Exception as e:
            err = e
    print("  ! failed", url, err, file=sys.stderr)
    return ""


def txt(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s or "")).replace("\xa0", " ").strip()


def squash(s):
    return re.sub(r"\s+", " ", txt(s)).strip()


def inner(h, start_pat, tag="div"):
    m = re.search(start_pat, h)
    if not m:
        return ""
    i, depth = m.end(), 1
    for t in re.compile(r"<(/?)%s\b[^>]*>" % tag).finditer(h, i):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return h[i:t.start()].strip()
    return h[i:].strip()


def slug_of(url):
    return re.sub(r"^https?://minhhiepcctv\.vn/", "", url).replace(".html", "").strip("/")


def money(s):
    d = re.sub(r"\D", "", s or "")
    return int(d) if d else 0


home = get("/")

# ---------- category tree (3 levels) from the mega menu ----------
cats, order = [], 0
menu = inner(home, r'<div class="header-menu-holder">')
for top in re.finditer(r'<div class="item item-no-cat-4">\s*<a href="([^"]+)">\s*<img[^>]*src="([^"]+)"[^>]*>\s*<span class="cat-title">([^<]+)</span>(.*?)(?=<div class="item item-no-cat-4">|$)', menu, re.S):
    t_slug, thumb, t_name, body = slug_of(top.group(1)), top.group(2), squash(top.group(3)), top.group(4)
    order += 1
    cats.append({"slug": t_slug, "name": t_name, "parent": None, "thumb": thumb, "order": order})
    for box in re.findall(r'<div class="box_cate">(.*?)(?=<div class="box_cate">|</div>\s*</div>\s*</div>\s*$)', body, re.S):
        m2 = re.search(r'<a href="([^"]+)" class="cat-2">([^<]+)</a>', box)
        if not m2:
            continue
        s2 = slug_of(m2.group(1))
        if s2 != t_slug and not any(c["slug"] == s2 for c in cats):
            order += 1
            cats.append({"slug": s2, "name": squash(m2.group(2)), "parent": t_slug, "order": order})
        for u3, n3 in re.findall(r'<a href="([^"]+)" class="cat-3">([^<]+)</a>', box):
            s3 = slug_of(u3)
            if s3 in (s2, t_slug) or any(c["slug"] == s3 for c in cats):
                continue
            order += 1
            cats.append({"slug": s3, "name": squash(n3), "parent": s2, "order": order})
print("categories:", len(cats))

# ---------- category pages: description + product listing (all pages) ----------
def crawl_category(c):
    items, page, desc = [], 1, ""
    while True:
        h = get(f"/{c['slug']}.html" + (f"?page={page}" if page > 1 else ""))
        if not h:
            break
        if page == 1:
            desc = inner(h, r'<div class="js-static-content static-content overflow-hidden">')
            c["extra_children"] = [slug_of(u) for u in re.findall(r'<li>&raquo; <a href="([^"]+)">', h)]
        found = re.findall(r'<div class="p-item">\s*<a href="([^"]+)" class="p-img">', h)
        new = [slug_of(u) for u in found if slug_of(u) not in items]
        if not new:
            break
        items += new
        if f"page={page + 1}" not in h:
            break
        page += 1
    c["description"] = desc
    c["products"] = items
    return c

with ThreadPoolExecutor(8) as ex:
    cats = list(ex.map(crawl_category, cats))
all_products = sorted({p for c in cats for p in c["products"]})
print("distinct products:", len(all_products))

# ---------- product detail ----------
def crawl_product(slug):
    h = get(f"/{slug}.html")
    if not h or "pro-name" not in h:
        return None
    name = squash(re.search(r'<h1 class="pro-name[^"]*">(.*?)</h1>', h, re.S).group(1))
    gallery = inner(h, r'id="js-img-gallery">')
    imgs = re.findall(r'<img src="([^"]+)"', gallery) or re.findall(r'id="js-big-img">\s*<a href="([^"]+)"', h)
    price = re.search(r'class="pd-price js-variant-price">(.*?)<', h, re.S)
    market = re.search(r'class="pd-market-price">(.*?)<', h, re.S)
    warranty = re.search(r"<p>Bảo hành:\s*(.*?)</p>", h)
    summary = [squash(s).lstrip("–- ").strip() for s in re.findall(r'<i class="fa fa-check-circle"[^>]*>\s*</i>(.*?)</span>', inner(h, r'<div class="pro-summary-group">'), re.S)]
    desc = inner(h, r'<p class="title">MÔ TẢ SẢN PHẨM</p>\s*<div class="js-static-content[^"]*"[^>]*>')
    spec = inner(h, r'<p class="title">THÔNG SỐ KỸ THUẬT</p>\s*<div[^>]*>')
    crumbs = [slug_of(u) for u in re.findall(r'<a href="(https://minhhiepcctv\.vn/[^"]+)" itemprop="item"', h)]
    return {
        "slug": slug, "name": name, "images": list(dict.fromkeys(imgs)),
        "price": money(price.group(1)) if price else 0, "market": money(market.group(1)) if market else 0,
        "warranty": squash(warranty.group(1)) if warranty else "", "summary": [s for s in summary if s],
        "description": desc, "spec": spec, "crumbs": crumbs,
    }

with ThreadPoolExecutor(8) as ex:
    products = [p for p in ex.map(crawl_product, all_products) if p]
print("products parsed:", len(products))

# ---------- news ----------
news_cats = [(slug_of(u), squash(n)) for u, n in re.findall(r'<a href="(https://minhhiepcctv\.vn/[^"]+)" class="item-tag">\s*<i[^>]*>\s*</i>(.*?)</a>', home, re.S)]
article_slugs = {}
def crawl_news_cat(nc):
    slug, name = nc
    found, page = [], 1
    while True:
        h = get(f"/{slug}.html" + (f"?page={page}" if page > 1 else ""))
        urls = re.findall(r'<a href="(https://minhhiepcctv\.vn/[^"]+\.html)" class="(?:img|title|art-img|art-title|item-img|item-title)[^"]*"', h)
        main = h[h.find("article-page"):h.find("<!-- End Main -->")] if "article-page" in h else h
        urls = [u for u in re.findall(r'<a href="(https://minhhiepcctv\.vn/[^"]+\.html)"', main) if slug_of(u) not in dict(news_cats)]
        new = [slug_of(u) for u in urls if slug_of(u) not in found]
        if not new:
            break
        found += new
        if f"page={page + 1}" not in h:
            break
        page += 1
    return slug, found
with ThreadPoolExecutor(8) as ex:
    for cat_slug, found in ex.map(crawl_news_cat, news_cats):
        for s in found:
            article_slugs.setdefault(s, cat_slug)

def crawl_article(slug):
    h = get(f"/{slug}.html")
    if "article_detail-content" not in h:
        return None
    title = squash(re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S).group(1))
    t = re.search(r"<time>\s*<i[^>]*>\s*</i>\s*(\d\d)-(\d\d)-(\d{4})", h)
    views = re.search(r'<i class="fa fa-eye">\s*</i>\s*(\d+)', h)
    og = re.search(r'<meta property="og:image" content="([^"]+)"', h)
    desc = re.search(r'<meta name="Description" content="([^"]*)"', h)
    return {"slug": slug, "title": title, "category": article_slugs[slug],
            "date": f"{t.group(3)}-{t.group(2)}-{t.group(1)}" if t else "2026-01-01",
            "views": int(views.group(1)) if views else 0,
            "cover": og.group(1) if og else "", "excerpt": html.unescape(desc.group(1)) if desc else "",
            "content": inner(h, r'<div class="article_detail-content">')}
with ThreadPoolExecutor(8) as ex:
    articles = [a for a in ex.map(crawl_article, list(article_slugs)) if a]
# listing thumbnails are better covers than og:image
for a in articles:
    for nc, _ in news_cats:
        m = re.search(r'href="https://minhhiepcctv\.vn/%s\.html" class="img">\s*<img src="([^"]+)"' % re.escape(a["slug"]), get(f"/{nc}.html"))
        if m:
            a["cover"] = m.group(1)
            break
print("news categories:", len(news_cats), "articles:", len(articles))

# ---------- static pages ----------
PAGES = ["tuyen-dung-minh-hiep-protech", "du-an-tieu-bieu", "giai-phap-cong-nghe", "tu-van-lap-dat", "van-chuyen",
         "chinh-sach-bao-hanh", "dia-chi-cong-ty", "goi-lap-dat", "ho-tro-doi-tra"]
pages = []
for slug in PAGES:
    h = get(f"/{slug}.html")
    body = inner(h, r'<div class="container">\s*<div style="background: #fff;border-radius: 10px;[^"]*">') or inner(h, r'<div class="article_detail-content">')
    title = re.search(r'<span itemprop="name">([^<]+)</span>\s*</li>\s*</ol>', h)
    pages.append({"slug": slug, "title": squash(title.group(1)) if title else slug, "content": body})
about = get(BASE + "/gioithieu/")
# The about page lives on a separate WordPress site; transform.py rebuilds it from this text.
about_text = re.sub(r"\s+", " ", txt(re.sub(r"<(script|style)[^>]*>.*?</\1>", "", about, flags=re.S)))
contact = get("/lien-he")

# ---------- home ----------
slides = re.findall(r'<div class="item">\s*<a href="([^"]*)">\s*<img src="([^"]+)" alt="[^"]*" width="8159"', home)
home_faq = [(squash(q), a.strip()) for q, a in re.findall(r'<p class="title">\s*\d+\.\s*(.*?)</p>\s*<div class="content">(.*?)</div>\s*</div>', home, re.S)]

OUT.write_text(json.dumps({"categories": cats, "products": products, "news_categories": news_cats, "articles": articles,
                           "pages": pages, "about_text": about_text, "slides": slides, "home_faq": home_faq},
                          ensure_ascii=False, indent=1))
print("wrote", OUT)
