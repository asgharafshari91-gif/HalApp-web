// app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";

import DashboardClient from "./ui/dashboard-client";
import AdminCommandCenter from "./ui/admin-command-center";
import AdminCharts from "./ui/admin-charts";
import AdminLiveActivity from "./ui/admin-live-activity";
import AdminSystemHealth from "./ui/admin-system-health";
import AdminRevenueCenter from "./ui/admin-revenue-center";

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

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfDaysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dayKey(dt: string | null | undefined) {
  if (!dt) return "";
  try {
    return new Date(dt).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function lastNDays(n: number) {
  const out: string[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }

  return out;
}

export default async function AdminDashboardPage() {
  const gate = await requireAdminOrRedirect("/admin");

  if (!gate.ok) {
    redirect(gate.redirectTo);
  }

  const sb = await adminServerClient();

  const nowIso = new Date().toISOString();
  const todayIso = startOfTodayIso();
  const since30Iso = startOfDaysAgoIso(29);

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
    chartUsersRes,
    chartPremiumRes,
  ] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),

    sb.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),

    sb.from("profiles").select("id", { count: "exact", head: true }).gt("banned_until", nowIso),

    sb.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),

    sb.from("profiles").select("id", { count: "exact", head: true }).eq("kyc_status", "pending"),

    sb.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayIso),

    sb
      .from("profiles")
      .select(
        [
          "id",
          "full_name",
          "company_name",
          "email",
          "phone",
          "avatar_url",
          "is_admin",
          "is_premium",
          "banned_until",
          "created_at",
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(8),

    sb
      .from("support_tickets")
      .select(["id", "user_id", "status", "subject", "message", "body", "created_at"].join(","))
      .order("created_at", { ascending: false })
      .limit(8),

    sb
      .from("profiles")
      .select(
        [
          "id",
          "full_name",
          "company_name",
          "phone",
          "email",
          "avatar_url",
          "account_type",
          "user_role",
          "role",
          "kyc_status",
          "verified",
          "kyc_submitted_at",
          "created_at",
        ].join(",")
      )
      .eq("kyc_status", "pending")
      .order("kyc_submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(8),

    sb.from("profiles").select("id,created_at").gte("created_at", since30Iso).order("created_at", { ascending: true }).limit(5000),

    sb
      .from("profiles")
      .select("id,created_at,premium_until,is_premium")
      .gte("created_at", since30Iso)
      .eq("is_premium", true)
      .order("created_at", { ascending: true })
      .limit(5000),
  ]);

  const totalUsers = toNum(usersCountRes.count);
  const premiumUsers = toNum(premiumCountRes.count);
  const bannedUsers = toNum(bannedCountRes.count);
  const supportOpen = toNum(supportOpenRes.count);
  const kycPending = toNum(kycPendingRes.count);
  const todayUsers = toNum(todayUsersRes.count);

  const recentKyc = (recentKycRes.data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.id,
    status: row.kyc_status ?? "pending",
    kyc_status: row.kyc_status ?? "pending",
    account_type: row.account_type ?? "individual",
    submitted_at: row.kyc_submitted_at ?? row.created_at ?? null,
    created_at: row.created_at ?? null,
    verified: row.verified ?? false,
    profiles: {
      id: row.id,
      full_name: row.full_name,
      company_name: row.company_name,
      phone: row.phone,
      email: row.email,
      avatar_url: row.avatar_url,
      role: row.user_role ?? row.role,
      kyc_status: row.kyc_status,
      verified: row.verified,
    },
  }));

  const days = lastNDays(30);
  const registrationsByDay: Record<string, number> = {};
  const premiumByDay: Record<string, number> = {};

  for (const d of days) {
    registrationsByDay[d] = 0;
    premiumByDay[d] = 0;
  }

  for (const row of chartUsersRes.data ?? []) {
    const d = dayKey((row as any).created_at);
    if (d && d in registrationsByDay) registrationsByDay[d] += 1;
  }

  for (const row of chartPremiumRes.data ?? []) {
    const d = dayKey((row as any).created_at);
    if (d && d in premiumByDay) premiumByDay[d] += 1;
  }

  const chartSeries = days.map((d) => {
    const registrations = registrationsByDay[d] ?? 0;
    const premiumRegistrations = premiumByDay[d] ?? 0;

    return {
      day: d,
      registrations,
      premium_registrations: premiumRegistrations,
      premium_rate: registrations > 0 ? Math.round((premiumRegistrations / registrations) * 10000) / 100 : 0,
    };
  });

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
      hint: "Bugünkü yeni kullanıcılar",
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
        recentKyc={recentKyc as any}
      />

      <AdminCharts
        initial={{
          totalUsers,
          premiumUsers,
          series: chartSeries,
        }}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <AdminLiveActivity />

        <div className="space-y-5">
          <AdminSystemHealth />
          <AdminRevenueCenter />
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4">
          <div className="text-xl font-black">🚀 Hızlı Erişim Merkezi</div>

          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            En sık kullanılan yönetim ekranları
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Link
            href="/admin/users"
            className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">👤</div>
            <div className="mt-2 font-black">Kullanıcılar</div>
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              Profil, premium ve ban yönetimi
            </div>
          </Link>

          <Link
            href="/admin/kyc?status=pending"
            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">🪪</div>
            <div className="mt-2 font-black">KYC İnceleme</div>
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              Kimlik doğrulama kuyruğu
            </div>
          </Link>

          <Link
            href="/admin/support?status=open"
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">🎫</div>
            <div className="mt-2 font-black">Destek</div>
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              Açık destek talepleri
            </div>
          </Link>

          <Link
            href="/admin/audit"
            className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">🔒</div>
            <div className="mt-2 font-black">Audit Log</div>
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              Admin işlem geçmişi
            </div>
          </Link>

          <Link
            href="/admin/consents"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl">📜</div>
            <div className="mt-2 font-black">KVKK / Consent</div>
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              Kullanıcı izinleri
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}