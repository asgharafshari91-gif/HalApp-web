"use client";

import { useMemo } from "react";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function AdminCharts({ initial }: { initial: any }) {
  const series = (initial?.series ?? []) as any[];
  const totalUsers = Number(initial?.totalUsers ?? 0);
  const premiumUsers = Number(initial?.premiumUsers ?? 0);

  const maxReg = useMemo(() => {
    let m = 1;
    for (const r of series) m = Math.max(m, Number(r.registrations ?? 0));
    return m;
  }, [series]);

  const premiumRateTotal = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 10000) / 100 : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">📊 Dashboard</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">Günlük kayıt + premium oranı</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Toplam kullanıcı</div>
            <div className="mt-2 text-2xl font-black">{totalUsers}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Premium kullanıcı</div>
            <div className="mt-2 text-2xl font-black">{premiumUsers}</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Premium oran</div>
            <div className="mt-2 text-2xl font-black">%{premiumRateTotal}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-sm font-black">📈 Günlük Kayıtlar (son 30 gün)</div>

        <div className="mt-4 grid gap-2">
          {series.map((r: any) => {
            const day = String(r.day ?? "");
            const regs = Number(r.registrations ?? 0);
            const prem = Number(r.premium_registrations ?? 0);
            const rate = Number(r.premium_rate ?? 0);
            const w = Math.round((regs / maxReg) * 100);

            return (
              <div key={day} className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-black/70 dark:text-white/70">{day}</div>
                  <div className="text-xs font-black text-black/60 dark:text-white/60">
                    kayıt: {regs} • premium: {prem} • %{rate}
                  </div>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-black/10 dark:bg-white/10">
                  <div className={clsx("h-2 rounded-full", "bg-black/40 dark:bg-white/40")} style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}

          {series.length === 0 ? (
            <div className="text-sm text-black/60 dark:text-white/60">Veri yok.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}