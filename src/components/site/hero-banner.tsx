"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Banner } from "@/lib/types";

/** Home hero: image + teal copy panel. Rotates when the admin adds more than one active banner. */
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;
  const b = banners[i];
  return (
    <div className="relative grid overflow-hidden rounded-[18px] bg-teal-navy md:grid-cols-[1.7fr_1fr]">
      <div className="relative aspect-[3/2] md:aspect-auto md:min-h-[420px]">
        <picture>
          {b.image_mobile && <source media="(max-width: 640px)" srcSet={b.image_mobile} />}
          { }
          <img src={b.image} alt={b.title} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        </picture>
      </div>
      <div className="flex flex-col items-start justify-center p-7 text-white">
        {b.eyebrow && <small className="text-[11px] font-bold uppercase tracking-wider text-teal-200">{b.eyebrow}</small>}
        <h2 className="mt-2 text-3xl leading-tight font-medium xl:text-[38px]">{b.title}</h2>
        {b.subtitle && <p className="mt-3 text-[14px] text-white/80">{b.subtitle}</p>}
        {b.link && (
          <Link href={b.link} className="mt-5 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-teal-navy hover:bg-teal-100">
            {b.button_text || "Xem ngay →"}
          </Link>
        )}
        {banners.length > 1 && (
          <div className="mt-6 flex gap-2">
            {banners.map((x, n) => (
              <button
                key={x.id}
                aria-label={`Banner ${n + 1}`}
                onClick={() => setI(n)}
                className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-white" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
