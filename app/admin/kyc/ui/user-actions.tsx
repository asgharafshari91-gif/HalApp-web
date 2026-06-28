"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function isBanned(profile: any) {
  if (!profile?.banned_until) return false;
  const t = new Date(profile.banned_until).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function Badge({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "rose" | "amber" | "indigo" | "sky" | "zinc";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : tone === "rose"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
        : tone === "amber"
          ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : tone === "indigo"
            ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
            : tone === "sky"
              ? "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200"
              : "border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60";

  return (
    <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-black", cls)}>
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "emerald" | "rose" | "amber" | "indigo";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-500 text-black hover:bg-emerald-400"
      : tone === "rose"
        ? "bg-rose-600 text-white hover:bg-rose-500"
        : tone === "amber"
          ? "bg-amber-500 text-black hover:bg-amber-400"
          : tone === "indigo"
            ? "bg-indigo-600 text-white hover:bg-indigo-500"
            : "border border-black/10 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "rounded-2xl px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60",
        cls
      )}
    >
      {children}
    </button>
  );
}

export default function UserActions({ profile }: { profile: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const banned = useMemo(() => isBanned(profile), [profile]);
  const name = String(profile?.company_name || profile?.full_name || "Kullanıcı");
  const premium = !!profile?.is_premium;
  const admin = !!profile?.is_admin;
  const verified = !!profile?.verified;

  async function patch(payload: Record<string, any>) {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(profile.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "failed");

      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  function togglePremium() {
    if (premium) {
      patch({
        is_premium: false,
        premium_until: null,
      });
      return;
    }

    const premium_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    patch({
      is_premium: true,
      premium_until,
    });
  }

  function toggleAdmin() {
    if (!admin) {
      const ok = confirm(`${name} kullanıcısına admin yetkisi vermek istiyor musun?`);
      if (!ok) return;
    }

    patch({
      is_admin: !admin,
    });
  }

  function toggleBan() {
    if (banned) {
      patch({
        banned_until: null,
        ban_reason: null,
      });
      return;
    }

    const reason = prompt("Ban sebebi:", "admin_ban")?.trim() || "admin_ban";
    const banned_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    patch({
      banned_until,
      ban_reason: reason,
    });
  }

  function toggleVerified() {
    patch({
      verified: !verified,
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black">⚡ Kullanıcı Aksiyonları</div>
            <div className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
              Premium, admin, verified ve ban işlemleri.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {premium ? <Badge tone="emerald">PREMIUM</Badge> : <Badge>PREMIUM YOK</Badge>}
            {admin ? <Badge tone="indigo">ADMIN</Badge> : <Badge>USER</Badge>}
            {verified ? <Badge tone="sky">VERIFIED</Badge> : <Badge>UNVERIFIED</Badge>}
            {banned ? <Badge tone="rose">BANNED</Badge> : <Badge tone="emerald">TEMİZ</Badge>}
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ActionButton
            disabled={loading}
            tone={premium ? "default" : "emerald"}
            onClick={togglePremium}
          >
            {loading ? "İşleniyor…" : premium ? "Premium Kapat" : "30 Gün Premium Ver"}
          </ActionButton>

          <ActionButton
            disabled={loading}
            tone={admin ? "default" : "indigo"}
            onClick={toggleAdmin}
          >
            {loading ? "İşleniyor…" : admin ? "Admin Yetkisini Kaldır" : "Admin Yetkisi Ver"}
          </ActionButton>

          <ActionButton
            disabled={loading}
            tone={banned ? "default" : "rose"}
            onClick={toggleBan}
          >
            {loading ? "İşleniyor…" : banned ? "Unban" : "7 Gün Ban"}
          </ActionButton>

          <ActionButton
            disabled={loading}
            tone={verified ? "default" : "amber"}
            onClick={toggleVerified}
          >
            {loading ? "İşleniyor…" : verified ? "Onayı Kaldır" : "Verified Yap"}
          </ActionButton>
        </div>

        <div className="mt-5 grid gap-3 text-xs font-semibold text-black/55 dark:text-white/55 md:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <b>Premium bitiş:</b> {fmt(profile?.premium_until)}
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <b>Ban bitiş:</b> {fmt(profile?.banned_until)}
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.04] md:col-span-2">
            <b>Ban sebebi:</b> {String(profile?.ban_reason ?? "—")}
          </div>
        </div>
      </div>
    </section>
  );
}