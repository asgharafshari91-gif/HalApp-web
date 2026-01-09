"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type AuditRow = {
  id: string;

  actor_id: string; // admin uid
  target_user_id: string | null;

  action: string; // "user.ban" | "user.premium.toggle" | ...
  summary: string | null;

  ip: string | null;
  user_agent: string | null;

  created_at: string;

  // JSON alanlar (opsiyonel)
  before: any | null;
  after: any | null;
  meta: any | null;

  // join ile gelirse (opsiyonel)
  actor_profile?: { full_name: string | null; company_name: string | null } | null;
  target_profile?: { full_name: string | null; company_name: string | null } | null;
};

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(dt);
  }
}

function shortId(id?: string | null) {
  if (!id) return "—";
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function pretty(x: any) {
  try {
    if (x == null) return "—";
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function Pill({ children, variant = "sky" }: { children: React.ReactNode; variant?: "sky" | "emerald" | "rose" }) {
  const cls =
    variant === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : variant === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      : "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold", cls)}>
      {children}
    </span>
  );
}

export default function AuditClient({
  initialItems,
  q,
  action,
  actor,
  target,
  from,
  to,
  page,
  pages,
  total,
}: {
  initialItems: any[];
  q: string;
  action: string;
  actor: string;
  target: string;
  from: string;
  to: string;
  page: number;
  pages: number;
  total: number;
}) {
  const router = useRouter();
  const [items] = useState<AuditRow[]>(initialItems as any);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const title = useMemo(() => `🔒 Admin Audit Log (${total})`, [total]);

  function pushParams(next: {
    q?: string;
    action?: string;
    actor?: string;
    target?: string;
    from?: string;
    to?: string;
    page?: number;
  }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.action) sp.set("action", next.action);
    if (next.actor) sp.set("actor", next.actor);
    if (next.target) sp.set("target", next.target);
    if (next.from) sp.set("from", next.from);
    if (next.to) sp.set("to", next.to);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.push(`/admin/audit?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">{title}</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Kim ne yaptı? (ban/premium/kyc/support vs) — hepsi burada.
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_220px_220px]">
          <input
            defaultValue={q}
            placeholder="Ara (action/summary/ip/actor/target)…"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") pushParams({ q: (e.currentTarget.value ?? "").trim(), action, actor, target, from, to, page: 1 });
            }}
          />

          <input
            defaultValue={action}
            placeholder="action (örn: user.ban)"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") pushParams({ q, action: (e.currentTarget.value ?? "").trim(), actor, target, from, to, page: 1 });
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              defaultValue={from}
              type="date"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold outline-none dark:border-white/10 dark:bg-black/30"
              onChange={(e) => pushParams({ q, action, actor, target, from: e.target.value, to, page: 1 })}
            />
            <input
              defaultValue={to}
              type="date"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold outline-none dark:border-white/10 dark:bg-black/30"
              onChange={(e) => pushParams({ q, action, actor, target, from, to: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_1fr_160px]">
          <input
            defaultValue={actor}
            placeholder="actor_id (admin uid)"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") pushParams({ q, action, actor: (e.currentTarget.value ?? "").trim(), target, from, to, page: 1 });
            }}
          />
          <input
            defaultValue={target}
            placeholder="target_user_id (uid)"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") pushParams({ q, action, actor, target: (e.currentTarget.value ?? "").trim(), from, to, page: 1 });
            }}
          />
          <button
            className="rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
            onClick={() => pushParams({ q, action, actor, target, from, to, page: 1 })}
          >
            Yenile
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {items.map((r) => {
            const isOpen = !!open[r.id];
            const actorName = r.actor_profile?.company_name?.trim() || r.actor_profile?.full_name?.trim() || "";
            const targetName = r.target_profile?.company_name?.trim() || r.target_profile?.full_name?.trim() || "";

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-black">{r.action}</div>
                      <Pill variant="sky">{fmt(r.created_at)}</Pill>
                      {r.target_user_id ? <Pill variant="emerald">target: {shortId(r.target_user_id)}</Pill> : <Pill variant="rose">no target</Pill>}
                      <Pill>actor: {shortId(r.actor_id)}</Pill>
                    </div>

                    <div className="mt-1 text-xs text-black/60 dark:text-white/60 space-y-0.5">
                      {actorName ? <div>Actor: {actorName}</div> : null}
                      {targetName ? <div>Target: {targetName}</div> : null}
                      {r.summary ? <div className="truncate">Özet: {r.summary}</div> : null}
                      <div className="truncate">
                        {r.ip ? `IP: ${r.ip}` : ""} {r.user_agent ? `• UA: ${r.user_agent}` : ""}
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="mt-3 grid gap-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="text-xs font-extrabold opacity-70">Before</div>
                          <pre className="mt-2 max-h-[260px] overflow-auto text-[11px] leading-5">{pretty(r.before)}</pre>
                        </div>
                        <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="text-xs font-extrabold opacity-70">After</div>
                          <pre className="mt-2 max-h-[260px] overflow-auto text-[11px] leading-5">{pretty(r.after)}</pre>
                        </div>
                        <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="text-xs font-extrabold opacity-70">Meta</div>
                          <pre className="mt-2 max-h-[260px] overflow-auto text-[11px] leading-5">{pretty(r.meta)}</pre>
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setOpen((s) => ({ ...s, [r.id]: !s[r.id] }))}
                      className="mt-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      {isOpen ? "Gizle" : "Detay"}
                    </button>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    {r.target_user_id ? (
                      <Link
                        href={`/admin/users/${r.target_user_id}`}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Target kullanıcı →
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        const text = pretty(r);
                        navigator.clipboard?.writeText(text).catch(() => {});
                        alert("Kopyalandı (json).");
                      }}
                      className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    >
                      JSON kopyala
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Kayıt bulunamadı.
            </div>
          ) : null}
        </div>

        {/* PAGINATION */}
        <div className="mt-3 flex items-center justify-between px-2 text-sm">
          <div className="text-black/60 dark:text-white/60">
            Sayfa {page}/{pages} • toplam {total}
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              onClick={() => pushParams({ q, action, actor, target, from, to, page: Math.max(1, page - 1) })}
            >
              ←
            </button>
            <button
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              onClick={() => pushParams({ q, action, actor, target, from, to, page: Math.min(pages, page + 1) })}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}