// app/profile/ui/profile-client.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function safeTab(v: string | null) {
  if (!v) return "overview";
  if (!["overview", "listings", "settings"].includes(v)) return "overview";
  return v;
}

export default function ProfileClient() {
  const sp = useSearchParams();
  const tab = useMemo(() => safeTab(sp.get("tab")), [sp]);

  return (
    <div className="space-y-4">
      <div className="text-xl font-black">Profil</div>

      <div className="flex gap-2 text-sm font-black">
        <div className={tab === "overview" ? "text-emerald-600" : ""}>Genel</div>
        <div className={tab === "listings" ? "text-emerald-600" : ""}>İlanlar</div>
        <div className={tab === "settings" ? "text-emerald-600" : ""}>Ayarlar</div>
      </div>

      <div className="rounded-2xl border p-4">
        Aktif sekme: <b>{tab}</b>
      </div>
    </div>
  );
}