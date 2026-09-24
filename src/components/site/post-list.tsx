import Link from "next/link";
import { getPosts } from "@/lib/data";
import { db } from "@/lib/db";
import type { PostCategory } from "@/lib/types";
import { BlogSidebar } from "./sidebar";
import { PageTitle, Pagination, PostCard } from "./ui";

export async function PostList({ title, basePath, page, categoryId }: { title: string; basePath: string; page: number; categoryId?: string }) {
  const [res, { rows: postCats }] = await Promise.all([
    getPosts({ page, categoryId }),
    db().list<PostCategory>("post_categories", { order: [{ column: "sort_order" }] }),
  ]);
  const [first, ...rest] = res.rows;
  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
      active ? "border-primary bg-primary text-white" : "border-border bg-white text-body hover:border-primary hover:text-primary"
    }`;

  return (
    <>
      <PageTitle>{title}</PageTitle>
      <nav aria-label="Chuyên mục tin" className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex gap-2 md:flex-wrap">
          <li>
            <Link href="/tin-tuc/" aria-current={!categoryId ? "page" : undefined} className={chip(!categoryId)}>
              Tất cả
            </Link>
          </li>
          {postCats.map((c) => (
            <li key={c.id}>
              <Link href={`/danh-muc-tin-tuc/${c.slug}/`} aria-current={c.id === categoryId ? "page" : undefined} className={chip(c.id === categoryId)}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {!first ? (
            <p className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-muted">Chưa có bài viết trong chuyên mục này.</p>
          ) : (
            <>
              {page === 1 && (
                <div className="mb-5">
                  <PostCard post={first} featured />
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                {(page === 1 ? rest : res.rows).map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </>
          )}
          <Pagination page={res.page} pages={res.pages} href={(n) => (n > 1 ? `${basePath}?page=${n}` : basePath)} />
        </div>
        <BlogSidebar />
      </div>
    </>
  );
}
