import { notFound } from "next/navigation";
import { RecordForm } from "@/components/admin/record-form";
import { getSettingsGroup } from "@/lib/admin/config";
import { db } from "@/lib/db";

export default async function SettingsPage({ params }: { params: Promise<{ group: string }> }) {
  const group = getSettingsGroup((await params).group);
  if (!group) notFound();
  const settings = await db().getSettings();
  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-500">Giao diện & cài đặt</div>
      <h1 className="text-2xl font-bold">{group.label}</h1>
      <p className="text-sm text-slate-600">{group.description}</p>
      <RecordForm
        key={group.key}
        fields={group.fields}
        initial={settings[group.key] as unknown as Record<string, unknown>}
        options={{}}
        settingsGroup={group.key}
        viewHref="/"
      />
    </div>
  );
}
