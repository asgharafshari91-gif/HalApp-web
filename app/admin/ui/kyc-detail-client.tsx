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
  kyc_status?: string | null;
  verified?: boolean | null;

  reject_reason?: string | null;
  kyc_comment?: string | null;
  kyc_note?: string | null;

  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;

  id_front_path?: string | null;
  id_back_path?: string | null;
  selfie_path?: string | null;

  trade_registry_path?: string | null;
  tax_plate_path?: string | null;
  activity_cert_path?: string | null;
  signature_circ_path?: string | null;

  kyc_id_front_url?: string | null;
  kyc_id_back_url?: string | null;
  kyc_selfie_url?: string | null;

  id_card_front_url?: string | null;
  id_card_back_url?: string | null;
  selfie_url?: string | null;

  kyc_trade_registry_url?: string | null;
  kyc_tax_plate_url?: string | null;
  kyc_activity_cert_url?: string | null;
  kyc_signature_circ_url?: string | null;

  profiles?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
    avatar_url?: string | null;
    city?: string | null;
    district?: string | null;
    role?: string | null;
    kyc_status?: string | null;
    verified?: boolean | null;
    is_premium?: boolean | null;
  } | null;

  [k: string]: any;
};

type DocItem = {
  key: string;
  label: string;
  url: string;
  kind: "image" | "link";
};

function pill(variant: "sky" | "emerald" | "rose" | "amber" | "indigo" | "zinc") {
  if (variant === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (variant === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (variant === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  if (variant === "indigo") return "border-indigo-500/25 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200";
  if (variant === "zinc") return "border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "sky" | "emerald" | "rose" | "amber" | "indigo" | "zinc";
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black", pill(variant))}>
      {children}
    </span>
  );
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(dt);
  }
}

function normStatus(v: string | null | undefined, verified?: boolean | null) {
  if (verified) return "approved";
  const s = String(v ?? "pending").toLowerCase();
  if (s === "approved" || s === "verified") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "none") return "none";
  return "pending";
}

function statusBadge(s: string | null | undefined, verified?: boolean | null) {
  const v = normStatus(s, verified);
  if (v === "approved") return <Badge variant="emerald">APPROVED</Badge>;
  if (v === "rejected") return <Badge variant="rose">REJECTED</Badge>;
  if (v === "none") return <Badge variant="sky">NONE</Badge>;
  return <Badge variant="amber">PENDING</Badge>;
}

