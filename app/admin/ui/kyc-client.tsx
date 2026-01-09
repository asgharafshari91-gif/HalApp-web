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

  // doc url alanları farklı isimlerde olabilir
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
  if (!s) return null;
  // http(s) veya supabase storage public URL vb.
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return s; // bazı projelerde relative saklanıyor olabilir, yine link açsın
}

function isImageUrl(u: string) {
  const x = u.toLowerCase();
  return x.includes(".png") || x.includes(".jpg") || x.includes(".jpeg") || x.includes(".webp") || x.includes(".gif");
}

type DocItem = { key: string; label: string; url: string; kind: "image" | "link" };

function pickDocs(r: KycRow): DocItem[] {
  // ✅ r null olamaz, ama yine de sağlam
  if (!r || typeof r !== "object") return [];

  const candidates: Array<[string, string]> = [
    ["id_card_url", "Kimlik (Ön/Arka)"],
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
    if (!(k in r)) continue; // ✅ burada artık r[k] patlamaz
    const u = safeUrl((r as any)[k]);
    if (!u) continue;
    out.push({ key: k, label, url: u, kind: isImageUrl(u) ? "image" : "link" });
  }
  return out;
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
  const [items] = useState<KycRow[]>(initialItems as any);

  const title = useMemo(() => `🪪 KYC Talepleri (${total})`, [total]);

  function pushParams(next: { q?: string; status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.limit && next.limit !== 25) sp.set("limit", String(next.limit));
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.push(`/admin/kyc?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">{title}</div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_200px_120px]">
          <input
            defaultValue={q}
            placeholder="İsim / mail / telefon / user_id / kyc_id ara…"
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
            const p = r.profiles ?? null;
            const name = (p?.company_name?.trim() || p?.full_name?.trim() || r.user_id || "Kullanıcı") ?? "Kullanıcı";
            const docs = pickDocs(r);

            return (
              <div key={r.id} className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-black">{name}</div>
                      {statusBadge(r.status)}
                      <Badge variant="sky">kyc: {r.id}</Badge>
                      {r.user_id ? <Badge variant="sky">user: {r.user_id}</Badge> : <Badge variant="rose">user_id yok</Badge>}
                    </div>

                    <div className="mt-1 text-xs text-black/60 dark:text-white/60 space-y-1">
                      <div>submitted: {fmt(r.submitted_at)}</div>
                      <div>created: {fmt(r.created_at)}</div>
                      {p?.phone || p?.email ? (
                        <div>
                          {p?.phone ? `tel: ${p.phone}` : ""} {p?.email ? ` • mail: ${p.email}` : ""}
                        </div>
                      ) : null}
                      {normStatus(r.status) === "rejected" ? (
                        <div className="text-rose-600 dark:text-rose-400">reason: {r.reject_reason || "—"}</div>
                      ) : null}
                    </div>

                    {/* ✅ Doküman önizleme */}
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
                                {/* img tag (next/image şart değil) */}
                                <img src={d.url} alt={d.label} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
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
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/kyc/${encodeURIComponent(r.id)}`}
                        className="inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Detay →
                      </Link>

                      {r.user_id ? (
                        <Link
                          href={`/admin/users/${encodeURIComponent(r.user_id)}`}
                          className="inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                        >
                          Kullanıcı →
                        </Link>
                      ) : null}
                    </div>
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