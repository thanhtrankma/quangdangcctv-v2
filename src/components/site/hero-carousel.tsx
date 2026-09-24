"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Banner } from "@/lib/types";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(reducedQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Banner carousel with visible pause/prev/next; autoplay stops on hover, focus and reduced motion. */
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false);
  const [userPlaying, setPlaying] = useState(true);
  const playing = userPlaying && !reduced;
  const [hold, setHold] = useState(false);
  const n = banners.length;
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    if (!playing || hold || n < 2) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [playing, hold, n, go]);

  if (!n) return null;
  const ctl = "grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink shadow transition-colors duration-200 hover:bg-white";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Chương trình nổi bật"
      className="relative overflow-hidden rounded-2xl bg-navy"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div className="relative aspect-[2.4/1] lg:aspect-auto lg:h-full lg:min-h-[340px]">
        {banners.map((b, k) => (
          <div
            key={b.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${k + 1} / ${n}: ${b.title}`}
            aria-hidden={k !== i}
            className={`absolute inset-0 transition-opacity duration-500 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <Link href={b.link || "/cua-hang/"} tabIndex={k === i ? 0 : -1} className="relative block h-full overflow-hidden">
              {/* Blurred copy fills the frame when the banner's ratio differs from the slot; the real image is never cropped. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
              <picture>
                {b.image_mobile && <source media="(max-width: 640px)" srcSet={b.image_mobile} />}
                <img
                  src={b.image}
                  alt={b.title}
                  fetchPriority={k === 0 ? "high" : "auto"}
                  loading={k === 0 ? "eager" : "lazy"}
                  className="relative h-full w-full object-contain"
                />
              </picture>
              <span className="sr-only">{b.subtitle}</span>
            </Link>
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 sm:absolute sm:inset-x-0 sm:bottom-3 sm:py-0">
          <button type="button" onClick={() => go(-1)} aria-label="Banner trước" className={`${ctl} hidden sm:grid`}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Tạm dừng" : "Tự chạy"} className={ctl}>
            {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
          <div className="flex gap-1.5 rounded-full bg-black/35 px-3 py-2">
            {banners.map((b, k) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Chuyển tới banner ${k + 1}`}
                aria-current={k === i}
                className={`h-2 rounded-full transition-all duration-200 ${k === i ? "w-6 bg-white" : "w-2 bg-white/60"}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(1)} aria-label="Banner sau" className={`${ctl} hidden sm:grid`}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
