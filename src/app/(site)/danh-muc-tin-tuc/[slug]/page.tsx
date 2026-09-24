import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostList } from "@/components/site/post-list";
import { Breadcrumb } from "@/components/site/ui";
import { getPostCategory } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getPostCategory((await params).slug);
  return cat ? { title: cat.name, alternates: { canonical: `/danh-muc-tin-tuc/${cat.slug}/` } } : {};
}

export default async function PostCategoryPage({ params, searchParams }: Props) {
  const cat = await getPostCategory((await params).slug);
  if (!cat) notFound();
  const page = Number((await searchParams).page) || 1;
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Tin Tức", href: "/tin-tuc/" }, { label: cat.name }]} />
      <PostList title={cat.name} basePath={`/danh-muc-tin-tuc/${cat.slug}/`} page={page} categoryId={cat.id} />
    </div>
  );
}
