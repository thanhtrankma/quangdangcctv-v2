import Link from "next/link";

/** Stat tile: sentence-case label, one big value, optional sub-line. Values stay in ink colors. */
export function Kpi({ label, value, sub, href }: { label: string; value: string; sub?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </>
  );
  const cls = "block rounded-xl bg-white p-4 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} transition-shadow hover:shadow`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}
