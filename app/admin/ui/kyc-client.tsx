"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type KycStatus = "none" | "pending" | "approved" | "rejected" | "verified";

type KycRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  email: string | null;

  account_type: "individual" | "corporate" | null;
  user_role: "buyer" | "seller" | "both" | null;
  role?: string | null;

  kyc_status: KycStatus | null;
  verified: boolean | null;

  kyc_submitted_at: string | null;
  kyc_approved_at?: string | null;
  kyc_rejected_at?: string | null;
  kyc_last_updated?: string | null;

  kyc_comment?: string | null;
  kyc_note?: string | null;

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

  [k: string]: any;
};

type DocItem = {
  key: string;
  label: string;
  url: string;
  kind: "image" | "link";
};

function pill(variant: "sky" | "emerald" | "rose" | "amber") {
  if (variant === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (variant === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (variant === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "sky" | "emerald" | "rose" | "amber";
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold", pill(variant))}>
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
  const s = String(v ?? "none").toLowerCase();
  if (s === "approved" || s === "verified") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "pending") return "pending";
  return "none";
}

function statusBadge(s: string | null | undefined, verified?: boolean | null) {
  const v = normStatus(s, verified);
  if (v === "approved") return <Badge variant="emerald">APPROVED</Badge>;
  if (v === "rejected") return <Badge variant="rose">REJECTED</Badge>;
  if (v === "pending") return <Badge variant="amber">PENDING</Badge>;
  return <Badge variant="sky">NONE</Badge>;
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
    ["id_front", "Kimlik Ön", safeUrl(r.kyc_id_front_url, r.id_card_front_url)],
    ["id_back", "Kimlik Arka", safeUrl(r.kyc_id_back_url, r.id_card_back_url)],
    ["selfie", "Selfie", safeUrl(r.kyc_selfie_url, r.selfie_url)],
    ["trade_registry", "Ticaret Sicil", safeUrl(r.kyc_trade_registry_url)],
    ["tax_plate", "Vergi Levhası", safeUrl(r.kyc_tax_plate_url)],
    ["activity_cert", "Faaliyet Belgesi", safeUrl(r.kyc_activity_cert_url)],
    ["signature_circ", "İmza Sirküleri", safeUrl(r.kyc_signature_circ_url)],
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
        `KYC güncelleme başarısız. HTTP ${res.status}`
    );
  }

  return j;
}

