"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Stats = {
  users: number;
  premium: number;
  kycPending: number;
  supportOpen: number;
  banned: number;
  todayUsers: number;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(v: number) {
  return Number(v ?? 0).toLocaleString("tr-TR");
}

function todayIsoStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countQuery(table: string, build?: (q: any) => any) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return Number(count ?? 0);
}

function StatCard({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number;
  tone: "sky" | "emerald" | "amber" | "rose" | "indigo";
  href: string;
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/10"
        : tone === "rose"
          ? "border-rose-500/20 bg-rose-500/10"
          : tone === "indigo"
            ? "border-indigo-500/20 bg-indigo-500/10"
            : "border-sky-500/20 bg-sky-500/10";

  return (
    <Link
      href={href}
      className={clsx(
        "group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg",
        cls
      )}
    >
      <div className="text-xs font-black text-black/50 dark:text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black">{fmtNum(value)}</div>
      <div className="mt-2 text-[11px] font-black text-black/40 opacity-0 transition group-hover:opacity-100 dark:text-white/40">
        Detay →
      </div>
    </Link>
  );
}

export default function AdminCommandCenter() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    premium: 0,
    kycPending: 0,
    supportOpen: 0,
    banned: 0,
    todayUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const now = new Date().toISOString();
      const today = todayIsoStart();

      const [users, premium, kycPending, supportOpen, banned, todayUsers] =
        await Promise.all([
          countQuery("profiles"),
          countQuery("profiles", (q) => q.eq("is_premium", true)),
          countQuery("kyc_requests", (q) => q.eq("status", "pending")),
          countQuery("support_tickets", (q) => q.eq("status", "open")),
          countQuery("profiles", (q) => q.gt("banned_until", now)),
          countQuery("profiles", (q) => q.gte("created_at", today)),
        ]);

      setStats({
        users,
        premium,
        kycPending,
        supportOpen,
        banned,
        todayUsers,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-command-center-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "kyc_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load)
      .subscribe((s) => setLive(s === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const health = useMemo(() => {
    const queue = stats.kycPending + stats.supportOpen;
    if (queue === 0 && stats.banned === 0) return "Temiz";
    if (queue <= 10) return "Kontrol altında";
    return "Yoğun";
  }, [stats]);

  const queue = stats.kycPending + stats.supportOpen;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
            🧠 Admin Command Center
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            HalApp Operasyon Merkezi
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/60 dark:text-white/60">
            Kullanıcı, KYC, destek ve risk durumunu canlı takip et. Burası HalApp’ın yönetim kokpiti.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 dark:border-white/10 dark:bg-white/[0.04]">
              <span className={clsx("h-2 w-2 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-zinc-400")} />
              {live ? "Canlı bağlantı aktif" : "Canlı bağlantı bekleniyor"}
            </span>

            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-800 dark:text-sky-200">
              Sistem: {health}
            </span>

            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-800 dark:text-amber-200">
              Bekleyen iş: {fmtNum(queue)}
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:w-[420px]">
          <Link
            href="/admin/kyc?status=pending"
            className="rounded-2xl bg-amber-500 px-4 py-3 text-center text-xs font-black text-black hover:bg-amber-400"
          >
            KYC İncele
          </Link>

          <Link
            href="/admin/support?status=open"
            className="rounded-2xl bg-sky-500 px-4 py-3 text-center text-xs font-black text-white hover:bg-sky-400"
          >
            Destek Aç
          </Link>

          <button
            onClick={load}
            className="rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 dark:bg-white dark:text-black"
          >
            {loading ? "Yükleniyor…" : "Yenile"}
          </button>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Toplam Kullanıcı" value={stats.users} tone="sky" href="/admin/users" />
        <StatCard label="Bugün Kayıt" value={stats.todayUsers} tone="emerald" href="/admin/users" />
        <StatCard label="Premium" value={stats.premium} tone="emerald" href="/admin/users" />
        <StatCard label="Bekleyen KYC" value={stats.kycPending} tone="amber" href="/admin/kyc?status=pending" />
        <StatCard label="Açık Destek" value={stats.supportOpen} tone="indigo" href="/admin/support?status=open" />
        <StatCard label="Banlı" value={stats.banned} tone="rose" href="/admin/users" />
      </div>
    </section>
  );
}