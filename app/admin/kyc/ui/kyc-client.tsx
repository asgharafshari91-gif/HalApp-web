"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type KycRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  account_type: "individual" | "corporate" | null;
  user_role: "buyer" | "seller" | "both" | null;

  kyc_status: "none" | "pending" | "approved" | "rejected" | "verified" | null;
  verified: boolean | null;
  kyc_submitted_at: string | null;

  kyc_id_front_url: string | null;
  kyc_id_back_url: string | null;
  kyc_selfie_url: string | null;

  kyc_trade_registry_url: string | null;
  kyc_tax_plate_url: string | null;
  kyc_activity_cert_url: string | null;
  kyc_signature_circ_url: string | null;

  kyc_comment: string | null;
  kyc_note: string | null;
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

function statusBadge(s: KycRow["kyc_status"], verified?: boolean | null) {
  if (verified || s === "approved" || s === "verified") return <Badge variant="emerald">APPROVED</Badge>;
  if (s === "rejected") return <Badge variant="rose">REJECTED</Badge>;
  if (s === "pending") return <Badge variant="amber">PENDING</Badge>;
  return <Badge variant="sky">{String(s ?? "none").toUpperCase()}</Badge>;
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return dt;
  }
}

async function apiPatch(userId: string, body: any) {
  const res = await fetch(`/api/admin/kyc/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error ?? "request_failed");
  return j;
}

export default function KycClient({
  initialItems,
  q,
  status,
  page,
  pages,
  total,
}: {
  initialItems: any[];
  q: string;
  status: string;
  page: number;
  pages: number;
  total: number;
}) {
  const router = useRouter();

  const [items, setItems] = useState<KycRow[]>(initialItems as KycRow[]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const title = useMemo(() => `🪪 KYC Talepleri (${total})`, [total]);

  function pushParams(next: { q?: string; status?: string; page?: number }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.push(`/admin/kyc?${sp.toString()}`);
  }

  async function approve(row: KycRow) {
    if (busyId) return;
    setBusyId(row.id);

    try {
      await apiPatch(row.id, { status: "approved" });

      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? { ...x, kyc_status: "approved", verified: true }
            : x
        )
      );
    } catch (e: any) {
      alert(e?.message ?? "approve_failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(row: KycRow) {
    if (busyId) return;

    const reason = prompt("Red sebebi:") ?? "";
    setBusyId(row.id);

    try {
      await apiPatch(row.id, {
        status: "rejected",
        reject_reason: reason.trim() || "KYC belgeleri uygun bulunmadı.",
      });

      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                kyc_status: "rejected",
                verified: false,
                kyc_comment: reason.trim() || "KYC belgeleri uygun bulunmadı.",
              }
            : x
        )
      );
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
            placeholder="İsim / mail / telefon / user_id ara…"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.currentTarget.value ?? "").trim();
                pushParams({ q: v, status, page: 1 });
              }
            }}
          />

          <select
            defaultValue={status}
            onChange={(e) => pushParams({ q, status: e.target.value, page: 1 })}
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold outline-none dark:border-white/10 dark:bg-black/30"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>

          <button
            onClick={() => pushParams({ q, status, page: 1 })}
            className="rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {items.map((r) => {
            const name = r.company_name?.trim() || r.full_name?.trim() || "Kullanıcı";
            const isBusy = busyId === r.id;

            const docs = [
              ["Kimlik Ön", r.kyc_id_front_url],
              ["Kimlik Arka", r.kyc_id_back_url],
              ["Selfie", r.kyc_selfie_url],
              ...(r.account_type === "corporate"
                ? ([
                    ["Ticaret Sicil", r.kyc_trade_registry_url],
                    ["Vergi Levhası", r.kyc_tax_plate_url],
                    ["Faaliyet", r.kyc_activity_cert_url],
                    ["İmza", r.kyc_signature_circ_url],
                  ] as any)
                : []),
            ].filter((x) => x[1]);

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
                      <Badge variant="sky">{r.account_type === "corporate" ? "Kurumsal" : "Bireysel"}</Badge>
                    </div>

                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      <div className="truncate">user_id: {r.id}</div>
                      <div className="truncate">
                        {r.phone ? `tel: ${r.phone}` : null} {r.email ? ` • mail: ${r.email}` : null}
                      </div>
                      <div>Gönderim: {fmt(r.kyc_submitted_at)}</div>
                    </div>

                    {r.kyc_comment || r.kyc_note ? (
                      <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold text-black/70 dark:text-white/70">
                        {r.kyc_comment || r.kyc_note}
                      </div>
                    ) : null}

                    {docs.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {docs.map(([label, url]) => (
                          <a
                            key={String(label)}
                            href={String(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                          >
                            {label} Aç →
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-[11px] text-black/55 dark:text-white/55">
                        Belge URL bulunamadı.
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Link
                      href={`/admin/users/${r.id}`}
                      className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      Kullanıcıya Git →
                    </Link>

                    <div className="flex gap-2">
                      <button
                        disabled={isBusy || r.kyc_status === "approved" || r.verified === true}
                        onClick={() => approve(r)}
                        className={clsx(
                          "rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black transition hover:bg-emerald-400",
                          (isBusy || r.kyc_status === "approved" || r.verified === true) &&
                            "cursor-not-allowed opacity-60"
                        )}
                      >
                        {isBusy ? "…" : "Onayla"}
                      </button>

                      <button
                        disabled={isBusy || r.kyc_status === "rejected"}
                        onClick={() => reject(r)}
                        className={clsx(
                          "rounded-2xl bg-rose-500 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-400",
                          (isBusy || r.kyc_status === "rejected") && "cursor-not-allowed opacity-60"
                        )}
                      >
                        {isBusy ? "…" : "Reddet"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              KYC kaydı bulunamadı.
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-sm">
          <div className="text-black/60 dark:text-white/60">
            Sayfa {page}/{pages} • toplam {total}
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              onClick={() => pushParams({ q, status, page: Math.max(1, page - 1) })}
            >
              ←
            </button>

            <button
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              onClick={() => pushParams({ q, status, page: Math.min(pages, page + 1) })}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}