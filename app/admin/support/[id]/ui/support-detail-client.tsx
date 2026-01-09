"use client";

import Link from "next/link";
import { useState } from "react";
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

  const msg = (t.message ?? t.body ?? "").trim();
  const name = t?.profiles?.company_name?.trim() || t?.profiles?.full_name?.trim() || "Kullanıcı";

  async function toggleStatus() {
    const next = String(t.status ?? "open").toLowerCase() === "open" ? "closed" : "open";
    const resolution =
      next === "closed" ? (prompt("Kapatırken çözüm/not:", t.resolution ?? "") ?? "").trim() || null : t.resolution;

    setBusy(true);
    try {
      const j = await apiPatch(t.id, { status: next, resolution });
      setT((prev: any) => ({ ...prev, ...(j.ticket ?? {}) }));
    } catch (e: any) {
      alert(e?.message ?? "update_failed");
    } finally {
      setBusy(false);
    }
  }

  async function editResolution() {
    const r = prompt("Resolution:", t.resolution ?? "") ?? "";
    setBusy(true);
    try {
      const j = await apiPatch(t.id, { resolution: r.trim() || null });
      setT((prev: any) => ({ ...prev, ...(j.ticket ?? {}) }));
    } catch (e: any) {
      alert(e?.message ?? "resolution_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🎫 Ticket</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          #{t.id} • {name} • {t.status}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Bilgiler</div>
            <div className="mt-2 text-sm">
              <div><span className="font-black">Konu:</span> {t.subject || "—"}</div>
              <div className="mt-1"><span className="font-black">Contact:</span> {t.contact || "—"}</div>
              <div className="mt-1"><span className="font-black">Oluşturma:</span> {fmt(t.created_at)}</div>
              <div className="mt-1"><span className="font-black">Güncelleme:</span> {fmt(t.updated_at)}</div>
              <div className="mt-1"><span className="font-black">Kapanış:</span> {fmt(t.closed_at)}</div>
              <div className="mt-1"><span className="font-black">closed_by:</span> {t.closed_by || "—"}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Resolution</div>
            <div className="mt-2 whitespace-pre-wrap text-sm">{t.resolution || "—"}</div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={editResolution}
                className={clsx(
                  "rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                  busy && "opacity-60 cursor-not-allowed"
                )}
              >
                Resolution Düzenle
              </button>

              <button
                disabled={busy}
                onClick={toggleStatus}
                className={clsx(
                  String(t.status ?? "open").toLowerCase() === "open"
                    ? "rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400"
                    : "rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400",
                  busy && "opacity-60 cursor-not-allowed"
                )}
              >
                {String(t.status ?? "open").toLowerCase() === "open" ? "Kapat" : "Tekrar Aç"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Mesaj</div>
          <div className="mt-2 whitespace-pre-wrap leading-6">{msg || "—"}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/users/${t.user_id}`}
            className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
          >
            Kullanıcıya Git →
          </Link>

          <button
            onClick={() => router.push("/admin/support")}
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            ← Liste
          </button>
        </div>
      </div>
    </div>
  );
}