import { AlertTriangle, CheckCircle2, CircleSlash, Minus } from "lucide-react";
import type { StockState } from "@/lib/admin/inventory";

const MAP: Record<StockState, { label: string; cls: string; Icon: typeof Minus }> = {
  ok: { label: "Còn hàng", cls: "bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
  low: { label: "Sắp hết", cls: "bg-amber-50 text-amber-800", Icon: AlertTriangle },
  out: { label: "Hết hàng", cls: "bg-red-50 text-red-800", Icon: CircleSlash },
  untracked: { label: "Chưa theo dõi", cls: "bg-slate-100 text-slate-600", Icon: Minus },
};

/** Stock status never relies on color alone: icon + text label. */
export function StockBadge({ state }: { state: StockState }) {
  const { label, cls, Icon } = MAP[state];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
