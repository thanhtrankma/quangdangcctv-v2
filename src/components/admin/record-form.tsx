"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveRecord, saveSettings } from "@/app/admin/actions";
import type { Field } from "@/lib/admin/config";
import { FieldInput, type Options } from "./fields";

type Props = {
  fields: Field[];
  initial: Record<string, unknown>;
  options: Options;
  /** Save a table row… */
  resource?: string;
  id?: string | null;
  /** …or a settings group. */
  settingsGroup?: string;
  backHref?: string;
  viewHref?: string | null;
  extraActions?: React.ReactNode;
};

export function RecordForm({ fields, initial, options, resource, id, settingsGroup, backHref, viewHref, extraActions }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);

  const set = (name: string, v: unknown) => {
    setDirty(true);
    setValues((prev) => ({ ...prev, [name]: v }));
  };

  const main = fields.filter((f) => !f.side);
  const side = fields.filter((f) => f.side);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = settingsGroup ? await saveSettings(settingsGroup, values) : await saveRecord(resource!, id ?? null, values);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setDirty(false);
      setMsg({ ok: true, text: "Đã lưu thành công." });
      if (!settingsGroup && !id && r.id) router.replace(`/admin/${resource}/${r.id}/`);
      else router.refresh();
    });
  };

  const renderFields = (list: Field[]) =>
    list.map((f) => (
      <FieldInput key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} options={options} values={values} />
    ));

  const bar = (
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={pending} className="rounded-lg bg-teal-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Đang lưu..." : "Lưu"}
      </button>
      {backHref && (
        <Link href={backHref} className="text-sm text-slate-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      )}
      {viewHref && (
        <a href={viewHref} target="_blank" className="text-sm text-teal-700 hover:underline">
          Xem trên web ↗
        </a>
      )}
      {dirty && !pending && <span className="text-xs text-amber-600">Có thay đổi chưa lưu</span>}
      {msg && <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</span>}
      <span className="ml-auto">{extraActions}</span>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 bg-slate-100/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6">{bar}</div>
      <div className={side.length ? "grid items-start gap-4 xl:grid-cols-[1fr_340px]" : ""}>
        <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2">{renderFields(main)}</div>
        {side.length > 0 && <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm">{renderFields(side)}</div>}
      </div>
    </form>
  );
}
