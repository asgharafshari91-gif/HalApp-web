"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RevenueStats = {
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  estimatedRevenue: number;
  premiumUsers: number;
  activeOrders: number;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(v: number) {
  return Number(v ?? 0).toLocaleString("tr-TR");
}

function fmtMoney(v: number) {
  return `${Number(v ?? 0).toLocaleString("tr-TR")} TL`;
}

async function countQuery(table: string, build?: (q: any) => any) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return Number(count ?? 0);
}

export default function AdminRevenueCenter() {
  const [stats, setStats] = useState<RevenueStats>({
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    estimatedRevenue: 0,
    premiumUsers: 0,
    activeOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const [
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        premiumUsers,
        activeOrders,
      ] = await Promise.all([
        countQuery("payment_orders", (q) => q.eq("status", "pending")),
        countQuery("payment_orders", (q) => q.eq("status", "approved")),
        countQuery("payment_orders", (q) => q.eq("status", "rejected")),
        countQuery("profiles", (q) => q.eq("is_premium", true)),
        countQuery("payment_orders"),
      ]);

      let estimatedRevenue = 0;

      const { data } = await supabase
        .from("payment_orders")
        .select("amount,status")
        .eq("status", "approved")
        .limit(1000);

      for (const row of data ?? []) {
        estimatedRevenue += Number((row as any).amount ?? 0);
      }

      setStats({
        pendingPayments,
        approvedPayments,
        rejectedPayments,
        estimatedRevenue,
        premiumUsers,
        activeOrders,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-revenue-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const approvalRate = useMemo(() => {
    const total = stats.approvedPayments + stats.rejectedPayments;
    if (!total) return 0;
    return Math.round((stats.approvedPayments / total) * 100);
  }, [stats]);

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-black/10 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black">💰 Revenue Center</div>
          <div className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
            Ödeme emirleri, premium kullanıcılar ve tahmini gelir.
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "Yükleniyor…" : "Yenile"}
        </button>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card label="Tahmini Gelir" value={fmtMoney(stats.estimatedRevenue)} tone="emerald" />
        <Card label="Premium Kullanıcı" value={fmtNum(stats.premiumUsers)} tone="sky" />
        <Card label="Bekleyen Ödeme" value={fmtNum(stats.pendingPayments)} tone="amber" />
        <Card label="Onaylanan Ödeme" value={fmtNum(stats.approvedPayments)} tone="emerald" />
        <Card label="Reddedilen Ödeme" value={fmtNum(stats.rejectedPayments)} tone="rose" />
        <Card label="Onay Oranı" value={`%${approvalRate}`} tone="indigo" />
      </div>

      <div className="relative mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">
              Gelir Operasyonu
            </div>
            <div className="mt-1 text-xs font-semibold text-emerald-800/75 dark:text-emerald-200/75">
              Ödeme onay ekranı ve premium aktivasyon akışı hazırsa burası gerçek gelir merkezine dönüşür.
            </div>
          </div>

          <Link
            href="/admin/payments"
            className="rounded-2xl border border-emerald-500/20 bg-white/70 px-4 py-3 text-xs font-black text-emerald-800 hover:bg-white dark:bg-white/[0.04] dark:text-emerald-200"
          >
            Ödemeler →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "emerald" | "sky" | "amber" | "rose" | "indigo";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "sky"
        ? "border-sky-500/20 bg-sky-500/10"
        : tone === "amber"
          ? "border-amber-500/20 bg-amber-500/10"
          : tone === "rose"
            ? "border-rose-500/20 bg-rose-500/10"
            : "border-indigo-500/20 bg-indigo-500/10";

  return (
    <div className={clsx("rounded-2xl border p-4", cls)}>
      <div className="text-xs font-black text-black/50 dark:text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}