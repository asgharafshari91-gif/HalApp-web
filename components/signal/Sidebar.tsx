"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  activeNow?: number;
};

type Profile = {
  id?: string;
  role?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  company_title?: string | null;
  hall_company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  kyc_status?: string | null;
  verified?: boolean | null;
  is_premium?: boolean | null;
  premium_until?: string | null;
  membership_type?: string | null;
  membership_status?: string | null;
  membership_expires_at?: string | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  isLive?: boolean;
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function isFutureDate(value?: string | null) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

function getInitial(name?: string | null, email?: string | null) {
  const raw = name || email || "H";
  return raw.trim().charAt(0).toUpperCase();
}

function getProfileName(profile: Profile | null, email?: string | null) {
  return (
    profile?.company_name ||
    profile?.company_title ||
    profile?.hall_company_name ||
    profile?.full_name ||
    profile?.email ||
    email ||
    "HalApp Üyesi"
  );
}

function getProfileSub(profile: Profile | null) {
  return (
    profile?.membership_type ||
    profile?.role ||
    profile?.kyc_status ||
    "Market Intelligence"
  );
}

function isVerifiedProfile(profile: Profile | null) {
  return (
    profile?.verified === true ||
    profile?.kyc_status === "approved" ||
    profile?.kyc_status === "verified" ||
    profile?.kyc_status === "onaylandı" ||
    profile?.kyc_status === "onaylandi"
  );
}

function isPremiumProfile(profile: Profile | null) {
  return (
    profile?.is_premium === true ||
    profile?.membership_status === "active" ||
    profile?.membership_status === "approved" ||
    isFutureDate(profile?.premium_until) ||
    isFutureDate(profile?.membership_expires_at)
  );
}

function NavButton({ item, active }: { item: NavItem; active?: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200",
        active
          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_16px_36px_rgba(16,185,129,.28)]"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-white/58 dark:hover:bg-white/[0.07] dark:hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg transition",
          active
            ? "bg-white/20"
            : "bg-zinc-100 group-hover:bg-white dark:bg-white/[0.06] dark:group-hover:bg-white/[0.1]",
        ].join(" ")}
      >
        {item.icon}
      </span>

      <span className="min-w-0 flex-1 truncate">{item.label}</span>

      {item.isLive ? (
        <span
          className={[
            "flex h-2.5 w-2.5 shrink-0 rounded-full",
            active
              ? "bg-white shadow-[0_0_16px_rgba(255,255,255,.9)]"
              : "bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,.8)]",
          ].join(" ")}
        />
      ) : null}

      {item.badge ? (
        <span
          className={[
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
            active
              ? "bg-white/20 text-white"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          ].join(" ")}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function MiniStatus({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>

        <div className="min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
            {label}
          </div>

          <div className="mt-0.5 truncate text-sm font-black text-zinc-950 dark:text-white">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserBox({
  profile,
  email,
  loading,
}: {
  profile: Profile | null;
  email?: string | null;
  loading?: boolean;
}) {
  const name = getProfileName(profile, email);
  const sub = getProfileSub(profile);
  const avatar = profile?.avatar_url || "";
  const initial = getInitial(name, email);
  const premium = isPremiumProfile(profile);
  const verified = isVerifiedProfile(profile);

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-black text-white shadow-[0_14px_30px_rgba(16,185,129,.24)]">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
            {loading ? "Profil yükleniyor..." : name}
          </div>

          <div className="mt-0.5 truncate text-[11px] font-bold text-zinc-500 dark:text-white/45">
            {sub}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black",
                premium
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-zinc-500/10 text-zinc-600 dark:text-white/50",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  premium
                    ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.8)]"
                    : "bg-zinc-400",
                ].join(" ")}
              />
              {premium ? "PREMIUM" : "STANDART"}
            </span>

            {verified ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">
                VERIFIED
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href="/profile"
          className="rounded-xl px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
          title="Profili aç"
        >
          ⌄
        </Link>
      </div>
    </div>
  );
}

