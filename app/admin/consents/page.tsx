"use client";

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
  } | null;
};

function safeName(p?: Row["profile"] | null) {
  const c = (p?.company_name ?? "").trim();
  const f = (p?.full_name ?? "").trim();
  return c || f || "Kullanıcı";
}

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function AdminConsentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [onlyAnalytics, setOnlyAnalytics] = useState(false);
  const [onlyMarketing, setOnlyMarketing] = useState(false);

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

      // join: user_consents + profiles
      const { data, error } = await supabase
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
          user_agent,
          profile:profiles (
            full_name,
            company_name,
            phone,
            email,
            is_admin
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setRows((data ?? []) as any);
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

      if (!s) return true;
      const name = safeName(r.profile).toLowerCase();
      const email = (r.profile?.email ?? "").toLowerCase();
      const phone = (r.profile?.phone ?? "").toLowerCase();
      const uid = (r.user_id ?? "").toLowerCase();
      return name.includes(s) || email.includes(s) || phone.includes(s) || uid.includes(s);
    });
  }, [rows, q, onlyAnalytics, onlyMarketing]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Consent Yönetimi</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Toplam kayıt: <b>{filtered.length}</b>
          </div>
        </div>

        <button
          onClick={load}
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
        >
          Yenile
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ara: isim, email, telefon, user_id"
          className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30 dark:text-white/85"
        />

        <button
          onClick={() => setOnlyAnalytics((s) => !s)}
          className={clsx(
            "rounded-2xl px-4 py-3 text-sm font-black transition",
            onlyAnalytics
              ? "bg-emerald-500 text-black"
              : "border border-black/10 bg-black/5 text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
          )}
        >
          Analytics: {onlyAnalytics ? "Açık" : "Hepsi"}
        </button>

        <button
          onClick={() => setOnlyMarketing((s) => !s)}
          className={clsx(
            "rounded-2xl px-4 py-3 text-sm font-black transition",
            onlyMarketing
              ? "bg-emerald-500 text-black"
              : "border border-black/10 bg-black/5 text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
          )}
        >
          Marketing: {onlyMarketing ? "Açık" : "Hepsi"}
        </button>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Kayıt yok.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div
                key={r.user_id}
                className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-black/90 dark:text-white/90">
                      {safeName(r.profile)}
                      {r.profile?.is_admin ? (
                        <span className="ml-2 inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-900 dark:text-amber-100">
                          ADMIN
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      {r.profile?.email || "—"} • {r.profile?.phone || "—"}
                    </div>
                    <div className="mt-1 text-[11px] text-black/50 dark:text-white/50 font-mono">
                      {r.user_id}
                    </div>
                  </div>

                  <div className="text-right text-xs text-black/55 dark:text-white/55">
                    <div>accepted_at: {new Date(r.accepted_at).toLocaleString("tr-TR")}</div>
                    <div>updated_at: {new Date(r.updated_at).toLocaleString("tr-TR")}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-900 dark:text-emerald-100">
                    necessary
                  </span>

                  <span className={clsx("rounded-full px-2 py-1", r.analytics ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-100" : "bg-rose-500/15 text-rose-900 dark:text-rose-100")}>
                    analytics: {r.analytics ? "yes" : "no"}
                  </span>

                  <span className={clsx("rounded-full px-2 py-1", r.marketing ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-100" : "bg-rose-500/15 text-rose-900 dark:text-rose-100")}>
                    marketing: {r.marketing ? "yes" : "no"}
                  </span>

                  <span className={clsx("rounded-full px-2 py-1", r.terms_accepted ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-100" : "bg-rose-500/15 text-rose-900 dark:text-rose-100")}>
                    terms: {r.terms_accepted ? "yes" : "no"}
                  </span>

                  <span className={clsx("rounded-full px-2 py-1", r.privacy_accepted ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-100" : "bg-rose-500/15 text-rose-900 dark:text-rose-100")}>
                    privacy: {r.privacy_accepted ? "yes" : "no"}
                  </span>

                  <span className={clsx("rounded-full px-2 py-1", r.explicit_consent ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-100" : "bg-rose-500/15 text-rose-900 dark:text-rose-100")}>
                    explicit: {r.explicit_consent ? "yes" : "no"}
                  </span>
                </div>

                {r.user_agent ? (
                  <div className="mt-3 text-[11px] text-black/50 dark:text-white/50">
                    UA: <span className="font-mono">{r.user_agent}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}