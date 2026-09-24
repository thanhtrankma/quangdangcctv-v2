"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteRecord } from "@/app/admin/actions";

export function DeleteButton({
  resource,
  id,
  label,
  redirectTo,
  className = "text-red-600 hover:underline",
}: {
  resource: string;
  id: string;
  label: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={`${className} disabled:opacity-50`}
      onClick={() => {
        if (!confirm(`Xoá “${label}”? Thao tác này không thể hoàn tác.`)) return;
        start(async () => {
          const r = await deleteRecord(resource, id);
          if (!r.ok) return alert(r.error);
          if (redirectTo) router.push(redirectTo);
          router.refresh();
        });
      }}
    >
      {pending ? "Đang xoá..." : "Xoá"}
    </button>
  );
}
