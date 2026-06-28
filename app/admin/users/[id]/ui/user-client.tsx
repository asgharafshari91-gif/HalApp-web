// app/admin/users/[id]/ui/user-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Profile = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  district?: string | null;
  role?: string | null;
  kyc_status?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;

  is_admin?: boolean | null;
  verified?: boolean | null;
  is_premium?: boolean | null;
  premium_until?: string | null;

  banned_until?: string | null;
  ban_reason?: string | null;
  deleted_at?: string | null;

  [k: string]: any;
};

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

function fmtDateLocal(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocalInput(v: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function isOnline(p: Profile | null) {
  if (!p?.last_seen_at) return false;
  return Date.now() - new Date(p.last_seen_at).getTime() < 5 * 60 * 1000;
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

  return <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-black", cls)}>{children}</span>;
}

function Toggle({
  checked,
  onChange,
  disabled,
  labelOn,
  labelOff,
  danger,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  labelOn: string;
  labelOff: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "rounded-2xl px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60",
        checked
          ? danger
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "bg-emerald-500 text-black hover:bg-emerald-400"
          : "border border-black/10 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
      )}
    >
      {checked ? labelOn : labelOff}
    </button>
  );
}

function InfoItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[11px] font-black uppercase tracking-wide text-black/45 dark:text-white/45">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-black/75 dark:text-white/75">{value || "—"}</div>
    </div>
  );
}

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-lg font-black">{title}</div>
      {desc ? <div className="mt-1 text-sm text-black/60 dark:text-white/60">{desc}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function UserClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [banUntilLocal, setBanUntilLocal] = useState("");
  const [banReason, setBanReason] = useState("");
  const [premiumUntilLocal, setPremiumUntilLocal] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const isBanned = useMemo(() => {
    if (!p?.banned_until) return false;
    const t = new Date(p.banned_until).getTime();
    return Number.isFinite(t) && t > Date.now();
  }, [p?.banned_until]);

  const isDeleted = !!p?.deleted_at;
  const online = isOnline(p);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "GET",
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Kullanıcı yüklenemedi.");

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

  async function patch(payload: Record<string, any>) {
    setSaving(true);
    setErr(null);

    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Güncelleme başarısız.");

      const prof = j.profile as Profile;
      setP(prof);
      setBanUntilLocal(fmtDateLocal(prof.banned_until));
      setBanReason((prof.ban_reason ?? "").toString());
      setPremiumUntilLocal(fmtDateLocal(prof.premium_until));
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setSaving(false);
    }
  }

  async function softDeleteUser() {
    if (!confirm("Bu kullanıcıyı soft delete yapmak istiyor musun?")) return;

    setSaving(true);
    setErr(null);

    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Silme işlemi başarısız.");

      router.push("/admin/users");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[26px] border border-black/10 bg-white/85 p-8 text-sm font-bold dark:border-white/10 dark:bg-white/[0.04]">
        Kullanıcı yükleniyor…
      </div>
    );
  }

  if (!p) {
    return (
      <div className="rounded-[26px] border border-rose-500/25 bg-rose-500/10 p-6 text-sm font-bold text-rose-700 dark:text-rose-200">
        {err ?? "Kullanıcı bulunamadı."}
      </div>
    );
  }

  const name = ((p.company_name || p.full_name || "Kullanıcı") ?? "Kullanıcı").toString().trim();
  const subtitle = [p.email, p.phone].filter(Boolean).join(" • ") || p.id;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="relative p-5 md:p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[24px] border border-black/10 bg-black text-white dark:border-white/10 dark:bg-white dark:text-black">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl font-black">{initials(name)}</div>
                )}

                <span
                  className={clsx(
                    "absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-black",
                    online ? "bg-emerald-500" : "bg-zinc-400"
                  )}
                />
              </div>

              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                  👤 Kullanıcı detay merkezi
                </div>

                <h1 className="mt-3 truncate text-2xl font-black tracking-tight md:text-3xl">{name}</h1>
                <div className="mt-1 truncate text-sm font-semibold text-black/55 dark:text-white/55">{subtitle}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {online ? <Badge tone="emerald">ONLINE</Badge> : <Badge tone="zinc">OFFLINE</Badge>}
                  {p.is_admin ? <Badge tone="indigo">ADMIN</Badge> : null}
                  {p.verified ? <Badge tone="sky">VERIFIED</Badge> : null}
                  {p.is_premium ? <Badge tone="emerald">PREMIUM</Badge> : null}
                  {isBanned ? <Badge tone="rose">BANNED</Badge> : null}
                  {isDeleted ? <Badge tone="rose">DELETED</Badge> : null}
                  {p.kyc_status ? <Badge tone="amber">KYC: {p.kyc_status}</Badge> : null}
                </div>
              </div>
            </div>

            <div className="grid shrink-0 gap-2 sm:grid-cols-3 xl:w-[360px]">
              <button
                onClick={load}
                disabled={saving}
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs font-black hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04]"
              >
                Yenile
              </button>

              <Link
                href="/admin/users"
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
              >
                ← Liste
              </Link>

              <button
                onClick={softDeleteUser}
                disabled={saving || isDeleted}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleted ? "Silindi" : "Soft Delete"}
              </button>
            </div>
          </div>

          {err ? (
            <div className="relative mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm font-bold text-rose-700 dark:text-rose-200">
              {err}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Panel title="⚙️ Yetki ve Durum Yönetimi" desc="Premium, doğrulama, admin ve ban işlemleri.">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-sm font-black">Premium</div>
                <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">Paket erişimi ve bitiş tarihi.</div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Toggle
                    checked={!!p.is_premium}
                    disabled={saving}
                    labelOn="Premium Açık"
                    labelOff="Premium Kapalı"
                    onChange={(v) =>
                      patch({
                        is_premium: v,
                        premium_until: v ? toIsoFromLocalInput(premiumUntilLocal) : null,
                      })
                    }
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={premiumUntilLocal}
                    onChange={(e) => setPremiumUntilLocal(e.target.value)}
                    type="datetime-local"
                    className="min-w-[220px] flex-1 rounded-2xl border border-black/10 bg-white/80 px-3 py-3 text-xs font-bold outline-none dark:border-white/10 dark:bg-black/30"
                  />

                  <button
                    disabled={saving}
                    onClick={() =>
                      patch({
                        is_premium: true,
                        premium_until: toIsoFromLocalInput(premiumUntilLocal),
                      })
                    }
                    className="rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <div className="text-sm font-black">Ban Yönetimi</div>
                <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">Geçici ban ve sebep kaydı.</div>

                <div className="mt-4">
                  <Toggle
                    checked={isBanned}
                    disabled={saving}
                    danger
                    labelOn="BANNED"
                    labelOff="Temiz"
                    onChange={(v) => {
                      const until = v ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
                      patch({
                        banned_until: until,
                        ban_reason: v ? banReason || "admin_ban" : null,
                      });
                    }}
                  />
                </div>

                <div className="mt-3 grid gap-2">
                  <input
                    value={banUntilLocal}
                    onChange={(e) => setBanUntilLocal(e.target.value)}
                    type="datetime-local"
                    className="rounded-2xl border border-black/10 bg-white/80 px-3 py-3 text-xs font-bold outline-none dark:border-white/10 dark:bg-black/30"
                  />

                  <input
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Ban sebebi"
                    className="rounded-2xl border border-black/10 bg-white/80 px-3 py-3 text-xs font-bold outline-none dark:border-white/10 dark:bg-black/30"
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      disabled={saving}
                      onClick={() =>
                        patch({
                          banned_until: banUntilLocal ? toIsoFromLocalInput(banUntilLocal) : null,
                          ban_reason: banUntilLocal ? banReason || "admin_ban" : null,
                        })
                      }
                      className="rounded-2xl bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
                    >
                      Ban Kaydet
                    </button>

                    <button
                      disabled={saving}
                      onClick={() => patch({ banned_until: null, ban_reason: null })}
                      className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs font-black hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      Unban
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                <div className="text-sm font-black">Verified</div>
                <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">Profil doğrulama rozeti.</div>
                <div className="mt-4">
                  <Toggle
                    checked={!!p.verified}
                    disabled={saving}
                    labelOn="Onaylı"
                    labelOff="Onaysız"
                    onChange={(v) => patch({ verified: v })}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                <div className="text-sm font-black">Admin Yetkisi</div>
                <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">Panel erişim yetkisi.</div>
                <div className="mt-4">
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
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="📌 Profil Bilgileri" desc="Hesap ve iletişim özeti.">
            <div className="grid gap-2">
              <InfoItem label="User ID" value={p.id} />
              <InfoItem label="Ad Soyad" value={p.full_name} />
              <InfoItem label="Şirket" value={p.company_name} />
              <InfoItem label="Telefon" value={p.phone} />
              <InfoItem label="E-posta" value={p.email} />
              <InfoItem label="Konum" value={[p.city, p.district].filter(Boolean).join(" / ")} />
              <InfoItem label="Rol" value={p.role} />
              <InfoItem label="KYC" value={p.kyc_status} />
              <InfoItem label="Created" value={fmt(p.created_at)} />
              <InfoItem label="Last Seen" value={fmt(p.last_seen_at)} />
              <InfoItem label="Premium Until" value={fmt(p.premium_until)} />
              <InfoItem label="Banned Until" value={fmt(p.banned_until)} />
            </div>
          </Panel>

          {p.ban_reason ? (
            <Panel title="🚫 Ban Sebebi">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-700 dark:text-rose-200">
                {p.ban_reason}
              </div>
            </Panel>
          ) : null}

          <Panel title="🧾 Teknik Veri">
            <button
              onClick={() => setShowRaw((s) => !s)}
              className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
            >
              {showRaw ? "Raw Gizle" : "Raw Göster"}
            </button>

            {showRaw ? (
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-2xl border border-black/10 bg-black p-4 text-xs leading-5 text-emerald-200 dark:border-white/10">
                {JSON.stringify(p, null, 2)}
              </pre>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}