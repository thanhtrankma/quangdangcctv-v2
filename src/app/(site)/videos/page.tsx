import type { Metadata } from "next";
import { BlogSidebar } from "@/components/site/sidebar";
import { Breadcrumb, PageTitle } from "@/components/site/ui";
import { getVideos } from "@/lib/data";
import { youtubeId } from "@/lib/format";

export const metadata: Metadata = { title: "Videos", alternates: { canonical: "/videos/" } };

export default async function VideosPage() {
  const videos = await getVideos();
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Videos" }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <PageTitle>Videos</PageTitle>
          {videos.length === 0 && <p className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-muted">Chưa có video nào.</p>}
          <div className="grid gap-5 sm:grid-cols-2">
            {videos.map((v) => {
              const id = youtubeId(v.youtube_url);
              return (
                <div key={v.id}>
                  <div className="aspect-video overflow-hidden rounded-xl bg-black">
                    {id ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${id}`}
                        title={v.title}
                        loading="lazy"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    ) : (
                      <a href={v.youtube_url} className="grid h-full place-items-center text-white">
                        Xem video
                      </a>
                    )}
                  </div>
                  <h2 className="mt-2 text-base font-semibold">{v.title}</h2>
                  {v.description && <p className="text-sm text-muted">{v.description}</p>}
                </div>
              );
            })}
          </div>
        </div>
        <BlogSidebar />
      </div>
    </div>
  );
}
