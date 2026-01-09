"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardStats = {
  totalUsers: number;
  premiumUsers: number;
  premiumRate: number; // 0-100
  dailySignups: { date: string; count: number }[];
  dailyPremium: { date: string; count: number }[];
  warning?: string;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({
  title,
  value,
  desc,
}: {
  title: string;
  value: any;
  desc?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[22px] border border-black/10 bg-white/80 p-5",
        "shadow-[0_18px_60px_rgba(0,0,0,0.06)]",
        "dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black text-black/90 dark:text-white/90">
        {value}
      </div>
      {desc ? (
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">
          {desc}
        </div>
      ) : null}
    </div>
  );
}

function MiniBars({
  title,
  items,
}: {
  title: string;
  items: { date: string; count: number }[];
}) {
  const max = useMemo(() => Math.max(1, ...items.map((i) => i.count)), [items]);
  return (
    <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-sm font-black">{title}</div>
      <div className="mt-4 flex items-end gap-2">
        {items.map((it) => {
          const h = Math.round((it.count / max) * 80) + 6; // px
          return (
            <div key={it.date} className="flex flex-col items-center gap-2">
              <div
                className="w-5 rounded-xl bg-emerald-500/70"
                style={{ height: `${h}px` }}
                title={`${it.date}: ${it.count}`}
              />
              <div className="text-[10px] font-black text-black/45 dark:text-white/45">
                {it.date.slice(5)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-black/50 dark:text-white/50">
        Son {items.length} gün
      </div>
    </div>
  );
}

export default function AdminCharts() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "dashboard_error");
        if (!cancel) setData(j);
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
      <div className="rounded-[22px] border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-sm font-black">Dashboard yükleniyor…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-[22px] border border-rose-500/30 bg-rose-500/10 p-5">
        <div className="text-sm font-black text-rose-700">Hata</div>
        <div className="mt-2 text-sm text-rose-700/80">{err}</div>
        <div className="mt-3 text-xs text-rose-700/70">
          Not: /api/admin/dashboard route’unu da ekledim (aşağıda).
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {data.warning ? (
        <div className="rounded-[22px] border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="text-sm font-black text-amber-800">Uyarı</div>
          <div className="mt-2 text-sm text-amber-800/80">{data.warning}</div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Toplam Kullanıcı"
          value={data.totalUsers}
          desc="profiles tablosu sayımı"
        />
        <Card
          title="Premium Kullanıcı"
          value={data.premiumUsers}
          desc="is_premium = true"
        />
        <Card
          title="Premium Oranı"
          value={`${data.premiumRate.toFixed(1)}%`}
          desc="premium / total"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MiniBars title="Günlük Kayıt" items={data.dailySignups} />
        <MiniBars title="Günlük Premium" items={data.dailyPremium} />
      </div>
    </div>
  );
}