// app/admin/support/[id]/ui/support-detail-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return dt;
  }
}

async function apiPatch(id: string, body: any) {
  const res = await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error ?? "request_failed");
  return j;
}

export default function SupportDetailClient({ initialTicket }: { initialTicket: any }) {
  const router = useRouter();
  const [t, setT] = useState<any>(initialTicket);
  const [busy, setBusy] = useState(false);

  const msg = (t?.message ?? t?.body ?? "").trim();
  const status = String(t?.status ?? "open").toLowerCase() === "closed" ? "closed" : "open";

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const nextStatus = status === "open" ? "closed" : "open";
      let resolution: string | null | undefined = undefined;
      if (nextStatus === "closed") {
        const r = prompt("Çözüm / not (opsiyonel):", t?.resolution ?? "") ?? "";
        resolution = r.trim() || null;
      }
      const j = await apiPatch(t.id, { status: nextStatus, ...(resolution !== undefined ? { resolution } : {}) });
      setT(j.ticket);
    } catch (e: any) {
      alert(e?.message ?? "update_failed");
    } finally {
      setBusy(false);
    }
  }

  async function editResolution() {
    if (busy) return;
    const r = prompt("Resolution:", t?.resolution ?? "") ?? "";
    setBusy(true);
    try {
      const j = await apiPatch(t.id, { resolution: r.trim() || null });
      setT(j.ticket);
    } catch (e: any) {
      alert(e?.message ?? "resolution_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black">{t?.subject || "Destek Talebi"}</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              ticket_id: {t?.id} • user_id: {t?.user_id}
            </div>
            <div className="mt-2 text-xs text-black/60 dark:text-white/60">
              Oluşturma: {fmt(t?.created_at)} {t?.closed_at ? ` • Kapanış: ${fmt(t?.closed_at)}` : ""}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/admin/users/${t?.user_id}`}
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              Kullanıcıya Git →
            </Link>

            <button
              onClick={editResolution}
              disabled={busy}
              className={clsx(
                "rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                busy && "opacity-60 cursor-not-allowed"
              )}
            >
              Resolution
            </button>

            <button
              onClick={toggle}
              disabled={busy}
              className={clsx(
                status === "open"
                  ? "rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400"
                  : "rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400",
                busy && "opacity-60 cursor-not-allowed"
              )}
            >
              {status === "open" ? "Kapat" : "Tekrar Aç"}
            </button>

            <button
              onClick={() => router.push("/admin/support")}
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              ← Geri
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold opacity-70">Mesaj</div>
            <div className="mt-2 whitespace-pre-wrap leading-6">{msg || "—"}</div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-xs font-extrabold opacity-70">Contact</div>
            <div className="mt-2">{t?.contact || "—"}</div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-xs font-extrabold opacity-70">Resolution</div>
            <div className="mt-2 whitespace-pre-wrap">{t?.resolution || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}