export default function Sidebar({ activeNow = 0 }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    loadProfile();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setProfile(null);
        setEmail(null);
        setProfileLoading(false);
        return;
      }

      setEmail(user.email ?? null);
      loadProfile();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile() {
    setProfileLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("SIDEBAR AUTH USER:", user, userError);

    if (!user) {
      setProfile(null);
      setEmail(null);
      setProfileLoading(false);
      return;
    }

    setEmail(user.email ?? null);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        [
          "id",
          "role",
          "full_name",
          "company_name",
          "company_title",
          "hall_company_name",
          "email",
          "phone",
          "phone_number",
          "avatar_url",
          "kyc_status",
          "verified",
          "is_premium",
          "premium_until",
          "membership_type",
          "membership_status",
          "membership_expires_at",
        ].join(",")
      )
      .eq("id", user.id)
      .maybeSingle();

    console.log("SIDEBAR PROFILE DATA:", data);
    console.log("SIDEBAR PROFILE ERROR:", error);

    if (data) {
      setProfile(data as Profile);
      setProfileLoading(false);
      return;
    }

    setProfile({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "HalApp Üyesi",
      email: user.email ?? null,
      avatar_url:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null,
      is_premium: true,
      membership_status: "active",
      membership_type: "Premium Üye",
    });

    setProfileLoading(false);
  }

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        label: "Genel Bakış",
        href: "/signals",
        icon: "🏠",
        badge: "LIVE",
        isLive: true,
      },
      {
        label: "Canlı Pazar Nabzı",
        href: "#market-pulse",
        icon: "📡",
        isLive: true,
      },
      {
        label: "Ticaret Rotaları",
        href: "#trade-routes",
        icon: "🚚",
      },
      {
        label: "Ürün Trendleri",
        href: "#market-trends",
        icon: "📈",
      },
      {
        label: "Türkiye Haritası",
        href: "#turkey-map",
        icon: "🗺️",
      },
      {
        label: "Sinyal Akışı",
        href: "#live-feed",
        icon: "⚡",
      },
      {
        label: "Tüccar Radarı",
        href: "#merchant-radar",
        icon: "🎯",
      },
      {
        label: "Raporlar",
        href: "#reports",
        icon: "📊",
      },
      {
        label: "Uyarılar",
        href: "#alerts",
        icon: "🔔",
      },
      {
        label: "Ayarlar",
        href: "#settings",
        icon: "⚙️",
      },
    ],
    []
  );

  if (collapsed) {
    return (
      <aside className="sticky top-6 h-[calc(100vh-48px)] overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
        <div className="flex h-full flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white shadow-[0_16px_32px_rgba(16,185,129,.28)]"
          >
            🌿
          </button>

          <div className="h-px w-full bg-zinc-200 dark:bg-white/10" />

          {navItems.slice(0, 7).map((item, index) => (
            <Link
              key={`${item.label}-${index}`}
              href={item.href}
              className={[
                "relative flex h-12 w-12 items-center justify-center rounded-2xl text-lg transition",
                index === 0
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.06] dark:text-white/60 dark:hover:bg-white/[0.1]",
              ].join(" ")}
              title={item.label}
            >
              {item.icon}

              {item.isLive ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,.8)]" />
              ) : null}
            </Link>
          ))}

          <div className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-black text-zinc-700 dark:bg-white/[0.06] dark:text-white">
            {fmt(activeNow)}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-6 h-[calc(100vh-48px)] overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-200 p-5 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl shadow-[0_18px_40px_rgba(16,185,129,.28)]">
                🌿
                <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#0b1021]" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                  HALAPP
                </div>

                <div className="mt-0.5 truncate text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                  Market Intelligence
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]"
              title="Sidebar küçült"
            >
              ‹
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStatus icon="🟢" label="Canlı" value={`${fmt(activeNow)} aktif`} />
            <MiniStatus icon="📡" label="Durum" value="Online" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item, index) => (
              <NavButton
                key={`${item.label}-${index}`}
                item={item}
                active={index === 0}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-200 p-4 dark:border-white/10">
          <UserBox profile={profile} email={email} loading={profileLoading} />
        </div>
      </div>
    </aside>
  );
}