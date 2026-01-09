// app/admin/users/[id]/ui/user-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-lg font-black">{title}</div>
      {desc ? <div className="mt-1 text-sm text-black/60 dark:text-white/60">{desc}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  labelOn = "Açık",
  labelOff = "Kapalı",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  labelOn?: string;
  labelOff?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "min-w-[120px] rounded-full px-4 py-2 text-xs font-black transition",
        checked
          ? "bg-emerald-500 text-black hover:bg-emerald-400"
          : "border border-black/10 bg-white/80 text-black/70 hover:bg-white",
        "dark:border-white/10 dark:bg-black/30 dark:text-white/75 dark:hover:bg-white/[0.06]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {checked ? labelOn : labelOff}
    </button>
  );
}

function fmtDateLocal(ts?: string | null) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    // datetime-local expects: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  } catch {
    return "";
  }
}

function toIsoFromLocalInput(v: string) {
  // v: YYYY-MM-DDTHH:mm (local)
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Profile = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;

  is_admin?: boolean | null;
  verified?: boolean | null;

  is_premium?: boolean | null;
  premium_until?: string | null;

  banned_until?: string | null;
  ban_reason?: string | null;

  deleted_at?: string | null;
};

export default function UserClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // UI helpers
  const isBanned = useMemo(() => {
    if (!p?.banned_until) return false;
    const t = new Date(p.banned_until).getTime();
    return Number.isFinite(t) && t > Date.now();
  }, [p?.banned_until]);

  const isDeleted = !!p?.deleted_at;

  const [banUntilLocal, setBanUntilLocal] = useState("");
  const [banReason, setBanReason] = useState("");

  const [premiumUntilLocal, setPremiumUntilLocal] = useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: "GET" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Hata");
      const prof = j.profile as Profile;
      setP(prof);

      setBanUntilLocal(fmtDateLocal(prof.banned_until));
      setBanReason((prof.ban_reason ?? "").toString());

      setPremiumUntilLocal(fmtDateLocal(prof.premium_until));
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(payload: any) {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Hata");
      const prof = j.profile as Profile;
      setP(prof);

      // server dönüşünü UI state’e yansıt
      setBanUntilLocal(fmtDateLocal(prof.banned_until));
      setBanReason((prof.ban_reason ?? "").toString());
      setPremiumUntilLocal(fmtDateLocal(prof.premium_until));
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setSaving(false);
    }
  }

  async function softDeleteUser() {
    if (!confirm("Bu kullanıcıyı sil (soft delete) yapmak istiyor musun?")) return;
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Hata");
      router.push("/admin/users");
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        Yükleniyor…
      </div>
    );
  }

  if (!p) {
    return (
      <div className="rounded-[28px] border border-rose-500/25 bg-rose-500/10 p-6 text-sm font-semibold">
        {err ?? "Kullanıcı bulunamadı."}
      </div>
    );
  }

  const name = ((p.company_name || p.full_name || "Kullanıcı") ?? "Kullanıcı").toString().trim();
  const subtitle = (p.email ?? p.phone ?? p.id ?? "").toString();

  return (
    <div className="space-y-4">
      <Card title={name} desc={subtitle}>
        {err ? (
          <div className="mb-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm font-semibold">
            {err}
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          {/* PREMIUM */}
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Premium</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Toggle
                checked={!!p.is_premium}
                disabled={saving}
                onChange={(v) =>
                  patch({
                    is_premium: v,
                    premium_until: v ? toIsoFromLocalInput(premiumUntilLocal) : null,
                  })
                }
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-black/50 dark:text-white/50">Premium Until</span>
                <input
                  value={premiumUntilLocal}
                  onChange={(e) => setPremiumUntilLocal(e.target.value)}
                  type="datetime-local"
                  className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold outline-none dark:border-white/10 dark:bg-black/30"
                />
                <button
                  disabled={saving}
                  onClick={() =>
                    patch({
                      is_premium: true,
                      premium_until: toIsoFromLocalInput(premiumUntilLocal),
                    })
                  }
                  className={clsx(
                    "rounded-2xl bg-black/10 px-3 py-2 text-xs font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15",
                    saving && "opacity-60 cursor-not-allowed"
                  )}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>

          {/* BAN */}
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Ban</div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Toggle
                checked={isBanned}
                disabled={saving}
                labelOn="BANNED"
                labelOff="Temiz"
                onChange={(v) => {
                  // v=true -> default 7 gün ban (istersen değiştir)
                  const until = v ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
                  patch({
                    banned_until: until,
                    ban_reason: v ? (banReason || "admin_ban") : null,
                  });
                }}
              />

              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-xs font-black text-black/50 dark:text-white/50">Until</span>
                <input
                  value={banUntilLocal}
                  onChange={(e) => setBanUntilLocal(e.target.value)}
                  type="datetime-local"
                  className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold outline-none dark:border-white/10 dark:bg-black/30"
                />

                <span className="text-xs font-black text-black/50 dark:text-white/50">Reason</span>
                <input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="ban reason"
                  className="min-w-[220px] flex-1 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold outline-none dark:border-white/10 dark:bg-black/30"
                />

                <button
                  disabled={saving}
                  onClick={() =>
                    patch({
                      banned_until: banUntilLocal ? toIsoFromLocalInput(banUntilLocal) : null,
                      ban_reason: banUntilLocal ? (banReason || "admin_ban") : null,
                    })
                  }
                  className={clsx(
                    "rounded-2xl bg-black/10 px-3 py-2 text-xs font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15",
                    saving && "opacity-60 cursor-not-allowed"
                  )}
                >
                  Kaydet
                </button>

                <button
                  disabled={saving}
                  onClick={() => patch({ banned_until: null, ban_reason: null })}
                  className={clsx(
                    "rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
                    saving && "opacity-60 cursor-not-allowed"
                  )}
                >
                  Unban
                </button>
              </div>
            </div>
          </div>

          {/* VERIFIED */}
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Verified</div>
            <div className="mt-2">
              <Toggle
                checked={!!p.verified}
                disabled={saving}
                labelOn="Onaylı"
                labelOff="Onaysız"
                onChange={(v) => patch({ verified: v })}
              />
            </div>
          </div>

          {/* ADMIN */}
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Admin</div>
            <div className="mt-2">
              <Toggle
                checked={!!p.is_admin}
                disabled={saving}
                labelOn="Admin"
                labelOff="User"
                onChange={(v) => patch({ is_admin: v })}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={softDeleteUser}
            disabled={saving}
            className={clsx(
              "rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400 transition",
              saving && "opacity-60 cursor-not-allowed"
            )}
          >
            {isDeleted ? "Silindi (soft)" : "Hesabı Sil (soft)"}
          </button>

          <button
            onClick={() => router.push("/admin/users")}
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            ← Geri
          </button>

          <button
            onClick={load}
            disabled={saving}
            className={clsx(
              "ml-auto rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15",
              saving && "opacity-60 cursor-not-allowed"
            )}
          >
            Yenile
          </button>
        </div>
      </Card>
    </div>
  );
}