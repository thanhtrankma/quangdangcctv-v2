import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/lib/data";
import { FloatingContact } from "./floating-contact";

export async function SiteFooter() {
  const { general, footer } = await getSettings();
  return (
    <>
      <footer className="mt-16 bg-navy text-sky-100">
        <div className="container-x grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <div className="inline-block rounded-xl bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={general.logo} alt={general.site_name} width={160} height={50} className="h-10 w-auto" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-sky-100/80">{general.seo_description}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {general.address && (
                <li className="flex gap-2.5">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
                  {general.address}
                </li>
              )}
              <li className="flex gap-2.5">
                <Phone size={18} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
                <a href={`tel:${general.hotline}`} className="font-semibold text-white hover:underline">
                  {general.hotline_display}
                </a>
              </li>
              {general.email && (
                <li className="flex gap-2.5">
                  <Mail size={18} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
                  <a href={`mailto:${general.email}`} className="break-all hover:underline">
                    {general.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h2 className="font-heading text-base font-semibold text-white">{col.title}</h2>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="inline-flex min-h-9 items-center text-sm text-sky-100/80 transition-colors duration-200 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="font-heading text-base font-semibold text-white">{footer.contact_title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-sky-100/80" dangerouslySetInnerHTML={{ __html: footer.contact_html }} />
            <div className="mt-5 flex flex-wrap gap-2">
              {general.zalo_url && (
                <a href={general.zalo_url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">
                  <MessageCircle size={16} aria-hidden="true" /> Zalo
                </a>
              )}
              {general.facebook_url && general.facebook_url !== "#" && (
                <a href={general.facebook_url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">
                  Facebook
                </a>
              )}
              {footer.map_url && (
                <a href={footer.map_url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">
                  <MapPin size={16} aria-hidden="true" /> Chỉ đường
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="container-x py-5 text-center text-xs text-sky-100/70">{footer.copyright}</p>
        </div>
      </footer>
      <FloatingContact hotline={general.hotline} hotlineDisplay={general.hotline_display} zaloUrl={general.zalo_url} />
    </>
  );
}
