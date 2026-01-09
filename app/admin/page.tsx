// app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import DashboardClient from "./ui/dashboard-client";

export const dynamic = "force-dynamic";

type KPI = {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  tone?: "emerald" | "amber" | "rose" | "sky" | "indigo";
};

type RecentUser = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean | null;
  is_premium: boolean | null;
  banned_until: string | null;
  created_at: string | null;
};

type RecentSupport = {
  id: string;
  user_id: string;
  status: string | null;
  subject: string | null;
  message: string | null;
  body: string | null;
  created_at: string;
};

type RecentKyc = {
  id: string;
  user_id: string | null;
  status: string | null;
  submitted_at: string | null;
  created_at: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

function toNum(x: any) {
  const n = Number(x ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function AdminDashboardPage() {
  const gate = await requireAdminOrRedirect("/admin");
  if (!gate.ok) redirect(gate.redirectTo);

  const sb = await adminServerClient();

  // === KPI COUNTS ===
  // total users
  const usersCountRes = await sb.from("profiles").select("id", { count: "exact", head: true });
  const totalUsers = toNum(usersCountRes.count);

  // premium users
  const premiumCountRes = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_premium", true);
  const premiumUsers = toNum(premiumCountRes.count);

  // banned users (banned_until > now)
  const nowIso = new Date().toISOString();
  const bannedCountRes = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gt("banned_until", nowIso);
  const bannedUsers = toNum(bannedCountRes.count);

  // support open
  const supportOpenRes = await sb
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  const supportOpen = toNum(supportOpenRes.count);

  // kyc pending
  const kycPendingRes = await sb
    .from("kyc_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const kycPending = toNum(kycPendingRes.count);

  // === RECENT LISTS ===
  const recentUsersRes = await sb
    .from("profiles")
    .select("id,full_name,company_name,email,phone,is_admin,is_premium,banned_until,created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const recentSupportRes = await sb
    .from("support_tickets")
    .select("id,user_id,status,subject,message,body,created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const recentKycRes = await sb
    .from("kyc_requests")
    .select(
      `
      id,user_id,status,submitted_at,created_at,
      profiles:profiles(id,full_name,company_name,phone,email)
    `
    )
    .order("submitted_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(8);

  const recentUsers = (recentUsersRes.data ?? []) as RecentUser[];
  const recentSupport = (recentSupportRes.data ?? []) as RecentSupport[];
  const recentKyc = (recentKycRes.data ?? []) as unknown as RecentKyc[];

  const kpis: KPI[] = [
    { label: "Toplam Kullanıcı", value: totalUsers, hint: "profiles", href: "/admin/users", tone: "sky" },
    { label: "Premium Kullanıcı", value: premiumUsers, hint: "is_premium = true", href: "/admin/users?q=&page=1", tone: "emerald" },
    { label: "Banlı Kullanıcı", value: bannedUsers, hint: "banned_until > now", href: "/admin/users?q=&page=1", tone: "rose" },
    { label: "Açık Destek", value: supportOpen, hint: "support_tickets status=open", href: "/admin/support?status=open", tone: "amber" },
    { label: "Bekleyen KYC", value: kycPending, hint: "kyc_requests status=pending", href: "/admin/kyc?status=pending", tone: "indigo" },
  ];

  return (
    <div className="space-y-4">
      <DashboardClient kpis={kpis} recentUsers={recentUsers} recentSupport={recentSupport} recentKyc={recentKyc} />

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">⚡ Hızlı Erişim</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">En çok kullanılan admin sayfaları</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              👤 Users
            </Link>
            <Link
              href="/admin/support?status=open"
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              🎫 Support
            </Link>
            <Link
              href="/admin/kyc?status=pending"
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              🪪 KYC
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}