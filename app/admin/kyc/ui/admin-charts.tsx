"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardStats = {
  totalUsers: number;
  premiumUsers: number;
  premiumRate: number;
  dailySignups: { date: string; count: number }[];
  dailyPremium: { date: string; count: number }[];
  warning?: string;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString("tr-TR");
  return String(v);
}

function pct(v: number) {
  return `${Number(v ?? 0).toFixed(1)}%`;
}

function Card({
  title,
  value,
  desc,
  tone = "sky",
}: {
  title: string;
  value: React.ReactNode;
  desc?: string;
  tone?: "sky" | "emerald" | "amber" | "rose" | "indigo";
}) {
  const toneCls =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10"
      : tone === "amber"
        ? "border-amber-500/25 bg-amber-500/10"
        : tone === "rose"
          ? "border-rose-500/25 bg-rose-500/10"
          : tone === "indigo"
            ? "border-indigo-500/25 bg-indigo-500/10"
            : "border-sky-500/25 bg-sky-500/10";

  return (
    <div className={clsx("relative overflow-hidden rounded-[26px] border p-5 shadow-sm", toneCls)}>
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl dark:bg-white/5" />

      <div className="relative">
        <div className="text-xs font-black uppercase tracking-wide text-black/50 dark:text-white/50">
          {title}
        </div>

        <div className="mt-3 text-3xl font-black tracking-tight text-black/90 dark:text-white">
          {value}
        </div>

        {desc ? (
          <div className="mt-2 text-xs font-semibold leading-5 text-black/50 dark:text-white/50">
            {desc}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniBars({
  title,
  subtitle,
  items,
  tone = "emerald",
}: {
  title: string;
  subtitle?: string;
  items: { date: string; count: number }[];
  tone?: "emerald" | "sky" | "amber";
}) {
  const max = useMemo(() => Math.max(1, ...items.map((i) => Number(i.count ?? 0))), [items]);

  const bar =
    tone === "sky"
      ? "bg-sky-500/75"
      : tone === "amber"
        ? "bg-amber-500/75"
        : "bg-emerald-500/75";

  const total = useMemo(() => items.reduce((s, x) => s + Number(x.count ?? 0), 0), [items]);

  return (
    <div className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              {subtitle}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-black dark:border-white/10 dark:bg-white/5">
          {fmtNum(total)}
        </div>
      </div>

      <div className="mt-5 flex h-40 items-end gap-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-8 text-sm font-semibold text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Veri yok.
          </div>
        ) : (
          items.map((it) => {
            const h = Math.max(8, Math.round((Number(it.count ?? 0) / max) * 126));

            return (
              <div key={it.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-[126px] w-full items-end">
                  <div
                    className={clsx("w-full rounded-t-xl transition hover:opacity-90", bar)}
                    style={{ height: `${h}px` }}
                    title={`${it.date}: ${it.count}`}
                  />
                </div>

                <div className="text-[10px] font-black text-black/40 dark:text-white/40">
                  {it.date.slice(5)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RateBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Number(value ?? 0)));

  return (
    <div className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black">Premium Dönüşüm Oranı</div>
          <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
            Premium kullanıcı / toplam kullanıcı
          </div>
        </div>

        <div className="text-2xl font-black">{pct(safe)}</div>
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${safe}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-[11px] font-black text-black/40 dark:text-white/40">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default function AdminCharts() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const r = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "dashboard_error");

      setData(j as DashboardStats);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch("/api/admin/dashboard", {
          cache: "no-store",
        });

        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || "dashboard_error");

        if (!cancel) setData(j as DashboardStats);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? "Hata");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[26px] border border-black/10 bg-white/85 p-8 text-sm font-black shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        Dashboard istatistikleri yükleniyor…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-[26px] border border-rose-500/30 bg-rose-500/10 p-5">
        <div className="text-sm font-black text-rose-700 dark:text-rose-200">Dashboard Hatası</div>
        <div className="mt-2 text-sm font-semibold text-rose-700/80 dark:text-rose-200/80">{err}</div>
        <button
          onClick={load}
          className="mt-4 rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white hover:bg-rose-500"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {data.warning ? (
        <div className="rounded-[26px] border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="text-sm font-black text-amber-800 dark:text-amber-200">Uyarı</div>
          <div className="mt-2 text-sm font-semibold text-amber-800/80 dark:text-amber-200/80">
            {data.warning}
          </div>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-black/10 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
              📈 Admin büyüme analitiği
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight">
              Kullanıcı ve Premium Performansı
            </h2>

            <p className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
              Kayıt büyümesi, premium dönüşüm oranı ve günlük premium hareketi.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-2xl bg-black px-5 py-3 text-xs font-black text-white hover:opacity-90 dark:bg-white dark:text-black"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Toplam Kullanıcı"
          value={fmtNum(data.totalUsers)}
          desc="profiles tablosu toplam kullanıcı sayısı"
          tone="sky"
        />

        <Card
          title="Premium Kullanıcı"
          value={fmtNum(data.premiumUsers)}
          desc="is_premium = true olan kullanıcılar"
          tone="emerald"
        />

        <Card
          title="Premium Oranı"
          value={pct(data.premiumRate)}
          desc="Premium / toplam kullanıcı oranı"
          tone="amber"
        />
      </div>

      <RateBar value={data.premiumRate} />

      <div className="grid gap-4 md:grid-cols-2">
        <MiniBars
          title="Günlük Kayıt"
          subtitle={`Son ${data.dailySignups.length} gün kullanıcı kaydı`}
          items={data.dailySignups}
          tone="emerald"
        />

        <MiniBars
          title="Günlük Premium"
          subtitle={`Son ${data.dailyPremium.length} gün premium aktivasyonu`}
          items={data.dailyPremium}
          tone="sky"
        />
      </div>
    </div>
  );
}