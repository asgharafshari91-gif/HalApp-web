"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type HealthItem = {
  key: string;
  label: string;
  desc: string;
  ok: boolean;
  latency?: number | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

async function ping(name: string, fn: () => any): Promise<HealthItem> {
  const start = performance.now();

  try {
    const result = await fn();

    if (result?.error) {
      throw result.error;
    }

    return {
      key: name,
      label: name,
      desc: "Çalışıyor",
      ok: true,
      latency: Math.round(performance.now() - start),
    };
  } catch {
    return {
      key: name,
      label: name,
      desc: "Kontrol edilemedi",
      ok: false,
      latency: null,
    };
  }
}

export default function AdminSystemHealth() {
  const [items, setItems] = useState<HealthItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const checks = await Promise.all([
      ping("Supabase DB", () =>
        supabase.from("profiles").select("id", { count: "exact", head: true })
      ),
      ping("KYC", () =>
        supabase.from("kyc_requests").select("id", { count: "exact", head: true })
      ),
      ping("Support", () =>
        supabase.from("support_tickets").select("id", { count: "exact", head: true })
      ),
      ping("Audit Log", () =>
        supabase.from("admin_audit_log").select("id", { count: "exact", head: true })
      ),
    ]);

    setItems(checks);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => {
    if (!items.length) return 0;
    return Math.round((items.filter((x) => x.ok).length / items.length) * 100);
  }, [items]);

  return (
    <section className="rounded-[30px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black">🩺 Sistem Sağlığı</div>
          <div className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
            DB, KYC, destek ve audit erişim durumu.
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "Kontrol…" : "Yenile"}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-black/50 dark:text-white/50">
              Sistem Skoru
            </div>
            <div className="mt-1 text-3xl font-black">%{score}</div>
          </div>

          <div
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-black",
              score >= 90
                ? "bg-emerald-500 text-black"
                : score >= 70
                  ? "bg-amber-500 text-black"
                  : "bg-rose-600 text-white"
            )}
          >
            {score >= 90 ? "Sağlıklı" : score >= 70 ? "Dikkat" : "Risk"}
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {items.map((it) => (
          <div
            key={it.key}
            className={clsx(
              "rounded-2xl border p-4",
              it.ok
                ? "border-emerald-500/20 bg-emerald-500/10"
                : "border-rose-500/20 bg-rose-500/10"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black">
                  {it.ok ? "✅" : "❌"} {it.label}
                </div>
                <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">
                  {it.desc}
                </div>
              </div>

              <div className="text-xs font-black text-black/50 dark:text-white/50">
                {it.latency != null ? `${it.latency}ms` : "—"}
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-8 text-center text-sm font-semibold text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Kontrol bekleniyor…
          </div>
        ) : null}
      </div>
    </section>
  );
}