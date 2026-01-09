"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuditRow = {
  id: number | string; // bigint/string da gelebilir
  created_at: string;
  actor_id: string;
  target_user_id: string | null;
  action: string;
  summary: string | null;
  before: any | null;
  after: any | null;
  request_ip: string | null;
  user_agent: string | null;
  meta?: any | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[11px] font-black dark:border-white/10 dark:bg-white/5">
      {children}
    </span>
  );
}

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function JsonBox({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-black text-black/60 dark:text-white/60">{title}</div>
      <pre className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/5 p-3 text-[12px] dark:bg-white/5">
        {value == null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function toNum(v: string | null, fallback: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function AuditClient({
  initialItems,
  total: initialTotal,
  page: initialPage,
  limit: initialLimit,
}: {
  initialItems: AuditRow[];
  total: number;
  page: number;
  limit: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  // URL paramlarını oku
  const page = Math.max(1, toNum(sp.get("page"), initialPage || 1));
  const limit = Math.min(200, Math.max(1, toNum(sp.get("limit"), initialLimit || 50)));

  // form state (URL’den başlat)
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [action, setAction] = useState(sp.get("action") ?? "");
  const [actor, setActor] = useState(sp.get("actor") ?? "");
  const [target, setTarget] = useState(sp.get("target") ?? "");

  // URL değişince inputları senkronla
  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setAction(sp.get("action") ?? "");
    setActor(sp.get("actor") ?? "");
    setTarget(sp.get("target") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  // data state
  const [items, setItems] = useState<AuditRow[]>(initialItems ?? []);
  const [total, setTotal] = useState<number>(initialTotal ?? 0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil((total ?? 0) / (limit ?? 50)));
  const [openId, setOpenId] = useState<number | string | null>(null);

  // URL paramlarından API query üret
  const apiQs = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    // garanti:
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p;
  }, [sp, page, limit]);

  // ✅ Her param değişince API’den çek (cookie ile)
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch(`/api/admin/audit?${apiQs.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });

        const j = await r.json().catch(() => ({}));

        if (!alive) return;

        if (!r.ok || j?.ok === false) {
          setErr(j?.error ?? `http_${r.status}`);
          // not_authed ise listeyi boşaltma, ekranda hata göster
          return;
        }

        setItems(j.items ?? []);
        setTotal(j.total ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "fetch_failed");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [apiQs]);

  // filtre apply -> URL güncelle
  const qsForApply = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (action.trim()) p.set("action", action.trim());
    if (actor.trim()) p.set("actor", actor.trim());
    if (target.trim()) p.set("target", target.trim());
    p.set("page", "1");
    p.set("limit", String(limit));
    return p;
  }, [q, action, actor, target, limit]);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(`/admin/audit?${qsForApply.toString()}`);
  }

  function goPage(nextPage: number) {
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(Math.max(1, Math.min(pages, nextPage))));
    p.set("limit", String(limit));
    router.push(`/admin/audit?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">🔒 Admin Audit Log</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Kim ne yaptı? (ban, premium, kyc, support…)
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading ? <Badge>Yükleniyor…</Badge> : <Badge>Hazır</Badge>}
            <Badge>
              sayfa {page}/{pages}
            </Badge>
            <Badge>toplam {total}</Badge>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-700 dark:text-rose-300">
            Audit API hata: <span className="font-extrabold">{err}</span>
            {err === "not_authed" ? (
              <div className="mt-1 text-xs font-semibold text-rose-700/80 dark:text-rose-300/80">
                Not: Bu genelde cookie/session API’ye gitmediğinde olur. (fetch mutlaka /api/... ve credentials: include olmalı)
              </div>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={applyFilters} className="mt-4 grid gap-2 md:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara (action/summary)…"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          />
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder='action (örn: "user.ban")'
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          />
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="actor_id (uuid)"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="target_user_id (uuid)"
            className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          />

          <div className="md:col-span-4 flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Filtrele
            </button>

            <button
              type="button"
              onClick={() => router.push(`/admin/audit?limit=${limit}`)}
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              Temizle
            </button>

            <div className="ml-auto flex items-center gap-2 text-sm font-black text-black/60 dark:text-white/60">
              toplam {total} • sayfa {page}/{pages}
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {(items ?? []).map((r) => {
            const opened = openId === r.id;
            return (
              <div
                key={String(r.id)}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>#{String(r.id)}</Badge>
                      <Badge>{fmt(r.created_at)}</Badge>
                      <Badge>{r.action}</Badge>
                      {r.request_ip ? <Badge>IP: {r.request_ip}</Badge> : null}
                    </div>

                    <div className="mt-2 text-sm font-black">
                      {r.summary ?? <span className="text-black/50 dark:text-white/50">—</span>}
                    </div>

                    <div className="mt-2 grid gap-1 text-xs text-black/60 dark:text-white/60">
                      <div className="truncate">
                        <span className="font-black">actor:</span> {r.actor_id}
                      </div>
                      <div className="truncate">
                        <span className="font-black">target:</span> {r.target_user_id ?? "—"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setOpenId(opened ? null : r.id)}
                    className={clsx(
                      "rounded-2xl px-4 py-3 text-sm font-black",
                      "bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
                    )}
                  >
                    {opened ? "Kapat" : "Detay"}
                  </button>
                </div>

                {opened ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <JsonBox title="before" value={r.before} />
                    <JsonBox title="after" value={r.after} />
                    {r.meta ? <JsonBox title="meta" value={r.meta} /> : null}
                    {r.user_agent ? <JsonBox title="user_agent" value={r.user_agent} /> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-sm">
          <div className="text-black/60 dark:text-white/60">
            toplam {total} • sayfa {page}/{pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goPage(page - 1)}
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
              disabled={page <= 1}
            >
              ←
            </button>
            <button
              onClick={() => goPage(page + 1)}
              className="rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
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