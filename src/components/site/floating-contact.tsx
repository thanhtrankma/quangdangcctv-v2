"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle, Phone } from "lucide-react";

export function FloatingContact({ hotline, hotlineDisplay, zaloUrl }: { hotline: string; hotlineDisplay: string; zaloUrl: string }) {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const round = "grid h-12 w-12 place-items-center rounded-full shadow-lg transition-transform duration-200 hover:-translate-y-0.5";
  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-center gap-3">
      {showTop && (
        <button
          type="button"
          aria-label="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`${round} border border-border bg-white text-ink`}
        >
          <ArrowUp size={20} aria-hidden="true" />
        </button>
      )}
      {zaloUrl && (
        <a href={zaloUrl} target="_blank" rel="noopener" aria-label="Chat Zalo" className={`${round} bg-[#0068ff] text-white`}>
          <MessageCircle size={22} aria-hidden="true" />
        </a>
      )}
      <a href={`tel:${hotline}`} aria-label={`Gọi ${hotlineDisplay}`} className={`${round} bg-cta text-white ring-4 ring-cta/20`}>
        <Phone size={22} aria-hidden="true" />
      </a>
    </div>
  );
}
