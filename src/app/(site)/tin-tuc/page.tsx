import type { Metadata } from "next";
import { PostList } from "@/components/site/post-list";
import { Breadcrumb } from "@/components/site/ui";

export const metadata: Metadata = { title: "Tin tức", alternates: { canonical: "/tin-tuc/" } };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await searchParams).page) || 1;
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Tin tức" }]} />
      <PostList title="Tin tức" basePath="/tin-tuc/" page={page} />
    </div>
  );
}
