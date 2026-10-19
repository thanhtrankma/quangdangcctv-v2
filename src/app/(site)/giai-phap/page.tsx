import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { ProcessSteps, SolutionGrid, ValuesStrip } from "@/components/site/solutions";
import { Breadcrumb, btn } from "@/components/site/ui";
import { getSettings, getSolutions } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { solutions_page: sp, general } = await getSettings();
  return { title: `Giải pháp – ${sp.title}`, description: sp.intro || general.seo_description, alternates: { canonical: "/giai-phap/" } };
}

export default async function SolutionsPage() {
  const [{ solutions_page: sp, general }, solutions] = await Promise.all([getSettings(), getSolutions()]);
  return (
    <div className="container-x">
      <Breadcrumb items={[{ label: "Giải pháp" }]} />

      <header className="rounded-2xl bg-gradient-to-br from-navy via-ink to-primary px-5 py-8 text-white md:px-10 md:py-12">
        <p className="text-sm font-semibold tracking-wider text-sky-200 uppercase">{sp.eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-3xl leading-tight font-bold text-white md:text-5xl">{sp.title}</h1>
        <p className="mt-3 max-w-2xl text-sky-100/90 md:text-lg">{sp.intro}</p>
        <div className="mt-8">
          <ProcessSteps steps={sp.steps} dark />
        </div>
      </header>

      <section className="mt-10" aria-label="Danh sách giải pháp">
        <SolutionGrid solutions={solutions} />
      </section>

      <section className="mt-10">
        <ValuesStrip values={sp.values} />
      </section>

      <section className="mt-12 grid gap-6 rounded-2xl border border-border bg-white p-5 md:p-8 lg:grid-cols-[1fr_420px]" aria-labelledby="sol-cta">
        <div>
          <h2 id="sol-cta" className="text-2xl font-bold md:text-3xl">
            {sp.cta_title}
          </h2>
          <p className="mt-2 text-muted">{sp.cta_text}</p>
          <a href={`tel:${general.hotline}`} className={`${btn.cta} mt-5`}>
            <Phone size={18} aria-hidden="true" /> Gọi {general.hotline_display}
          </a>
        </div>
        <div className="rounded-xl bg-tint p-5">
          <ContactForm source="giai-phap" siteName={general.site_name} compact />
        </div>
      </section>
    </div>
  );
}
