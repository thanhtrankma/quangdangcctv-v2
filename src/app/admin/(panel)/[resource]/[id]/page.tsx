import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/delete-button";
import { RecordForm } from "@/components/admin/record-form";
import { getResource } from "@/lib/admin/config";
import { defaultsFor, loadRelationOptions } from "@/lib/admin/options";
import { db } from "@/lib/db";

type Props = { params: Promise<{ resource: string; id: string }> };

export default async function EditRecord({ params }: Props) {
  const { resource, id } = await params;
  const res = getResource(resource);
  if (!res) notFound();
  const isNew = id === "new";
  if (isNew && res.canCreate === false) notFound();

  const row = isNew ? null : await db().get<Record<string, unknown>>(res.key, id);
  if (!isNew && !row) notFound();
  // Categories can't pick themselves as parent.
  const options = await loadRelationOptions(res.fields, isNew ? undefined : id);
  const initial = { ...defaultsFor(res.fields), ...(row ?? {}) };
  const title = isNew ? `Thêm ${res.singular}` : String(row?.[res.titleField] ?? res.singular);

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-500">{res.label}</div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <RecordForm
        key={id}
        fields={res.fields}
        initial={initial}
        options={options}
        resource={res.key}
        id={isNew ? null : id}
        backHref={`/admin/${res.key}/`}
        viewHref={!isNew && row && res.viewPath ? res.viewPath(row) : null}
        extraActions={
          !isNew && (
            <DeleteButton
              resource={res.key}
              id={id}
              label={title}
              redirectTo={`/admin/${res.key}/`}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            />
          )
        }
      />
    </div>
  );
}
