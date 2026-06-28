import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";

import DashboardClient from "./ui/dashboard-client";
import AdminCommandCenter from "./ui/admin-command-center";
import AdminCharts from "./ui/admin-charts";

export const dynamic = "force-dynamic";

type KPI = {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  tone?: "emerald" | "amber" | "rose" | "sky" | "indigo";
};

function toNum(x: any) {
  const n = Number(x ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function AdminDashboardPage() {
  const gate = await requireAdminOrRedirect("/admin");

  if (!gate.ok) {
    redirect(gate.redirectTo);
  }

  const sb = await adminServerClient();

  const nowIso = new Date().toISOString();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIso = today.toISOString();

  const [
    usersCountRes,
    premiumCountRes,
    bannedCountRes,
    supportOpenRes,
    kycPendingRes,
    todayUsersRes,
    recentUsersRes,
    recentSupportRes,
    recentKycRes,
  ] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),

    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_premium", true),

    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("banned_until", nowIso),

    sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),

    sb
      .from("kyc_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),

    sb
      .from("profiles")
      .select(`
        id,
        full_name,
        company_name,
        email,
        phone,
        avatar_url,
        is_admin,
        is_premium,
        banned_until,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(8),

    sb
      .from("support_tickets")
      .select(`
        id,
        user_id,
        status,
        subject,
        message,
        body,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(8),

    sb
      .from("kyc_requests")
      .select(`
        id,
        user_id,
        status,
        submitted_at,
        created_at,
        profiles:profiles(
          id,
          full_name,
          company_name,
          phone,
          email
        )
      `)
      .order("submitted_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalUsers = toNum(usersCountRes.count);
  const premiumUsers = toNum(premiumCountRes.count);
  const bannedUsers = toNum(bannedCountRes.count);
  const supportOpen = toNum(supportOpenRes.count);
  const kycPending = toNum(kycPendingRes.count);
  const todayUsers = toNum(todayUsersRes.count);

  const kpis: KPI[] = [
    {
      label: "Toplam Kullanıcı",
      value: totalUsers,
      hint: "Profiles",
      href: "/admin/users",
      tone: "sky",
    },
    {
      label: "Premium",
      value: premiumUsers,
      hint: "Aktif premium hesaplar",
      href: "/admin/users",
      tone: "emerald",
    },
    {
      label: "Bugün Kayıt",
      value: todayUsers,
      hint: "Son 24 saat",
      href: "/admin/users",
      tone: "indigo",
    },
    {
      label: "Açık Destek",
      value: supportOpen,
      hint: "Yanıt bekleyen talepler",
      href: "/admin/support?status=open",
      tone: "amber",
    },
    {
      label: "Bekleyen KYC",
      value: kycPending,
      hint: "Kimlik doğrulama",
      href: "/admin/kyc?status=pending",
      tone: "rose",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminCommandCenter />

      <DashboardClient
        kpis={kpis}
        recentUsers={(recentUsersRes.data ?? []) as any}
        recentSupport={(recentSupportRes.data ?? []) as any}
        recentKyc={(recentKycRes.data ?? []) as any}
      />

      <AdminCharts />

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4">
          <div className="text-xl font-black">
            🚀 Hızlı Erişim Merkezi
          </div>

          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            En sık kullanılan yönetim ekranları
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/admin/users"
            className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 transition hover:-translate-y-1"
          >
            <div className="text-3xl">👤</div>
            <div className="mt-2 font-black">Kullanıcılar</div>
          </Link>

          <Link
            href="/admin/kyc?status=pending"
            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 transition hover:-translate-y-1"
          >
            <div className="text-3xl">🪪</div>
            <div className="mt-2 font-black">KYC İnceleme</div>
          </Link>

          <Link
            href="/admin/support?status=open"
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 transition hover:-translate-y-1"
          >
            <div className="text-3xl">🎫</div>
            <div className="mt-2 font-black">Destek</div>
          </Link>

          <Link
            href="/admin/audit"
            className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 transition hover:-translate-y-1"
          >
            <div className="text-3xl">🔒</div>
            <div className="mt-2 font-black">Audit Log</div>
          </Link>

          <Link
            href="/admin/consents"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 transition hover:-translate-y-1"
          >
            <div className="text-3xl">📜</div>
            <div className="mt-2 font-black">KVKK / Consent</div>
          </Link>
        </div>
      </div>
    </div>
  );
}