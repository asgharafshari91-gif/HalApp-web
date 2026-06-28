"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type SupportRow = {
  id: string;
  user_id: string;
  status: string | null;
  subject: string | null;
  message: string | null;
  body: string | null;
  contact: string | null;
  resolution: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

function pill(v: "sky" | "emerald" | "rose" | "amber") {
  if (v === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (v === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (v === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
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
    <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold", pill(variant))}>
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

function normStatus(v: string | null) {
  return (v ?? "open").toLowerCase() === "closed" ? "closed" : "open";
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

export default function SupportClient({
  initialItems,
  q,
  status,
  page,
  pages,
  total,
  limit = 25,
}: {
  initialItems: SupportRow[];
  q: string;
  status: string;
  page: number;
  pages: number;
  total: number;
  limit?: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const title = useMemo(() => `🎫 Destek Talepleri (${total})`, [total]);

  function pushParams(next: { q?: string; status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.limit && next.limit !== 25) sp.set("limit", String(next.limit));
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.push(`/admin/support?${sp.toString()}`);
  }

  async function toggleClose(r: SupportRow) {
    if (busyId) return;

    const next = normStatus(r.status) === "open" ? "closed" : "open";
    const resolution =
      next === "closed" ? prompt("Çözüm / admin notu:", r.resolution ?? "")?.trim() || null : undefined;

    setBusyId(r.id);

    try {
      const j = await apiPatch(r.id, {
        status: next,
        ...(resolution !== undefined ? { resolution } : {}),
      });

      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...j.ticket } : x)));
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "İşlem başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">{title}</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Kullanıcı sorunları, iletişim talepleri ve çözüm takibi.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => pushParams({ q, status: "open", page: 1, limit })}
              className={clsx(
                "rounded-2xl px-4 py-2 text-xs font-black",
                status === "open"
                  ? "bg-amber-500 text-white"
                  : "bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              )}
            >
              Açık
            </button>

            <button
              onClick={() => pushParams({ q, status: "closed", page: 1, limit })}
              className={clsx(
                "rounded-2xl px-4 py-2 text-xs font-black",
                status === "closed"
                  ? "bg-emerald-500 text-white"
                  : "bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              )}
            >
              Kapalı
            </button>

            <button
              onClick={() => pushParams({ q, status: "all", page: 1, limit })}
              className={clsx(
                "rounded-2xl px-4 py-2 text-xs font-black",
                status === "all"
                  ? "bg-sky-500 text-white"
                  : "bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              )}
            >
              Tümü
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px]">
          <input
            defaultValue={q}
            placeholder="Konu / mesaj / kullanıcı ara…"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                pushParams({
                  q: e.currentTarget.value.trim(),
                  status,
                  page: 1,
                  limit,
                });
              }
            }}
          />

          <button
            onClick={() => router.refresh()}
            className="rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {items.map((r) => {
            const p = r.profiles;
            const open = expanded[r.id];
            const st = normStatus(r.status);
            const msg = String(r.message || r.body || "").trim();

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-black">
                        {p?.company_name || p?.full_name || "Kullanıcı"}
                      </div>

                      {st === "closed" ? <Badge variant="emerald">CLOSED</Badge> : <Badge variant="amber">OPEN</Badge>}

                      <Badge variant="sky">ticket: {r.id}</Badge>
                    </div>

                    <div className="mt-2 text-sm font-black">{r.subject || "Destek Talebi"}</div>

                    <div className="mt-1 text-xs leading-6 text-black/60 dark:text-white/60">
                      <div>created: {fmt(r.created_at)}</div>
                      <div>updated: {fmt(r.updated_at)}</div>
                      <div>user: {r.user_id}</div>
                      {p?.phone || p?.email ? (
                        <div>
                          {p?.phone ? `tel: ${p.phone}` : ""} {p?.email ? ` • mail: ${p.email}` : ""}
                        </div>
                      ) : null}
                    </div>

                    {open ? (
                      <div className="mt-3 rounded-2xl border border-black/10 bg-black/5 p-4 text-sm leading-6 whitespace-pre-wrap dark:border-white/10 dark:bg-white/5">
                        {msg || "Mesaj yok."}

                        {r.resolution ? (
                          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                            <b>Çözüm notu:</b> {r.resolution}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                        {msg || "Mesaj yok."}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                        onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
                      >
                        {open ? "Gizle" : "Detay"}
                      </button>

                      <Link
                        href={`/admin/support/${encodeURIComponent(r.id)}`}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Ticket →
                      </Link>

                      <Link
                        href={`/admin/users/${encodeURIComponent(r.user_id)}`}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Kullanıcı →
                      </Link>
                    </div>
                  </div>

                  <button
                    disabled={busyId === r.id}
                    onClick={() => toggleClose(r)}
                    className={clsx(
                      "rounded-2xl px-4 py-3 text-xs font-black text-white disabled:opacity-50",
                      st === "open" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                    )}
                  >
                    {busyId === r.id ? "İşleniyor…" : st === "open" ? "Kapat" : "Tekrar Aç"}
                  </button>
                </div>
              </div>
            );
          })}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-8 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Destek talebi bulunamadı.
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-sm">
          <div className="text-black/60 dark:text-white/60">
            Sayfa {page}/{pages} • toplam {total}
          </div>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => pushParams({ q, status, page: Math.max(1, page - 1), limit })}
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15"
            >
              ←
            </button>

            <button
              disabled={page >= pages}
              onClick={() => pushParams({ q, status, page: Math.min(pages, page + 1), limit })}
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/15"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}