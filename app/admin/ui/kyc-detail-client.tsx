"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type KycRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  reject_reason?: string | null;

  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  reviewed_at?: string | null;
  reviewed_by?: string | null;

  profiles?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;

  [k: string]: any;
};

function pill(variant: "sky" | "emerald" | "rose" | "amber") {
  if (variant === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (variant === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (variant === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

function Badge({ children, variant }: { children: React.ReactNode; variant: "sky" | "emerald" | "rose" | "amber" }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold", pill(variant))}>
      {children}
    </span>
  );
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(dt);
  }
}

function normStatus(v: string | null) {
  const s = String(v ?? "pending").toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

function statusBadge(s: string | null) {
  const v = normStatus(s);
  if (v === "approved") return <Badge variant="emerald">APPROVED</Badge>;
  if (v === "rejected") return <Badge variant="rose">REJECTED</Badge>;
  return <Badge variant="amber">PENDING</Badge>;
}

function safeUrl(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function isImageUrl(u: string) {
  const x = u.toLowerCase();
  return x.includes(".png") || x.includes(".jpg") || x.includes(".jpeg") || x.includes(".webp") || x.includes(".gif");
}

type DocItem = { key: string; label: string; url: string; kind: "image" | "link" };

function pickDocs(r: KycRow): DocItem[] {
  if (!r || typeof r !== "object") return [];

  const candidates: Array<[string, string]> = [
    ["id_card_url", "Kimlik"],
    ["id_front_url", "Kimlik Ön"],
    ["id_back_url", "Kimlik Arka"],
    ["selfie_url", "Selfie"],
    ["passport_url", "Pasaport"],
    ["proof_of_address_url", "Adres Belgesi"],
    ["doc_url", "Doküman"],
    ["document_url", "Doküman"],
  ];

  const out: DocItem[] = [];
  for (const [k, label] of candidates) {
    if (!(k in r)) continue;
    const u = safeUrl((r as any)[k]);
    if (!u) continue;
    out.push({ key: k, label, url: u, kind: isImageUrl(u) ? "image" : "link" });
  }
  return out;
}

async function apiPatchKyc(id: string, body: any) {
  const res = await fetch(`/api/admin/kyc/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error ?? "request_failed");
  return j;
}

export default function KycDetailClient({ initialKyc }: { initialKyc: KycRow | null }) {
  const router = useRouter();
  const [kyc, setKyc] = useState<KycRow | null>(initialKyc);
  const [busy, setBusy] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  const title = useMemo(() => `🪪 KYC Detay`, []);

  if (!kyc) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">{title}</div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">Kayıt bulunamadı.</div>
        <div className="mt-4">
          <Link
            href="/admin/kyc"
            className="inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
          >
            ← Listeye dön
          </Link>
        </div>
      </div>
    );
  }

  const k = kyc;
  const p = k.profiles ?? null;
  const name = (p?.company_name?.trim() || p?.full_name?.trim() || k.user_id || "Kullanıcı") ?? "Kullanıcı";
  const docs = pickDocs(k);

  async function setStatus(next: "approved" | "rejected" | "pending") {
    if (busy) return;

    let reject_reason: string | null | undefined = undefined;
    if (next === "rejected") {
      const r = prompt("Red sebebi (opsiyonel):", k.reject_reason ?? "") ?? "";
      reject_reason = r.trim() || null;
    }

    setBusy(true);
    try {
      const j = await apiPatchKyc(k.id, { status: next, ...(reject_reason !== undefined ? { reject_reason } : {}) });
      const nextRow = (j.kyc ?? null) as any;
      if (nextRow) setKyc((prev) => (prev ? { ...prev, ...nextRow } : prev));
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "update_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black">{title}</div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="text-sm font-black">{name}</div>
              {statusBadge(k.status)}
              <Badge variant="sky">kyc: {k.id}</Badge>
              {k.user_id ? <Badge variant="sky">user: {k.user_id}</Badge> : <Badge variant="rose">user_id yok</Badge>}
            </div>

            <div className="mt-2 text-xs text-black/60 dark:text-white/60 space-y-1">
              <div>submitted: {fmt(k.submitted_at)}</div>
              <div>created: {fmt(k.created_at)}</div>
              <div>updated: {fmt(k.updated_at)}</div>
              <div>
                reviewed: {fmt(k.reviewed_at)} {k.reviewed_by ? `• by: ${k.reviewed_by}` : ""}
              </div>

              {normStatus(k.status) === "rejected" ? (
                <div className="text-rose-600 dark:text-rose-400">reason: {k.reject_reason || "—"}</div>
              ) : null}

              {p?.phone || p?.email ? (
                <div>
                  {p?.phone ? `tel: ${p.phone}` : ""} {p?.email ? ` • mail: ${p.email}` : ""}
                </div>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/admin/kyc"
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              ← Liste
            </Link>

            {k.user_id ? (
              <Link
                href={`/admin/users/${encodeURIComponent(k.user_id)}`}
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
              >
                Kullanıcı →
              </Link>
            ) : null}

            <button
              disabled={busy}
              onClick={() => setStatus("approved")}
              className={clsx(
                "rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400 transition",
                busy && "opacity-60 cursor-not-allowed"
              )}
            >
              Approve
            </button>

            <button
              disabled={busy}
              onClick={() => setStatus("rejected")}
              className={clsx(
                "rounded-2xl bg-rose-500 px-4 py-2 text-xs font-black text-black hover:bg-rose-400 transition",
                busy && "opacity-60 cursor-not-allowed"
              )}
            >
              Reject
            </button>

            <button
              disabled={busy}
              onClick={() => setStatus("pending")}
              className={clsx(
                "rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400 transition",
                busy && "opacity-60 cursor-not-allowed"
              )}
            >
              Pending
            </button>

            <button
              type="button"
              onClick={() => setShowRaw((s) => !s)}
              className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              {showRaw ? "Raw Gizle" : "Raw Göster"}
            </button>
          </div>
        </div>
      </div>

      {/* Docs */}
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-sm font-black">Dokümanlar</div>

        {docs.length === 0 ? (
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">Doküman linki yok.</div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <div key={d.key} className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-extrabold text-black/60 dark:text-white/60">{d.label}</div>

                {d.kind === "image" ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ url: d.url, label: d.label })}
                    className="mt-2 block w-full overflow-hidden rounded-2xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]"
                    title="Büyüt"
                  >
                    <img src={d.url} alt={d.label} className="h-48 w-full object-cover" />
                  </button>
                ) : (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    📎 Aç →
                  </a>
                )}

                <div className="mt-2 text-[11px] text-black/55 dark:text-white/55 break-all">{d.url}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw */}
      {showRaw ? (
        <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-black">Raw JSON</div>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-5">{JSON.stringify(k, null, 2)}</pre>
        </div>
      ) : null}

      {/* Lightbox */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 p-4 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm font-black">{lightbox.label}</div>
              <button
                className="rounded-xl bg-white/15 px-3 py-2 text-white text-xs font-black hover:bg-white/20"
                onClick={() => setLightbox(null)}
              >
                Kapat ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/20 bg-black">
              <img src={lightbox.url} alt={lightbox.label} className="w-full max-h-[80vh] object-contain bg-black" />
            </div>
            <div className="mt-2">
              <a
                href={lightbox.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl bg-white/15 px-3 py-2 text-white text-xs font-black hover:bg-white/20"
              >
                Yeni sekmede aç →
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}