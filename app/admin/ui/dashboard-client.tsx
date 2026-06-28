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
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(dt);
  }
}

function fmtNum(n: number) {
  return Number(n ?? 0).toLocaleString("tr-TR");
}

function toneStyle(tone: KPI["tone"]) {
  switch (tone) {
    case "emerald":
      return {
        card: "border-emerald-500/25 bg-emerald-500/10",
        icon: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
        dot: "bg-emerald-500",
      };
    case "amber":
      return {
        card: "border-amber-500/25 bg-amber-500/10",
        icon: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
        dot: "bg-amber-500",
      };
    case "rose":
      return {
        card: "border-rose-500/25 bg-rose-500/10",
        icon: "bg-rose-500/15 text-rose-800 dark:text-rose-200",
        dot: "bg-rose-500",
      };
    case "indigo":
      return {
        card: "border-indigo-500/25 bg-indigo-500/10",
        icon: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200",
        dot: "bg-indigo-500",
      };
    default:
      return {
        card: "border-sky-500/25 bg-sky-500/10",
        icon: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
        dot: "bg-sky-500",
      };
  }
}

function badgeTone(t: "sky" | "emerald" | "rose" | "amber" | "indigo") {
  if (t === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (t === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (t === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  if (t === "indigo") return "border-indigo-500/25 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "sky" | "emerald" | "rose" | "amber" | "indigo";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
        badgeTone(variant)
      )}
    >
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "H";
  const b = parts[1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-8 text-center text-sm font-semibold text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
      {text}
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-2">
      <div>
        <div className="text-sm font-black">{title}</div>
        <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">{subtitle}</div>
      </div>

      {href ? (
        <Link
          href={href}
          className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
        >
          Tümü →
        </Link>
      ) : null}
    </div>
  );
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
  const totalUsers = kpis.find((x) => x.label.toLowerCase().includes("toplam"))?.value ?? 0;
  const premiumUsers = kpis.find((x) => x.label.toLowerCase().includes("premium"))?.value ?? 0;
  const bannedUsers = kpis.find((x) => x.label.toLowerCase().includes("ban"))?.value ?? 0;
  const openSupport = kpis.find((x) => x.label.toLowerCase().includes("destek"))?.value ?? 0;
  const pendingKyc = kpis.find((x) => x.label.toLowerCase().includes("kyc"))?.value ?? 0;

  const queueTotal = pendingKyc + openSupport;

  const healthText = useMemo(() => {
    if (queueTotal === 0 && bannedUsers === 0) return "Temiz";
    if (queueTotal <= 5) return "Kontrol altında";
    return "Yoğun";
  }, [queueTotal, bannedUsers]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="relative p-5 md:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                🟢 HalApp operasyon merkezi
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 dark:text-white/60">
                Kullanıcı, KYC, destek, premium ve güvenlik işlemlerini tek panelden takip et.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Link
                href="/admin/users"
                className="rounded-2xl bg-black px-4 py-3 text-center text-xs font-black text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                Kullanıcılar
              </Link>

              <Link
                href="/admin/kyc?status=pending"
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                KYC
              </Link>

              <Link
                href="/admin/support?status=open"
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                Destek
              </Link>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-xs font-black text-black/50 dark:text-white/50">Toplam kullanıcı</div>
              <div className="mt-1 text-2xl font-black">{fmtNum(totalUsers)}</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-xs font-black text-black/50 dark:text-white/50">Premium</div>
              <div className="mt-1 text-2xl font-black">{fmtNum(premiumUsers)}</div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="text-xs font-black text-black/50 dark:text-white/50">Bekleyen iş</div>
              <div className="mt-1 text-2xl font-black">{fmtNum(queueTotal)}</div>
            </div>

            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
              <div className="text-xs font-black text-black/50 dark:text-white/50">Sistem durumu</div>
              <div className="mt-1 text-2xl font-black">{healthText}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => {
          const tone = toneStyle(k.tone);

          const card = (
            <div
              className={clsx(
                "group relative overflow-hidden rounded-[26px] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
                "border-black/10 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]",
                tone.card
              )}
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl dark:bg-white/5" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-black/55 dark:text-white/55">{k.label}</div>
                  <span className={clsx("h-2.5 w-2.5 rounded-full", tone.dot)} />
                </div>

                <div className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  {fmtNum(k.value)}
                </div>

                {k.hint ? (
                  <div className="mt-2 truncate text-xs font-semibold text-black/45 dark:text-white/45">
                    {k.hint}
                  </div>
                ) : null}

                {k.href ? (
                  <div className="mt-4 inline-flex rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black group-hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:group-hover:bg-white/[0.08]">
                    Detay →
                  </div>
                ) : null}
              </div>
            </div>
          );

          return k.href ? (
            <Link key={k.label} href={k.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={k.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="rounded-[26px] border border-black/10 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <PanelHeader title="🆕 Son Kullanıcılar" subtitle="Yeni kayıt olan hesaplar" href="/admin/users" />

          <div className="grid gap-2">
            {recentUsers.length === 0 ? (
              <EmptyBox text="Henüz kullanıcı kaydı yok." />
            ) : (
              recentUsers.map((u) => {
                const name = (u.company_name ?? u.full_name ?? "Kullanıcı").toString();
                const banned = !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();

                return (
                  <Link
                    key={u.id}
                    href={`/admin/users/${encodeURIComponent(u.id)}`}
                    className="rounded-2xl border border-black/10 bg-white/65 p-4 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black text-xs font-black text-white dark:bg-white dark:text-black">
                        {initials(name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black">{name}</div>
                            <div className="mt-1 truncate text-xs font-semibold text-black/50 dark:text-white/50">
                              {u.phone || u.email || u.id}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {u.is_admin ? <Badge variant="indigo">ADMIN</Badge> : null}
                            {u.is_premium ? <Badge variant="emerald">PREMIUM</Badge> : null}
                            {banned ? <Badge variant="rose">BAN</Badge> : null}
                          </div>
                        </div>

                        <div className="mt-2 text-xs font-semibold text-black/45 dark:text-white/45">
                          created: {fmt(u.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-black/10 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <PanelHeader title="🎫 Son Destek" subtitle="Açık ve kapalı destek kayıtları" href="/admin/support?status=open" />

          <div className="grid gap-2">
            {recentSupport.length === 0 ? (
              <EmptyBox text="Destek talebi yok." />
            ) : (
              recentSupport.map((t) => {
                const msg = String(t.message ?? t.body ?? "").trim();

                return (
                  <Link
                    key={t.id}
                    href={`/admin/support/${encodeURIComponent(t.id)}`}
                    className="rounded-2xl border border-black/10 bg-white/65 p-4 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{t.subject || "Destek Talebi"}</div>
                        <div className="mt-1 truncate text-xs font-semibold text-black/50 dark:text-white/50">
                          user: {t.user_id}
                        </div>
                        <div className="mt-2 line-clamp-2 text-xs leading-5 text-black/60 dark:text-white/60">
                          {msg || "Mesaj yok."}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-black/45 dark:text-white/45">
                          created: {fmt(t.created_at)}
                        </div>
                      </div>

                      <div className="shrink-0">{supportStatus(t.status)}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-black/10 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <PanelHeader title="🪪 Son KYC" subtitle="Kimlik doğrulama kuyruğu" href="/admin/kyc?status=pending" />

          <div className="grid gap-2">
            {recentKyc.length === 0 ? (
              <EmptyBox text="KYC başvurusu yok." />
            ) : (
              recentKyc.map((r) => {
                const p = r.profiles ?? null;
                const name = (p?.company_name?.trim() || p?.full_name?.trim() || r.user_id || "Kullanıcı") ?? "Kullanıcı";

                return (
                  <Link
                    key={r.id}
                    href={`/admin/kyc/${encodeURIComponent(r.id)}`}
                    className="rounded-2xl border border-black/10 bg-white/65 p-4 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-sm font-black text-emerald-800 dark:text-emerald-200">
                        🪪
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black">{name}</div>
                            <div className="mt-1 truncate text-xs font-semibold text-black/50 dark:text-white/50">
                              user: {r.user_id ?? "—"}
                            </div>
                          </div>

                          <div className="shrink-0">{kycStatus(r.status)}</div>
                        </div>

                        <div className="mt-2 text-xs leading-5 text-black/50 dark:text-white/50">
                          submitted: {fmt(r.submitted_at)}
                          <br />
                          created: {fmt(r.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div>
          <div className="text-lg font-black">⚡ Hızlı Operasyon</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Günlük yönetimde en çok kullanacağın işlemler.
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/kyc?status=pending" className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-sm font-black">KYC Kuyruğu</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">Bekleyen kimlik taleplerini incele.</div>
          </Link>

          <Link href="/admin/support?status=open" className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-sm font-black">Açık Destek</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">Cevap bekleyen destekleri kapat.</div>
          </Link>

          <Link href="/admin/users" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-sm font-black">Kullanıcı Yönetimi</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">Premium, ban ve profil kontrolü.</div>
          </Link>

          <Link href="/admin/audit" className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-sm font-black">Audit Log</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">Admin işlemlerini güvenlik için izle.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}