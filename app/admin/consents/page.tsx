"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type Row = {
  user_id: string;
  accepted_at: string;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  explicit_consent: boolean;
  user_agent: string | null;
  updated_at: string;

  profile?: {
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
    is_admin: boolean;
    avatar_url?: string | null;
  } | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function safeName(p?: Row["profile"] | null) {
  const c = (p?.company_name ?? "").trim();
  const f = (p?.full_name ?? "").trim();
  return c || f || "Kullanıcı";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? ""}`.toUpperCase();
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

function Badge({
  children,
  ok,
}: {
  children: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1 text-[11px] font-black",
        ok
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          : "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      )}
    >
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "emerald" | "rose" | "amber" | "sky";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "rose"
        ? "border-rose-500/20 bg-rose-500/10"
        : tone === "amber"
          ? "border-amber-500/20 bg-amber-500/10"
          : "border-sky-500/20 bg-sky-500/10";

  return (
    <div className={clsx("rounded-2xl border p-4", cls)}>
      <div className="text-xs font-black text-black/50 dark:text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

export default function AdminConsentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [onlyAnalytics, setOnlyAnalytics] = useState(false);
  const [onlyMarketing, setOnlyMarketing] = useState(false);
  const [onlyMissingLegal, setOnlyMissingLegal] = useState(false);

  async function requireAdmin() {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;

    if (!uid) {
      router.replace(`/auth?next=${encodeURIComponent("/admin/consents")}`);
      return null;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", uid)
      .maybeSingle();

    if (!prof?.is_admin) {
      router.replace("/");
      return null;
    }

    return uid;
  }

  async function load() {
    setLoading(true);

    try {
      const ok = await requireAdmin();
      if (!ok) return;

      const { data: consents, error: consentError } = await supabase
  .from("user_consents")
  .select(`
    user_id,
    accepted_at,
    updated_at,
    necessary,
    analytics,
    marketing,
    terms_accepted,
    privacy_accepted,
    explicit_consent,
    user_agent
  `)
  .order("updated_at", { ascending: false });

if (consentError) throw consentError;

const userIds = [...new Set((consents ?? []).map((x: any) => x.user_id).filter(Boolean))];

const profileMap: Record<string, any> = {};

if (userIds.length) {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,company_name,phone,email,is_admin,avatar_url")
    .in("id", userIds);

  if (profileError) throw profileError;

  for (const p of profiles ?? []) {
    profileMap[p.id] = p;
  }
}

const merged = (consents ?? []).map((row: any) => ({
  ...row,
  profile: row.user_id ? profileMap[row.user_id] ?? null : null,
}));

setRows(merged as any);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Yüklenemedi",
        message: e?.message ?? "Admin consent listesi yüklenemedi.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (onlyAnalytics && !r.analytics) return false;
      if (onlyMarketing && !r.marketing) return false;
      if (onlyMissingLegal && r.terms_accepted && r.privacy_accepted && r.explicit_consent) return false;

      if (!s) return true;

      const name = safeName(r.profile).toLowerCase();
      const email = (r.profile?.email ?? "").toLowerCase();
      const phone = (r.profile?.phone ?? "").toLowerCase();
      const uid = (r.user_id ?? "").toLowerCase();

      return name.includes(s) || email.includes(s) || phone.includes(s) || uid.includes(s);
    });
  }, [rows, q, onlyAnalytics, onlyMarketing, onlyMissingLegal]);

  const stats = useMemo(() => {
    const total = rows.length || 0;
    const analytics = rows.filter((x) => x.analytics).length;
    const marketing = rows.filter((x) => x.marketing).length;
    const legalMissing = rows.filter((x) => !x.terms_accepted || !x.privacy_accepted || !x.explicit_consent).length;

    return {
      total,
      analytics,
      marketing,
      legalMissing,
      analyticsRate: total ? Math.round((analytics / total) * 100) : 0,
      marketingRate: total ? Math.round((marketing / total) * 100) : 0,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
              ✅ KVKK / Consent operasyon merkezi
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Consent Yönetimi
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/60 dark:text-white/60">
              Kullanıcı sözleşme, gizlilik, açık rıza, analytics ve marketing izinlerini takip et.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {loading ? "Yükleniyor…" : "Yenile"}
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Toplam Consent" value={stats.total} tone="sky" />
          <Stat label="Analytics Açık" value={`${stats.analytics} / ${stats.analyticsRate}%`} tone="emerald" />
          <Stat label="Marketing Açık" value={`${stats.marketing} / ${stats.marketingRate}%`} tone="amber" />
          <Stat label="Eksik Legal" value={stats.legalMissing} tone="rose" />
        </div>
      </section>

      <section className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_180px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: isim, email, telefon, user_id"
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
          />

          <button
            onClick={() => setOnlyAnalytics((s) => !s)}
            className={clsx(
              "h-12 rounded-2xl px-4 text-sm font-black transition",
              onlyAnalytics
                ? "bg-emerald-500 text-black"
                : "border border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
            )}
          >
            Analytics: {onlyAnalytics ? "Açık" : "Hepsi"}
          </button>

          <button
            onClick={() => setOnlyMarketing((s) => !s)}
            className={clsx(
              "h-12 rounded-2xl px-4 text-sm font-black transition",
              onlyMarketing
                ? "bg-amber-500 text-black"
                : "border border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
            )}
          >
            Marketing: {onlyMarketing ? "Açık" : "Hepsi"}
          </button>

          <button
            onClick={() => setOnlyMissingLegal((s) => !s)}
            className={clsx(
              "h-12 rounded-2xl px-4 text-sm font-black transition",
              onlyMissingLegal
                ? "bg-rose-600 text-white"
                : "border border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
            )}
          >
            Eksik Legal: {onlyMissingLegal ? "Açık" : "Hepsi"}
          </button>
        </div>

        <div className="mt-3 text-xs font-semibold text-black/50 dark:text-white/50">
          Gösterilen kayıt: <b>{filtered.length}</b> / toplam <b>{rows.length}</b>
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="text-sm font-black">Consent Listesi</div>
          <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
            Kullanıcı bazlı izin geçmişi
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-sm font-bold text-black/60 dark:text-white/60">
            Consent kayıtları yükleniyor…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl">✅</div>
            <div className="mt-4 text-xl font-black">Kayıt bulunamadı</div>
            <p className="mt-2 text-sm font-semibold text-black/50 dark:text-white/50">
              Arama veya filtreyi değiştir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {filtered.map((r) => {
              const name = safeName(r.profile);

              return (
                <div key={r.user_id} className="p-5 transition hover:bg-emerald-500/5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-black/10 bg-black text-sm font-black text-white dark:border-white/10 dark:bg-white dark:text-black">
                        {r.profile?.avatar_url ? (
                          <img src={r.profile.avatar_url} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          initials(name)
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-black">{name}</div>

                          {r.profile?.is_admin ? (
                            <span className="inline-flex rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[11px] font-black text-indigo-800 dark:text-indigo-200">
                              ADMIN
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">
                          {r.profile?.email || "—"} • {r.profile?.phone || "—"}
                        </div>

                        <div className="mt-1 break-all font-mono text-[11px] text-black/45 dark:text-white/45">
                          {r.user_id}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge ok={r.necessary}>necessary</Badge>
                          <Badge ok={r.analytics}>analytics: {r.analytics ? "yes" : "no"}</Badge>
                          <Badge ok={r.marketing}>marketing: {r.marketing ? "yes" : "no"}</Badge>
                          <Badge ok={r.terms_accepted}>terms: {r.terms_accepted ? "yes" : "no"}</Badge>
                          <Badge ok={r.privacy_accepted}>privacy: {r.privacy_accepted ? "yes" : "no"}</Badge>
                          <Badge ok={r.explicit_consent}>explicit: {r.explicit_consent ? "yes" : "no"}</Badge>
                        </div>

                        {r.user_agent ? (
                          <div className="mt-3 line-clamp-2 text-[11px] text-black/45 dark:text-white/45">
                            UA: <span className="font-mono">{r.user_agent}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-semibold text-black/50 dark:text-white/50 xl:text-right">
                      <div>accepted_at: {fmt(r.accepted_at)}</div>
                      <div className="mt-1">updated_at: {fmt(r.updated_at)}</div>

                      <Link
                        href={`/admin/users/${encodeURIComponent(r.user_id)}`}
                        className="mt-3 inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        Kullanıcı →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}