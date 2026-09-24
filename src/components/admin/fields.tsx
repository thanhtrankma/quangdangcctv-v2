"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { uploadImage } from "@/app/admin/actions";
import type { Field } from "@/lib/admin/config";
import { formatPrice, PLACEHOLDER_IMG, slugify } from "@/lib/format";
import type { OrderItem } from "@/lib/types";
import { RichTextEditor } from "./rich-text";

export type Options = Record<string, { value: string; label: string }[]>;

export const inputCls =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await uploadImage(fd);
  if (!r.ok) throw new Error(r.error);
  return r.url;
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <ImagePlus className="text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Dán link ảnh hoặc bấm Tải ảnh lên" className={inputCls} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Tải ảnh lên
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-sm text-red-600">
              Bỏ ảnh
            </button>
          )}
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              onChange(await uploadFile(f));
            } catch (x) {
              setErr((x as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}

function ImagesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");
  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((src, i) => (
          <div key={src + i} className="group relative h-28 w-28 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-teal-700 px-1.5 text-[10px] text-white">Ảnh chính</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} aria-label="Lên trước">
                <ArrowUp size={14} className="-rotate-90" />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))} aria-label="Xoá">
                <X size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Ra sau">
                <ArrowDown size={14} className="-rotate-90" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="grid h-28 w-28 place-items-center rounded-md border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-teal-600 hover:text-teal-700"
        >
          {busy ? <Loader2 className="animate-spin" /> : <span className="text-center"><ImagePlus className="mx-auto" />Thêm ảnh</span>}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Hoặc dán link ảnh..." className={inputCls} />
        <button
          type="button"
          onClick={() => {
            if (url.trim()) onChange([...value, url.trim()]);
            setUrl("");
          }}
          className="rounded-md border border-slate-300 px-3 text-sm"
        >
          Thêm
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (!files.length) return;
          setBusy(true);
          setErr("");
          try {
            const urls: string[] = [];
            for (const f of files) urls.push(await uploadFile(f));
            onChange([...value, ...urls]);
          } catch (x) {
            setErr((x as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function ListInput({
  field,
  value,
  onChange,
  options,
}: {
  field: Field;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  options: Options;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const sub = field.fields ?? [];
  const blank = () => Object.fromEntries(sub.map((f) => [f.name, f.type === "list" ? [] : ""]));
  const update = (i: number, item: Record<string, unknown>) => onChange(value.map((v, n) => (n === i ? item : v)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => {
        const title = String(item[field.itemLabel ?? sub[0]?.name] ?? "").replace(/<[^>]+>/g, " ") || `Mục ${i + 1}`;
        return (
          <div key={i} className="rounded-md border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                {i + 1}. {title}
              </button>
              <button type="button" onClick={() => move(i, -1)} className="text-slate-500" aria-label="Lên">
                <ArrowUp size={15} />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="text-slate-500" aria-label="Xuống">
                <ArrowDown size={15} />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))} className="text-red-600" aria-label="Xoá">
                <Trash2 size={15} />
              </button>
            </div>
            {open === i && (
              <div className="grid gap-3 border-t border-slate-200 bg-white p-3 md:grid-cols-2">
                {sub.map((f) => (
                  <FieldInput key={f.name} field={f} value={item[f.name]} onChange={(v) => update(i, { ...item, [f.name]: v })} options={options} values={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          onChange([...value, blank()]);
          setOpen(value.length);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-600 hover:border-teal-600 hover:text-teal-700"
      >
        <Plus size={14} /> Thêm mục
      </button>
    </div>
  );
}

function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-slate-100">
        {items.map((i, n) => (
          <tr key={n}>
            <td className="py-2 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image || PLACEHOLDER_IMG} alt="" className="h-12 w-12 rounded border object-cover" />
            </td>
            <td className="py-2">
              <a href={`/san-pham/${i.slug}/`} target="_blank" className="font-medium hover:text-teal-700">
                {i.name}
              </a>
              {i.variant && <div className="text-xs text-slate-500">{i.variant}</div>}
            </td>
            <td className="py-2 text-right whitespace-nowrap">
              {i.qty} × {formatPrice(i.price)}
            </td>
            <td className="py-2 pl-3 text-right font-semibold whitespace-nowrap">{formatPrice(i.qty * i.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FieldInput({
  field: f,
  value,
  onChange,
  options,
  values,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  options: Options;
  values: Record<string, unknown>;
}) {
  const wide = f.width !== "half" || ["richtext", "images", "list", "order_items"].includes(f.type);
  let control: React.ReactNode;
  switch (f.type) {
    case "textarea":
      control = <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={f.placeholder} className={`${inputCls} h-auto py-2`} />;
      break;
    case "richtext":
      control = <RichTextEditor value={String(value ?? "")} onChange={onChange} />;
      break;
    case "number":
      control = <input type="number" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
      break;
    case "money":
      control = (
        <div className="relative">
          <input
            inputMode="numeric"
            value={value === null || value === undefined || value === "" ? "" : new Intl.NumberFormat("vi-VN").format(Number(value))}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              onChange(digits === "" ? "" : Number(digits));
            }}
            placeholder={f.placeholder}
            className={`${inputCls} pr-8`}
          />
          <span className="absolute right-3 top-2.5 text-sm text-slate-400">₫</span>
        </div>
      );
      break;
    case "boolean":
      control = (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-teal-700" />
          Bật
        </label>
      );
      break;
    case "select":
    case "relation": {
      const opts = f.type === "select" ? (f.options ?? []) : (options[f.relation!] ?? []);
      control = (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {f.type === "relation" && <option value="">— Không chọn —</option>}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }
    case "image":
      control = <ImageInput value={String(value ?? "")} onChange={onChange} />;
      break;
    case "images":
      control = <ImagesInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
      break;
    case "date":
      control = <input type="date" value={String(value ?? "").slice(0, 10)} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
      break;
    case "color":
      control = (
        <div className="flex gap-2">
          <input type="color" value={String(value || "#0e9488")} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border" />
          <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        </div>
      );
      break;
    case "slug":
      control = (
        <div className="flex gap-2">
          <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputCls} />
          <button
            type="button"
            onClick={() => onChange(slugify(String(values[f.from ?? ""] ?? "")))}
            className="shrink-0 rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-50"
          >
            Tạo từ tên
          </button>
        </div>
      );
      break;
    case "list":
      control = <ListInput field={f} value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} onChange={onChange} options={options} />;
      break;
    case "order_items":
      control = <OrderItems items={(value as OrderItem[]) ?? []} />;
      break;
    case "readonly":
      control = (
        <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold">
          {typeof value === "number" ? formatPrice(value) : String(value ?? "—")}
        </div>
      );
      break;
    default:
      control = <input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={inputCls} />;
  }
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {f.label}
        {f.required && <span className="text-red-600"> *</span>}
      </label>
      {control}
      {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
    </div>
  );
}
