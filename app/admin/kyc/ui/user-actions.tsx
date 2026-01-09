"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function btnCls() {
  return "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]";
}

export default function UserActions({ profile }: { profile: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(p: any) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "failed");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  const banned = profile.banned_until && new Date(profile.banned_until).getTime() > Date.now();

  return (
    <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04] space-y-3">
      <div className="text-sm font-black">Aksiyonlar</div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button disabled={loading} className={btnCls()} onClick={() => patch({ is_premium: !profile.is_premium })}>
          {profile.is_premium ? "Premium Kapat" : "Premium Aç"}
        </button>

        <button disabled={loading} className={btnCls()} onClick={() => patch({ is_admin: !profile.is_admin })}>
          {profile.is_admin ? "Admin Kapat" : "Admin Yap"}
        </button>

        <button
          disabled={loading}
          className={btnCls()}
          onClick={() =>
            banned
              ? patch({ banned_until: null, ban_reason: null })
              : patch({ banned_until: new Date(Date.now() + 7 * 864e5).toISOString(), ban_reason: "admin_ban" })
          }
        >
          {banned ? "Unban" : "7 Gün Ban"}
        </button>

        <button disabled={loading} className={btnCls()} onClick={() => patch({ verified: !profile.verified })}>
          {profile.verified ? "Onayı Kaldır" : "Onayla (Verified)"}
        </button>
      </div>

      <div className="text-xs text-black/60 dark:text-white/60">
        Ban alanı: <b>{String(profile.banned_until ?? "—")}</b> • reason: <b>{String(profile.ban_reason ?? "—")}</b>
      </div>
    </div>
  );
}