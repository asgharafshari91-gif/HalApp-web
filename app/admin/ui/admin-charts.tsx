"use client";

import { useMemo } from "react";

type SeriesRow = {
  day?: string | null;
  registrations?: number | null;
  premium_registrations?: number | null;
  premium_rate?: number | null;
};

type AdminChartsInitial = {
  series?: SeriesRow[];
  totalUsers?: number | null;
  premiumUsers?: number | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(v: number) {
  return Number(v ?? 0).toLocaleString("tr-TR");
}

function pct(v: number) {
  return `%${Number(v ?? 0).toFixed(1)}`;
}

function StatCard({
  title,
  value,
  desc,
  tone = "sky",
}: {
  title: string;
  value: React.ReactNode;
  desc?: string;
  tone?: "sky" | "emerald" | "amber";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10"
      : tone === "amber"
        ? "border-amber-500/25 bg-amber-500/10"
        : "border-sky-500/25 bg-sky-500/10";

  return (
    <div className={clsx("relative overflow-hidden rounded-2xl border p-4", cls)}>
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/30 blur-2xl dark:bg-white/5" />

      <div className="relative">
        <div className="text-xs font-black text-black/50 dark:text-white/50">{title}</div>
        <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
        {desc ? (
          <div className="mt-1 text-xs font-semibold text-black/45 dark:text-white/45">
            {desc}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminCharts({
  initial = {},
}: {
  initial?: AdminChartsInitial;
}) {
  const series = (initial?.series ?? []) as SeriesRow[];
  const totalUsers = Number(initial?.totalUsers ?? 0);
  const premiumUsers = Number(initial?.premiumUsers ?? 0);

  const maxReg = useMemo(() => {
    let max = 1;
    for (const row of series) {
      max = Math.max(max, Number(row.registrations ?? 0));
    }
    return max;
  }, [series]);

  const maxPremium = useMemo(() => {
    let max = 1;
    for (const row of series) {
      max = Math.max(max, Number(row.premium_registrations ?? 0));
    }
    return max;
  }, [series]);

  const premiumRateTotal =
    totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 10000) / 100 : 0;

  const totalRegistrations = useMemo(
    () => series.reduce((sum, row) => sum + Number(row.registrations ?? 0), 0),
    [series]
  );

  const totalPremiumRegistrations = useMemo(
    () => series.reduce((sum, row) => sum + Number(row.premium_registrations ?? 0), 0),
    [series]
  );

  return (
    <section className="space-y-4">
      <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-800 dark:text-sky-200">
            📊 Admin büyüme analitiği
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight">
            Kullanıcı ve Premium Performansı
          </h2>

          <p className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
            Günlük kayıtlar, premium aktivasyonları ve genel premium dönüşüm oranı.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard
              title="Toplam Kullanıcı"
              value={fmtNum(totalUsers)}
              desc="Tüm kullanıcı profilleri"
              tone="sky"
            />

            <StatCard
              title="Premium Kullanıcı"
              value={fmtNum(premiumUsers)}
              desc="Aktif premium hesaplar"
              tone="emerald"
            />

            <StatCard
              title="Premium Oranı"
              value={pct(premiumRateTotal)}
              desc="Premium / toplam kullanıcı"
              tone="amber"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[30px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black">📈 Günlük Kayıtlar</div>
              <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
                Son {series.length || 30} gün kayıt ve premium hareketi
              </div>
            </div>

            <div className="flex gap-2">
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-black text-sky-800 dark:text-sky-200">
                Kayıt
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-800 dark:text-emerald-200">
                Premium
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {series.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-10 text-center text-sm font-semibold text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
                Veri yok.
              </div>
            ) : (
              series.map((row) => {
                const day = String(row.day ?? "");
                const regs = Number(row.registrations ?? 0);
                const premium = Number(row.premium_registrations ?? 0);
                const rate = Number(row.premium_rate ?? 0);
                const regWidth = Math.max(3, Math.round((regs / maxReg) * 100));
                const premiumWidth = Math.max(3, Math.round((premium / maxPremium) * 100));

                return (
                  <div
                    key={day}
                    className="rounded-2xl border border-black/10 bg-white/70 p-3 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-black text-black/70 dark:text-white/70">
                        {day || "—"}
                      </div>

                      <div className="text-xs font-black text-black/55 dark:text-white/55">
                        kayıt: {fmtNum(regs)} • premium: {fmtNum(premium)} • {pct(rate)}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${regWidth}%` }}
                        />
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${premiumWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[30px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-black">🎯 Özet</div>

            <div className="mt-4 grid gap-3">
              <StatCard
                title="Dönem Kayıt"
                value={fmtNum(totalRegistrations)}
                desc="Grafikteki toplam kayıt"
                tone="sky"
              />

              <StatCard
                title="Dönem Premium"
                value={fmtNum(totalPremiumRegistrations)}
                desc="Grafikteki premium kayıt"
                tone="emerald"
              />

              <StatCard
                title="Dönem Oranı"
                value={pct(
                  totalRegistrations > 0
                    ? (totalPremiumRegistrations / totalRegistrations) * 100
                    : 0
                )}
                desc="Premium / dönem kayıt"
                tone="amber"
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-sm">
            <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">
              Premium hedef
            </div>

            <div className="mt-2 text-xs font-semibold leading-5 text-emerald-800/75 dark:text-emerald-200/75">
              Premium oranı %10 üzerine çıkarsa HalApp gelir modeli çok daha güçlü görünür.
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, premiumRateTotal)}%` }}
              />
            </div>

            <div className="mt-2 text-xs font-black text-emerald-800 dark:text-emerald-200">
              Şu an: {pct(premiumRateTotal)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}