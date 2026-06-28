"use client";

import { useEffect, useMemo, useState } from "react";

type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  target_table?: string | null;
  target_id?: string | null;
  target_user_id?: string | null;
  summary?: string | null;
  request_ip?: string | null;
  user_agent?: string | null;
  before?: any;
  after?: any;
  details?: any;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
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

function actionTone(action?: string | null) {
  const a = String(action ?? "").toLowerCase();

  if (a.includes("delete") || a.includes("ban") || a.includes("reject")) {
    return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  }

  if (a.includes("approve") || a.includes("premium") || a.includes("verify")) {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }

  if (a.includes("kyc")) {
    return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }

  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

function shortId(v?: string | null) {
  if (!v) return "—";
  if (v.length <= 12) return v;
  return `${v.slice(0, 8)}…${v.slice(-4)}`;
}

function safeDetails(row: AuditRow) {
  const data = row.details ?? {
    before: row.before ?? null,
    after: row.after ?? null,
  };

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data ?? "");
  }
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-black", className)}>
      {children}
    </span>
  );
}

export default function AuditClient() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const r = await fetch("/api/admin/audit?limit=100", {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "audit_error");

      setRows((j.items ?? []) as AuditRow[]);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const risky = rows.filter((x) => {
      const a = String(x.action ?? "").toLowerCase();
      return a.includes("delete") || a.includes("ban") || a.includes("reject");
    }).length;

    const today = rows.filter((x) => {
      const d = new Date(x.created_at);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;

    const actors = new Set(rows.map((x) => x.actor_id).filter(Boolean)).size;

    return { total, risky, today, actors };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((r) => {
      const txt = [
        r.id,
        r.actor_id,
        r.action,
        r.target_table,
        r.target_id,
        r.target_user_id,
        r.summary,
        r.request_ip,
        r.user_agent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return txt.includes(needle);
    });
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-black text-indigo-800 dark:text-indigo-200">
              🔒 Güvenlik ve işlem geçmişi
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Admin Audit Log
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/60 dark:text-white/60">
              Kim hangi kullanıcıya, hangi işlemle, ne zaman müdahale ettiğini buradan takip et.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {loading ? "Yükleniyor…" : "Yenile"}
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Toplam Log" value={stats.total} tone="sky" />
          <Stat label="Bugünkü İşlem" value={stats.today} tone="emerald" />
          <Stat label="Riskli İşlem" value={stats.risky} tone="rose" />
          <Stat label="Aktif Admin" value={stats.actors} tone="indigo" />
        </div>
      </section>

      <section className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-3 md:grid-cols-[1fr_120px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Action, actor, target, IP veya özet ara..."
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
          />

          <button
            onClick={() => setQ("")}
            className="h-12 rounded-2xl border border-black/10 bg-white/70 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
          >
            Temizle
          </button>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[26px] border border-black/10 bg-white/85 p-8 text-sm font-bold dark:border-white/10 dark:bg-white/[0.04]">
          Audit kayıtları yükleniyor…
        </section>
      ) : err ? (
        <section className="rounded-[26px] border border-rose-500/30 bg-rose-500/10 p-6">
          <div className="text-sm font-black text-rose-700 dark:text-rose-200">Hata</div>
          <div className="mt-2 text-sm font-semibold text-rose-700/80 dark:text-rose-200/80">{err}</div>
          <div className="mt-3 text-xs font-semibold text-rose-700/70 dark:text-rose-200/70">
            Not: audit tablosu veya API route eksikse önce onları oluşturacağız.
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black">Log Listesi</div>
                <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
                  {filtered.length} kayıt gösteriliyor
                </div>
              </div>

              <Badge className="border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                limit 100
              </Badge>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl">🔒</div>
              <div className="mt-4 text-xl font-black">Kayıt bulunamadı</div>
              <p className="mt-2 text-sm font-semibold text-black/50 dark:text-white/50">
                Arama filtresini değiştir.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {filtered.map((r) => {
                const open = !!expanded[r.id];
                const target = r.target_table
                  ? `${r.target_table}:${shortId(r.target_id)}`
                  : r.target_user_id
                    ? `user:${shortId(r.target_user_id)}`
                    : "—";

                return (
                  <div key={r.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={actionTone(r.action)}>{r.action || "action"}</Badge>

                          <Badge className="border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300">
                            actor: {shortId(r.actor_id)}
                          </Badge>

                          <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-800 dark:text-sky-200">
                            {target}
                          </Badge>

                          {r.request_ip ? (
                            <Badge className="border-indigo-500/20 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200">
                              IP: {r.request_ip}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="mt-3 text-sm font-black">
                          {r.summary || "Admin işlemi kaydedildi"}
                        </div>

                        <div className="mt-2 text-xs font-semibold text-black/45 dark:text-white/45">
                          {fmt(r.created_at)}
                        </div>

                        {open ? (
                          <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-black/10 bg-black p-4 text-xs leading-5 text-emerald-200 dark:border-white/10">
                            {safeDetails(r)}
                          </pre>
                        ) : null}
                      </div>

                      <button
                        onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        {open ? "Detay Gizle" : "Detay Göster"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "sky" | "emerald" | "rose" | "indigo";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "rose"
        ? "border-rose-500/20 bg-rose-500/10"
        : tone === "indigo"
          ? "border-indigo-500/20 bg-indigo-500/10"
          : "border-sky-500/20 bg-sky-500/10";

  return (
    <div className={clsx("rounded-2xl border p-4", cls)}>
      <div className="text-xs font-black text-black/50 dark:text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}