import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/delete-button";
import { CONTACT_STATUS, getResource, MOVEMENT_TYPES, ORDER_STATUS, PRICE_SOURCES, PURCHASE_STATUS, type Column } from "@/lib/admin/config";
import { db, type TableName } from "@/lib/db";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

const PER_PAGE = 20;
const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  draft: "bg-slate-200 text-slate-700",
  new: "bg-orange-100 text-orange-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  read: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  received: "bg-emerald-100 text-emerald-800",
  purchase: "bg-emerald-100 text-emerald-800",
  purchase_cancel: "bg-red-100 text-red-800",
  sale: "bg-blue-100 text-blue-800",
  sale_return: "bg-amber-100 text-amber-800",
  adjustment: "bg-slate-200 text-slate-700",
  manual: "bg-slate-200 text-slate-700",
  bulk: "bg-indigo-100 text-indigo-800",
};
const STATUS_LABEL: Record<string, string> = {
  published: "Hiển thị",
  draft: "Nháp",
  ...Object.fromEntries(
    [...ORDER_STATUS, ...CONTACT_STATUS, ...PURCHASE_STATUS, ...MOVEMENT_TYPES, ...PRICE_SOURCES].map((s) => [s.value, s.label]),
  ),
};

async function relationMaps(columns: Column[], filters: { relation?: TableName }[] = []) {
  const tables = [...new Set([...columns.map((c) => c.relation), ...filters.map((f) => f.relation)].filter(Boolean))] as TableName[];
  const entries = await Promise.all(
    tables.map(async (t) => {
      const { rows } = await db().list<{ id: string; name?: string }>(t, { columns: ["id", "name"], order: [{ column: "name" }] });
      return [t, rows.map((r) => ({ value: r.id, label: r.name ?? r.id }))] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<string, { value: string; label: string }[]>;
}

export default async function ResourceList({ params, searchParams }: Props) {
  const res = getResource((await params).resource);
  if (!res) notFound();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Record<string, unknown> = {};
  for (const f of res.filters ?? []) if (sp[f.name]) where[f.name] = sp[f.name];

  const [{ rows, count }, rel] = await Promise.all([
    db().list<Record<string, unknown> & { id: string }>(res.key, {
      where,
      order: res.defaultOrder,
      search: sp.q ? { columns: res.searchColumns, term: sp.q } : undefined,
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
    }),
    relationMaps(res.columns, res.filters),
  ]);
  const pages = Math.max(1, Math.ceil(count / PER_PAGE));
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return p.size ? `?${p}` : "";
  };

  const cell = (c: Column, row: Record<string, unknown>) => {
    const v = row[c.name];
    switch (c.type) {
      case "image":
      case "images": {
        const src = c.type === "images" ? (v as string[] | undefined)?.[0] : (v as string);
        return src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-11 w-11 rounded border border-slate-200 object-cover" />
        ) : (
          <div className="h-11 w-11 rounded bg-slate-100" />
        );
      }
      case "money":
        return v === null || v === undefined ? "—" : <span className="tabular-nums">{formatPrice(v as number)}</span>;
      case "number":
        return <span className="tabular-nums">{Number(v ?? 0).toLocaleString("vi-VN")}</span>;
      case "signed": {
        const x = Number(v ?? 0);
        return <span className={`font-semibold tabular-nums ${x > 0 ? "text-emerald-700" : x < 0 ? "text-red-700" : ""}`}>{x > 0 ? `+${x}` : x}</span>;
      }
      case "stock": {
        if (!row.track_stock) return <span className="text-slate-400">—</span>;
        const x = Number(v ?? 0);
        const low = x <= Number(row.low_stock_threshold ?? 2);
        return (
          <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${x <= 0 ? "text-red-700" : low ? "text-amber-700" : "text-slate-800"}`}>
            {x}
            {x <= 0 ? <span className="text-xs font-normal">hết</span> : low ? <span className="text-xs font-normal">sắp hết</span> : null}
          </span>
        );
      }
      case "boolean":
        return v ? <span className="text-emerald-600">✓</span> : <span className="text-slate-300">—</span>;
      case "relation":
        return rel[c.relation!]?.find((o) => o.value === v)?.label ?? <span className="text-slate-300">—</span>;
      case "date":
        return formatDate(v as string);
      case "datetime":
        return formatDateTime(v as string);
      case "status":
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[v as string] ?? "bg-slate-100"}`}>
            {STATUS_LABEL[v as string] ?? String(v)}
          </span>
        );
      default:
        return <span className="line-clamp-2">{String(v ?? "")}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {res.label} <span className="text-base font-normal text-slate-500">({count})</span>
        </h1>
        {res.canCreate !== false && (
          <Link href={`/admin/${res.key}/new/`} className="rounded-lg bg-teal-navy px-4 py-2 text-sm font-semibold text-white">
            + Thêm {res.singular}
          </Link>
        )}
      </div>

      <form className="flex flex-wrap gap-2 rounded-xl bg-white p-3 shadow-sm">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Tìm kiếm..."
          className="h-9 min-w-48 flex-1 rounded-md border border-slate-300 px-3 text-sm"
        />
        {res.filters?.map((f) => (
          <select key={f.name} name={f.name} defaultValue={sp[f.name] ?? ""} className="h-9 rounded-md border border-slate-300 px-2 text-sm">
            <option value="">{f.label}: tất cả</option>
            {(f.options ?? rel[f.relation!] ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        <button className="h-9 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white">Lọc</button>
        {(sp.q || res.filters?.some((f) => sp[f.name])) && (
          <Link href={`/admin/${res.key}/`} className="grid h-9 place-items-center px-2 text-sm text-slate-500">
            Xoá lọc
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {res.columns.map((c) => (
                <th key={c.name} className="px-4 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {res.columns.map((c, i) => (
                  <td key={c.name} className="max-w-xs px-4 py-2 align-middle">
                    {i === 0 || c.name === res.titleField ? (
                      <Link href={`/admin/${res.key}/${row.id}/`} className="font-medium text-slate-900 hover:text-teal-700">
                        {cell(c, row)}
                      </Link>
                    ) : (
                      cell(c, row)
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/${res.key}/${row.id}/`} className="mr-3 text-teal-700 hover:underline">
                    {res.readOnly ? "Xem" : "Sửa"}
                  </Link>
                  {res.viewPath && (
                    <a href={res.viewPath(row) ?? "#"} target="_blank" className="mr-3 text-slate-500 hover:underline">
                      Xem
                    </a>
                  )}
                  {!res.readOnly && res.canDelete !== false && (
                    <DeleteButton resource={res.key} id={row.id} label={String(row[res.titleField] ?? "")} />
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={res.columns.length + 1} className="px-4 py-10 text-center text-slate-500">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={qs({ page: String(page - 1) })} className="rounded border bg-white px-3 py-1">
              ←
            </Link>
          )}
          <span>
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={qs({ page: String(page + 1) })} className="rounded border bg-white px-3 py-1">
              →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
