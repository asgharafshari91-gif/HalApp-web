"use client";

import { useEffect, useState } from "react";

type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string;
  action: string;
  target_table?: string | null;
  target_id?: string | null;
  details?: any;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function AuditClient() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch("/api/admin/audit?limit=100", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "audit_error");
      setRows(j.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">🔒 Admin Audit Log</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Kim ne yaptı, ne zaman yaptı.
            </div>
          </div>
          <button
            onClick={load}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Yenile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[22px] border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          Yükleniyor…
        </div>
      ) : err ? (
        <div className="rounded-[22px] border border-rose-500/30 bg-rose-500/10 p-5">
          <div className="text-sm font-black text-rose-700">Hata</div>
          <div className="mt-2 text-sm text-rose-700/80">{err}</div>
          <div className="mt-3 text-xs text-rose-700/70">
            Not: audit tablosu yoksa önce SQL’de tabloyu oluşturacağız (sonraki adım).
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid grid-cols-12 gap-2 border-b border-black/10 px-4 py-3 text-xs font-black text-black/50 dark:border-white/10 dark:text-white/50">
            <div className="col-span-3">Zaman</div>
            <div className="col-span-3">Actor</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-3">Target</div>
          </div>

          {rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-black/60 dark:text-white/60">
              Kayıt yok.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className={clsx(
                  "grid grid-cols-12 gap-2 px-4 py-3 text-sm",
                  "border-b border-black/5 dark:border-white/5"
                )}
              >
                <div className="col-span-3 text-black/70 dark:text-white/70">
                  {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="col-span-3 font-semibold text-black/85 dark:text-white/85">
                  {r.actor_id}
                </div>
                <div className="col-span-3 font-extrabold">{r.action}</div>
                <div className="col-span-3 text-black/70 dark:text-white/70">
                  {(r.target_table ?? "-") + ":" + (r.target_id ?? "-")}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}