function safeUrl(...vals: any[]): string | null {
  for (const v of vals) {
    if (!v) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function isImageUrl(u: string) {
  const x = u.toLowerCase();
  return (
    x.includes(".png") ||
    x.includes(".jpg") ||
    x.includes(".jpeg") ||
    x.includes(".webp") ||
    x.includes(".gif")
  );
}

function pickDocs(r: KycRow): DocItem[] {
  const docs: Array<[string, string, string | null]> = [
    ["id_front", "Kimlik Ön", safeUrl(r.id_front_path, r.kyc_id_front_url, r.id_card_front_url)],
    ["id_back", "Kimlik Arka", safeUrl(r.id_back_path, r.kyc_id_back_url, r.id_card_back_url)],
    ["selfie", "Selfie", safeUrl(r.selfie_path, r.kyc_selfie_url, r.selfie_url)],
    ["trade_registry", "Ticaret Sicil", safeUrl(r.trade_registry_path, r.kyc_trade_registry_url)],
    ["tax_plate", "Vergi Levhası", safeUrl(r.tax_plate_path, r.kyc_tax_plate_url)],
    ["activity_cert", "Faaliyet Belgesi", safeUrl(r.activity_cert_path, r.kyc_activity_cert_url)],
    ["signature_circ", "İmza Sirküleri", safeUrl(r.signature_circ_path, r.kyc_signature_circ_url)],
  ];

  return docs
    .filter((x) => Boolean(x[2]))
    .map(([key, label, url]) => ({
      key,
      label,
      url: String(url),
      kind: isImageUrl(String(url)) ? "image" : "link",
    }));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "H";
  const b = parts[1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

async function apiPatchKyc(id: string, body: any) {
  const res = await fetch(`/api/admin/kyc/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      j?.error ||
        j?.message ||
        j?.details?.message ||
        JSON.stringify(j) ||
        `KYC güncelleme başarısız. HTTP ${res.status}`
    );
  }

  return j;
}

export default function KycDetailClient({ initialKyc }: { initialKyc: KycRow | null }) {
  const router = useRouter();

  const [kyc, setKyc] = useState<KycRow | null>(initialKyc);
  const [busy, setBusy] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  const title = useMemo(() => "KYC İnceleme Merkezi", []);

  if (!kyc) {
    return (
      <div className="rounded-[26px] border border-black/10 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xl font-black">🪪 KYC Detay</div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">Kayıt bulunamadı.</div>
        <Link
          href="/admin/kyc"
          className="mt-4 inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
        >
          ← Listeye dön
        </Link>
      </div>
    );
  }

  const k = kyc;
  const p = k.profiles ?? null;
  const currentStatus = normStatus(k.kyc_status ?? k.status, k.verified ?? p?.verified);
  const name = (p?.company_name?.trim() || p?.full_name?.trim() || k.user_id || k.id || "Kullanıcı") ?? "Kullanıcı";
  const docs = pickDocs(k);
  const userId = k.user_id || p?.id || k.id;
  const rejectText = k.kyc_comment || k.reject_reason || k.kyc_note || null;

  async function setStatus(next: "approved" | "rejected" | "pending") {
    if (busy) return;

    let reject_reason: string | null | undefined = undefined;

    if (next === "rejected") {
      const r = prompt("Red sebebi:", rejectText ?? "Kimlik bilgileri okunamıyor.") ?? "";
      reject_reason = r.trim() || "KYC belgeleri uygun bulunmadı.";
    }

    setBusy(true);

    try {
      const j = await apiPatchKyc(userId, {
        status: next,
        ...(reject_reason !== undefined ? { reject_reason } : {}),
      });

      const nextRow = (j.kyc ?? null) as KycRow | null;

      if (nextRow) {
        setKyc((prev) => ({
          ...(prev ?? {}),
          ...nextRow,
          user_id: nextRow.user_id ?? nextRow.id ?? userId,
          status: nextRow.kyc_status ?? nextRow.status ?? next,
        }) as KycRow);
      }

      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "update_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="relative p-5 md:p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                🪪 {title}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-black/10 bg-black text-lg font-black text-white dark:border-white/10 dark:bg-white dark:text-black">
                  {p?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    initials(name)
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black tracking-tight md:text-3xl">{name}</h1>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusBadge(k.kyc_status ?? k.status, k.verified ?? p?.verified)}
                    <Badge variant="sky">kyc: {k.id}</Badge>
                    <Badge variant="sky">user: {userId}</Badge>
                    {k.verified || p?.verified ? <Badge variant="emerald">✓ Onaylı</Badge> : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-2 text-xs font-semibold text-black/55 dark:text-white/55 md:grid-cols-2">
                <div>submitted: {fmt(k.submitted_at)}</div>
                <div>created: {fmt(k.created_at)}</div>
                <div>updated: {fmt(k.updated_at)}</div>
                <div>
                  reviewed: {fmt(k.reviewed_at)} {k.reviewed_by ? `• by: ${k.reviewed_by}` : ""}
                </div>
                <div className="truncate">
                  {p?.phone ? `tel: ${p.phone}` : "tel: —"} {p?.email ? ` • mail: ${p.email}` : ""}
                </div>
              </div>

              {currentStatus === "rejected" ? (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-700 dark:text-rose-200">
                  Red sebebi: {rejectText || "—"}
                </div>
              ) : null}
            </div>

            <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:w-[300px]">
              <Link
                href="/admin/kyc"
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
              >
                ← Liste
              </Link>

              <Link
                href={`/admin/users/${encodeURIComponent(userId)}`}
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
              >
                Kullanıcı →
              </Link>

              <button
                disabled={busy || currentStatus === "approved"}
                onClick={() => setStatus("approved")}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "İşleniyor…" : "Onayla"}
              </button>

              <button
                disabled={busy || currentStatus === "rejected"}
                onClick={() => setStatus("rejected")}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "İşleniyor…" : "Reddet"}
              </button>

              <button
                disabled={busy}
                onClick={() => setStatus("pending")}
                className="rounded-2xl bg-amber-500 px-4 py-3 text-xs font-black text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pending
              </button>

              <button
                type="button"
                onClick={() => setShowRaw((s) => !s)}
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5"
              >
                {showRaw ? "Raw Gizle" : "Raw Göster"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">📎 Kimlik Dokümanları</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Kimlik, selfie ve kurumsal belgeleri kontrol et.
            </div>
          </div>

          <Badge variant={docs.length ? "emerald" : "amber"}>{docs.length} doküman</Badge>
        </div>

        {docs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-10 text-center text-sm font-semibold text-black/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            Doküman linki yok.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {docs.map((d) => (
              <div key={d.key} className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2 border-b border-black/10 p-3 dark:border-white/10">
                  <div className="text-xs font-black text-black/65 dark:text-white/65">{d.label}</div>

                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    Yeni sekme →
                  </a>
                </div>

                {d.kind === "image" ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ url: d.url, label: d.label })}
                    className="block h-64 w-full bg-black/5 dark:bg-white/5"
                    title="Büyüt"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.url} alt={d.label} className="h-full w-full object-contain" />
                  </button>
                ) : (
                  <div className="p-4">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 dark:bg-white dark:text-black"
                    >
                      📎 Dokümanı Aç
                    </a>
                  </div>
                )}

                <div className="break-all border-t border-black/10 p-3 text-[11px] text-black/45 dark:border-white/10 dark:text-white/45">
                  {d.url}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRaw ? (
        <div className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-black">Raw JSON</div>
          <pre className="mt-3 max-h-[500px] overflow-auto rounded-2xl border border-black/10 bg-black p-4 text-xs leading-5 text-emerald-200 dark:border-white/10">
            {JSON.stringify(k, null, 2)}
          </pre>
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur"
          onClick={() => setLightbox(null)}
        >
          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-black text-white">{lightbox.label}</div>

              <button
                className="rounded-2xl bg-white/15 px-4 py-2 text-xs font-black text-white hover:bg-white/25"
                onClick={() => setLightbox(null)}
              >
                Kapat ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/15 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.url} alt={lightbox.label} className="max-h-[82vh] w-full object-contain" />
            </div>

            <a
              href={lightbox.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-2xl bg-white/15 px-4 py-2 text-xs font-black text-white hover:bg-white/25"
            >
              Yeni sekmede aç →
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}