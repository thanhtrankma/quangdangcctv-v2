import Link from "next/link";
import { createElement } from "react";
import {
  ArrowRight, BatteryCharging, Building2, Cctv, CheckCircle2, Clock, Handshake, HardHat, House, PackageCheck, ShieldCheck, Sofa, Snowflake,
  Sun, Wifi, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import { PLACEHOLDER_IMG } from "@/lib/format";
import type { Settings, Solution } from "@/lib/types";
import { Img } from "./img";

const ICONS: Record<string, LucideIcon> = {
  cctv: Cctv,
  wifi: Wifi,
  snowflake: Snowflake,
  house: House,
  sun: Sun,
  battery: BatteryCharging,
  sofa: Sofa,
  building: Building2,
  shield: ShieldCheck,
  zap: Zap,
};

export function SolutionIcon({ name, className }: { name: string; className?: string }) {
  return createElement(ICONS[name] ?? ShieldCheck, { className, "aria-hidden": true });
}

/** Card in the brochure layout: numbered header, picture, 3–5 highlights, link to the detail page. */
export function SolutionCard({ s, index, priority = false }: { s: Solution; index: number; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-lift">
      <header className="flex items-center gap-3 bg-gradient-to-r from-ink to-primary px-4 py-3 text-white">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-heading text-lg font-bold text-primary tabular-nums">
          {index}
        </span>
        <h3 className="font-heading text-[17px] leading-tight font-bold text-white uppercase">
          <Link href={`/giai-phap/${s.slug}/`} className="after:absolute after:inset-0">
            {s.title}
          </Link>
        </h3>
      </header>
      <div className="relative aspect-[2/1] overflow-hidden bg-tint">
        <Img
          src={s.cover || PLACEHOLDER_IMG}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <ul className="space-y-1.5 text-[15px]">
          {(s.highlights ?? []).slice(0, 5).map((h, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{h.text}</span>
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
          Xem giải pháp <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

export function SolutionGrid({ solutions }: { solutions: Solution[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {solutions.map((s, i) => (
        <li key={s.id}>
          <SolutionCard s={s} index={i + 1} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}

const STEP_ICONS: LucideIcon[] = [Handshake, PackageCheck, HardHat, ShieldCheck];

/** Tư vấn → Cung cấp → Thi công → Bảo hành. */
export function ProcessSteps({ steps, dark = false }: { steps: Settings["solutions_page"]["steps"]; dark?: boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((st, i) => {
        const Icon = STEP_ICONS[i % STEP_ICONS.length];
        return (
          <li key={i} className={`relative flex gap-3 rounded-xl p-4 ${dark ? "bg-white/10 text-white" : "border border-border bg-white"}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${dark ? "bg-white text-primary" : "bg-primary-soft text-primary"}`}>
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className={`block text-xs font-semibold tracking-wider uppercase ${dark ? "text-sky-200" : "text-primary"}`}>Bước {i + 1}</span>
              <span className={`block font-heading font-bold ${dark ? "text-white" : "text-ink"}`}>{st.title}</span>
              <span className={`mt-0.5 block text-sm ${dark ? "text-sky-100/85" : "text-muted"}`}>{st.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const VALUE_ICONS: LucideIcon[] = [ShieldCheck, Wrench, PackageCheck, Clock, Handshake];

export function ValuesStrip({ values }: { values: Settings["solutions_page"]["values"] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" aria-label="Cam kết">
      {values.map((v, i) => {
        const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
        return (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm leading-tight font-bold text-ink uppercase">{v.title}</span>
              {v.text && <span className="block text-xs text-muted">{v.text}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
