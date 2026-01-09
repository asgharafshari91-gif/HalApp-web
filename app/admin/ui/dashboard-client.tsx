// app/admin/ui/dashboard-client.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

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

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(dt);
  }
}

function toneClass(tone: KPI["tone"]) {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/20 bg-emerald-500/10";
    case "amber":
      return "border-amber-500/20 bg-amber-500/10";
    case "rose":
      return "border-rose-500/20 bg-rose-500/10";
    case "indigo":
      return "border-indigo-500/20 bg-indigo-500/10";
    default:
      return "border-sky-500/20 bg-sky-500/10";
  }
}

function badgeTone(t: "sky" | "emerald" | "rose" | "amber") {
  if (t === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (t === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (t === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

function Badge({ children, variant }: { children: React.ReactNode; variant: "sky" | "emerald" | "rose" | "amber" }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold", badgeTone(variant))}>
      {children}
    </span>
  );
}

function supportStatus(s?: string | null) {
  const v = String(s ?? "open").toLowerCase();
  return v === "closed" ? <Badge variant="emerald">CLOSED</Badge> : <Badge variant="amber">OPEN</Badge>;
}

function kycStatus(s?: string | null) {
  const v = String(s ?? "pending").toLowerCase();
  if (v === "approved") return <Badge variant="emerald">APPROVED</Badge>;
  if (v === "rejected") return <Badge variant="rose">REJECTED</Badge>;
  return <Badge variant="amber">PENDING</Badge>;
}

export default function DashboardClient({
  kpis,
  recentUsers,
  recentSupport,
  recentKyc,
}: {
  kpis: KPI[];
  recentUsers: RecentUser[];
  recentSupport: RecentSupport[];
  recentKyc: RecentKyc[];
}) {
  const title = useMemo(() => "📊 Admin Dashboard", []);

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">{title}</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">Özet metrikler ve son aktiviteler</div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/users"
              className="rounded-2xl bg-black/10 px-4 py-2 text-xs font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Users
            </Link>
            <Link
              href="/admin/support?status=open"
              className="rounded-2xl bg-black/10 px-4 py-2 text-xs font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Support
            </Link>
            <Link
              href="/admin/kyc?status=pending"
              className="rounded-2xl bg-black/10 px-4 py-2 text-xs font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              KYC
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => {
          const Card = (
            <div
              className={clsx(
                "rounded-[22px] border p-5",
                "border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]",
                toneClass(k.tone)
              )}
            >
              <div className="text-xs font-black text-black/60 dark:text-white/60">{k.label}</div>
              <div className="mt-2 text-3xl font-black tracking-tight">{k.value.toLocaleString("tr-TR")}</div>
              {k.hint ? <div className="mt-2 text-xs text-black/50 dark:text-white/50">{k.hint}</div> : null}
              {k.href ? (
                <div className="mt-4">
                  <span className="inline-flex rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                    Detay →
                  </span>
                </div>
              ) : null}
            </div>
          );

          return k.href ? (
            <Link key={k.label} href={k.href} className="block">
              {Card}
            </Link>
          ) : (
            <div key={k.label}>{Card}</div>
          );
        })}
      </div>

      {/* Recent Lists */}
      <div className="grid gap-3 xl:grid-cols-3">
        {/* Recent Users */}
        <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="px-2 py-2">
            <div className="text-sm font-black">🆕 Son Kullanıcılar</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">Yeni kayıtlar</div>
          </div>

          <div className="grid gap-2">
            {recentUsers.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                Kayıt yok.
              </div>
            ) : (
              recentUsers.map((u) => {
                const name = (u.company_name ?? u.full_name ?? "—").toString();
                const banned = !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();

                return (
                  <Link
                    key={u.id}
                    href={`/admin/users/${encodeURIComponent(u.id)}`}
                    className="rounded-2xl border border-black/10 bg-white/70 p-4 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{name}</div>
                        <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">{u.id}</div>
                        <div className="mt-1 text-xs text-black/50 dark:text-white/50">
                          {u.phone ? `tel: ${u.phone}` : ""} {u.email ? ` • mail: ${u.email}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-black/50 dark:text-white/50">created: {fmt(u.created_at)}</div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {u.is_admin ? <Badge variant="sky">ADMIN</Badge> : null}
                        {u.is_premium ? <Badge variant="emerald">PREMIUM</Badge> : null}
                        {banned ? <Badge variant="rose">BAN</Badge> : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Support */}
        <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="px-2 py-2">
            <div className="text-sm font-black">🎫 Son Support</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">En son destek talepleri</div>
          </div>

          <div className="grid gap-2">
            {recentSupport.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                Kayıt yok.
              </div>
            ) : (
              recentSupport.map((t) => {
                const msg = String((t.message ?? t.body ?? "")).trim();
                return (
                  <Link
                    key={t.id}
                    href={`/admin/support/${encodeURIComponent(t.id)}`}
                    className="rounded-2xl border border-black/10 bg-white/70 p-4 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{t.subject || "Destek Talebi"}</div>
                        <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">ticket: {t.id}</div>
                        <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">user: {t.user_id}</div>
                        <div className="mt-2 line-clamp-2 text-xs text-black/60 dark:text-white/60">{msg || "—"}</div>
                        <div className="mt-2 text-xs text-black/50 dark:text-white/50">created: {fmt(t.created_at)}</div>
                      </div>
                      <div className="shrink-0">{supportStatus(t.status)}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent KYC */}
        <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="px-2 py-2">
            <div className="text-sm font-black">🪪 Son KYC</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">KYC başvuruları</div>
          </div>

          <div className="grid gap-2">
            {recentKyc.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                Kayıt yok.
              </div>
            ) : (
              recentKyc.map((r) => {
                const p = r.profiles ?? null;
                const name = (p?.company_name?.trim() || p?.full_name?.trim() || r.user_id || "Kullanıcı") ?? "Kullanıcı";

                return (
                  <Link
                    key={r.id}
                    href={`/admin/kyc/${encodeURIComponent(r.id)}`}
                    className="rounded-2xl border border-black/10 bg-white/70 p-4 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{name}</div>
                        <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">kyc: {r.id}</div>
                        <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">user: {r.user_id ?? "—"}</div>
                        <div className="mt-2 text-xs text-black/50 dark:text-white/50">
                          submitted: {fmt(r.submitted_at)} • created: {fmt(r.created_at)}
                        </div>
                      </div>
                      <div className="shrink-0">{kycStatus(r.status)}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}