export default function KycClient({
  initialItems,
  q,
  status,
  page,
  pages,
  total,
  limit,
}: {
  initialItems: any[];
  q: string;
  status: string;
  page: number;
  pages: number;
  total: number;
  limit: number;
}) {
  const router = useRouter();

  const [items, setItems] = useState<KycRow[]>(initialItems as KycRow[]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const title = useMemo(() => `🪪 KYC Talepleri (${total})`, [total]);

  function pushParams(next: { q?: string; status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();

    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.limit && next.limit !== 25) sp.set("limit", String(next.limit));
    if (next.page && next.page > 1) sp.set("page", String(next.page));

    router.push(`/admin/kyc?${sp.toString()}`);
  }

  async function approve(row: KycRow) {
    if (busyId) return;

    setBusyId(row.id);

    try {
      await apiPatchKyc(row.id, { status: "approved" });

      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                kyc_status: "approved",
                verified: true,
              }
            : x
        )
      );

      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "approve_failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(row: KycRow) {
    if (busyId) return;

    const reason = prompt("Red sebebi:", row.kyc_comment || "Kimlik bilgileri okunamıyor.") ?? "";
    const finalReason = reason.trim() || "KYC belgeleri uygun bulunmadı.";

    setBusyId(row.id);

    try {
      await apiPatchKyc(row.id, {
        status: "rejected",
        reject_reason: finalReason,
      });

      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                kyc_status: "rejected",
                verified: false,
                kyc_comment: finalReason,
              }
            : x
        )
      );

      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "reject_failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">{title}</div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_200px_120px]">
          <input
            defaultValue={q}
            placeholder="İsim / mail / telefon / kullanıcı id ara…"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.currentTarget.value ?? "").trim();
                pushParams({ q: v, status, page: 1, limit });
              }
            }}
          />

          <select
            defaultValue={status}
            onChange={(e) => pushParams({ q, status: e.target.value, page: 1, limit })}
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold outline-none dark:border-white/10 dark:bg-black/30"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>

          <button
            onClick={() => pushParams({ q, status, page: 1, limit })}
            className="rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {items.map((r) => {
            const name = r.company_name?.trim() || r.full_name?.trim() || r.id || "Kullanıcı";
            const docs = pickDocs(r);
            const currentStatus = normStatus(r.kyc_status, r.verified);
            const isBusy = busyId === r.id;

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-black">{name}</div>

                      {statusBadge(r.kyc_status, r.verified)}

                      <Badge variant="sky">
                        {r.account_type === "corporate" ? "Kurumsal" : "Bireysel"}
                      </Badge>

                      <Badge variant="sky">user: {r.id}</Badge>

                      {r.verified ? <Badge variant="emerald">✓ Onaylı</Badge> : null}
                    </div>

                    <div className="mt-1 space-y-1 text-xs text-black/60 dark:text-white/60">
                      <div>submitted: {fmt(r.kyc_submitted_at)}</div>
                      <div>updated: {fmt(r.kyc_last_updated)}</div>

                      {r.phone || r.email ? (
                        <div>
                          {r.phone ? `tel: ${r.phone}` : ""} {r.email ? ` • mail: ${r.email}` : ""}
                        </div>
                      ) : null}

                      {currentStatus === "rejected" ? (
                        <div className="text-rose-600 dark:text-rose-400">
                          reason: {r.kyc_comment || r.kyc_note || "—"}
                        </div>
                      ) : null}
                    </div>

                    {docs.length ? (
                      <div className="mt-3">
                        <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Dokümanlar</div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {docs.slice(0, 4).map((d) =>
                            d.kind === "image" ? (
                              <a
                                key={d.key}
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative h-16 w-16 overflow-hidden rounded-2xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]"
                                title={d.label}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={d.url} alt={d.label} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                              </a>
                            ) : (
                              <a
                                key={d.key}
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                                title={d.label}
                              >
                                📎 {d.label}
                              </a>
                            )
                          )}

                          {docs.length > 4 ? (
                            <span className="inline-flex items-center rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-black text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                              +{docs.length - 4}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs font-semibold text-black/50 dark:text-white/50">
                        Doküman linki yok.
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/kyc/${encodeURIComponent(r.id)}`}
                        className="inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Detay →
                      </Link>

                      <Link
                        href={`/admin/users/${encodeURIComponent(r.id)}`}
                        className="inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Kullanıcı →
                      </Link>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      disabled={isBusy || currentStatus === "approved"}
                      onClick={() => approve(r)}
                      className={clsx(
                        "rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black transition hover:bg-emerald-400",
                        (isBusy || currentStatus === "approved") && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {isBusy ? "…" : "Onayla"}
                    </button>

                    <button
                      disabled={isBusy || currentStatus === "rejected"}
                      onClick={() => reject(r)}
                      className={clsx(
                        "rounded-2xl bg-rose-500 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-400",
                        (isBusy || currentStatus === "rejected") && "cursor-not-allowed opacity-60"
                      )}
                    >
                      {isBusy ? "…" : "Reddet"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              KYC talebi bulunamadı.
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-sm">
          <div className="text-black/60 dark:text-white/60">
            Sayfa {page}/{pages} • toplam {total}
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15"
              onClick={() => pushParams({ q, status, page: Math.max(1, page - 1), limit })}
              disabled={page <= 1}
            >
              ←
            </button>

            <button
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15"
              onClick={() => pushParams({ q, status, page: Math.min(pages, page + 1), limit })}
              disabled={page >= pages}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}