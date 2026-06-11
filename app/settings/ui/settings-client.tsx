"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({
  title,
  subtitle,
  children,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "default" | "danger" | "premium";
}) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-[30px] border p-6 backdrop-blur-xl",
        "shadow-[0_22px_80px_rgba(0,0,0,0.10)]",
        "dark:shadow-[0_22px_90px_rgba(0,0,0,0.60)]",
        tone === "default" &&
          "border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.045]",
        tone === "premium" &&
          "border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/30 dark:via-white/[0.04] dark:to-cyan-950/20",
        tone === "danger" &&
          "border-red-500/20 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/25 dark:via-white/[0.04] dark:to-orange-950/20"
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </div>

            {subtitle ? (
              <div className="mt-1 text-sm leading-6 text-black/60 dark:text-white/60">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

function RowLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
        "border-black/10 bg-black/[0.04] transition-all duration-200",
        "hover:-translate-y-0.5 hover:bg-black/[0.07] hover:shadow-[0_14px_35px_rgba(0,0,0,0.08)]",
        "dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.09]"
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold text-black/85 dark:text-white/85">
          {title}
        </div>

        {desc ? (
          <div className="mt-0.5 truncate text-xs text-black/55 dark:text-white/55">
            {desc}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-sm font-black text-black/40 transition group-hover:translate-x-0.5 group-hover:text-black/70 dark:text-white/40 dark:group-hover:text-white/70">
        →
      </div>
    </Link>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
  desc,
  badge,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  desc?: string;
  badge?: string;
  icon?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 rounded-2xl border px-4 py-4",
        "border-black/10 bg-white/75 transition",
        "dark:border-white/10 dark:bg-zinc-950/35"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            {icon ? <span className="mr-1">{icon}</span> : null}
            {label}
          </div>

          {badge ? (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
              {badge}
            </span>
          ) : null}
        </div>

        {desc ? (
          <div className="mt-1 text-xs leading-5 text-black/55 dark:text-white/55">
            {desc}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-9 w-16 shrink-0 rounded-full border transition",
          checked
            ? "border-emerald-300 bg-emerald-400/90 dark:border-emerald-500/50 dark:bg-emerald-500/50"
            : "border-black/15 bg-black/10 dark:border-white/10 dark:bg-white/10",
          disabled && "cursor-not-allowed opacity-60"
        )}
        aria-pressed={checked}
      >
        <span
          className={clsx(
            "absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white shadow transition",
            checked ? "left-8" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

type UserSettingsRow = {
  user_id: string;
  push_enabled: boolean | null;
  email_enabled: boolean | null;
  sms_enabled: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function SettingsClient() {
  const router = useRouter();
  const { toast } = useToast();

  const today = useMemo(() => {
    const d = new Date();

    return d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [globalLogoutLoading, setGlobalLogoutLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function logout() {
    try {
      setLogoutLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast({
        variant: "success",
        title: "Çıkış yapıldı",
        message: "Bu cihazdaki oturum kapatıldı.",
      });

      router.replace("/auth");
      router.refresh();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Çıkış yapılamadı",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLogoutLoading(false);
    }
  }

  async function logoutAllDevices() {
    try {
      setGlobalLogoutLoading(true);

      const { error } = await supabase.auth.signOut({
        scope: "global",
      });

      if (error) throw error;

      setShowLogoutModal(false);

      toast({
        variant: "success",
        title: "Tüm cihazlardan çıkış yapıldı",
        message: "Hesabın açık olan tüm oturumları kapatıldı.",
      });

      router.replace("/auth");
      router.refresh();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Tüm cihazlardan çıkış yapılamadı",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setGlobalLogoutLoading(false);
    }
  }

  async function ensureRow(userId: string) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("user_id,push_enabled,email_enabled,sms_enabled,updated_at")
      .eq("user_id", userId)
      .maybeSingle<UserSettingsRow>();

    if (error) throw error;

    if (data) return data;

    const payload = {
      user_id: userId,
      push_enabled: true,
      email_enabled: false,
      sms_enabled: false,
      updated_at: new Date().toISOString(),
    };

    const ins = await supabase
      .from("user_settings")
      .insert(payload)
      .select("user_id,push_enabled,email_enabled,sms_enabled,updated_at")
      .single<UserSettingsRow>();

    if (ins.error) throw ins.error;

    return ins.data;
  }

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        router.replace("/auth");
        return;
      }

      const row = await ensureRow(userId);

      setPushEnabled(row.push_enabled ?? true);
      setEmailEnabled(row.email_enabled ?? false);
      setSmsEnabled(row.sms_enabled ?? false);
      setUpdatedAt(row.updated_at ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Ayarlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleSave(next: {
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
  }) {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      void saveNow(next);
    }, 650);
  }

  async function saveNow(next: {
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
  }) {
    setErr(null);
    setSaving(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) throw new Error("Oturum bulunamadı.");

      const { data, error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: userId,
            push_enabled: next.push_enabled,
            email_enabled: next.email_enabled,
            sms_enabled: next.sms_enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select("updated_at")
        .single<{ updated_at: string }>();

      if (error) throw error;

      setUpdatedAt(data?.updated_at ?? new Date().toISOString());
    } catch (e: any) {
      setErr(e?.message ?? "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  function setPush(v: boolean) {
    setPushEnabled(v);

    scheduleSave({
      push_enabled: v,
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
    });
  }

  function setEmail(v: boolean) {
    setEmailEnabled(v);

    scheduleSave({
      push_enabled: pushEnabled,
      email_enabled: v,
      sms_enabled: smsEnabled,
    });
  }

  function setSms(v: boolean) {
    setSmsEnabled(v);

    scheduleSave({
      push_enabled: pushEnabled,
      email_enabled: emailEnabled,
      sms_enabled: v,
    });
  }

  const updatedLabel = useMemo(() => {
    if (!updatedAt) return null;

    try {
      const d = new Date(updatedAt);

      return {
        date: d.toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return {
        date: updatedAt,
        time: "",
      };
    }
  }, [updatedAt]);

  const actionDisabled = logoutLoading || globalLogoutLoading;

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_22px_90px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_22px_90px_rgba(0,0,0,0.60)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                HalApp Güvenlik Merkezi
              </div>

              <div className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Ayarlar
              </div>

              <div className="mt-2 text-sm leading-6 text-black/60 dark:text-white/60">
                Bildirim, hesap ve güvenlik tercihlerini buradan yönet.{" "}
                <span className="opacity-80">({today})</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  ← Ana sayfa
                </Link>

                {updatedLabel ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-800 dark:text-emerald-200">
                    <div>✓ Son senkronizasyon</div>
                    <div className="mt-0.5 font-extrabold opacity-80">
                      {updatedLabel.date}
                      {updatedLabel.time ? ` • ${updatedLabel.time}` : ""}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-black/[0.04] p-4 dark:border-white/10 dark:bg-white/[0.05]">
              <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
                Premium Not
              </div>

              <div className="mt-2 max-w-xs text-sm leading-6 text-black/70 dark:text-white/70">
                Değişiklikler otomatik kaydedilir. Güvenlik işlemlerinde oturum
                tekrar istenebilir.
              </div>
            </div>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </div>
        ) : null}

        <Card
          tone="premium"
          title="Güvenlik & Oturumlar"
          subtitle="Hesabın başka bilgisayarda veya telefonda açıksa buradan tüm oturumları kapatabilirsin."
        >
          <div className="grid gap-3">
            <div className="inline-flex w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              🛡️ HalApp Security
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
              <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                🔐 Tüm cihazlardan çıkış
              </div>

              <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
                Bu işlem telefon, bilgisayar ve açık kalan diğer HalApp Web
                oturumlarını kapatır. Yeniden giriş için SMS / Google / Apple
                gerekir.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={actionDisabled}
                onClick={() => setShowLogoutModal(true)}
                className={clsx(
                  "relative h-[52px] overflow-hidden rounded-2xl px-4 py-3 text-sm font-black text-white",
                  "bg-gradient-to-r from-red-600 to-rose-500",
                  "shadow-[0_18px_55px_rgba(244,63,94,0.30)]",
                  "transition hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(244,63,94,0.38)]",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                Tüm Cihazlardan Çıkış Yap
              </button>

              <button
                type="button"
                disabled={actionDisabled}
                onClick={logout}
                className={clsx(
                  "h-[52px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900",
                  "transition hover:-translate-y-0.5 hover:bg-black/5",
                  "dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.10]",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {logoutLoading
                  ? "Çıkış yapılıyor..."
                  : "Sadece Bu Cihazdan Çıkış Yap"}
              </button>
            </div>
          </div>
        </Card>

        <Card
          title="Bildirim Tercihleri"
          subtitle="Push, e-posta ve SMS bildirimlerini buradan yönet."
        >
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
              Ayarlar yükleniyor...
            </div>
          ) : (
            <div className="grid gap-3">
              <Switch
                icon="🔔"
                label="Push bildirimleri"
                desc="Mesajlar, ilan güncellemeleri ve önemli duyurular."
                badge={saving ? "Kaydediliyor…" : "Otomatik kaydedilir"}
                checked={!!pushEnabled}
                onChange={setPush}
                disabled={saving}
              />

              <Switch
                icon="📩"
                label="E-posta bildirimleri"
                desc="Önemli duyurular ve güvenlik bildirimleri."
                checked={!!emailEnabled}
                onChange={setEmail}
                disabled={saving}
              />

              <Switch
                icon="📱"
                label="SMS bildirimleri"
                desc="Hızlı doğrulama / kritik uyarılar."
                checked={!!smsEnabled}
                onChange={setSms}
                disabled={saving}
              />

              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs leading-5 text-black/60 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white/60">
                İpucu: Push açık olsa bile cihaz ayarlarında HalApp
                bildirimleri kapalıysa bildirim gelmez.
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Hesap & Kontrol"
          subtitle="Engellediklerin, gizlediklerin, destek ve hesap silme."
        >
          <div className="grid gap-2">
            <RowLink
              href="/settings/blocked"
              title="Engellediklerim"
              desc="Engellediğin kullanıcıları yönet"
            />
            <RowLink
              href="/settings/hidden"
              title="Gizlenenler"
              desc="Gizlediğin ilan/kullanıcı"
            />
            <RowLink
              href="/settings/help"
              title="Yardım"
              desc="SSS / destek kanalı"
            />
            <RowLink
              href="/settings/report"
              title="Sorun Bildir"
              desc="Şikayet / spam / uygunsuz içerik"
            />
            <RowLink
              href="/settings/delete-account"
              title="Hesabı Sil"
              desc="Kalıcı silme / veri kaldırma"
            />
          </div>
        </Card>

        <Card title="Yasal" subtitle="Şartlar ve gizlilik politikaları">
          <div className="grid gap-2">
            <RowLink
              href="/terms"
              title="Kullanım Şartları"
              desc="Platform kuralları"
            />
            <RowLink
              href="/privacy"
              title="KVKK & Çerez Politikası"
              desc="Veri işleme ve çerezler"
            />
          </div>
        </Card>

        <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs leading-5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
          Not: Her kullanıcı için <b>user_settings</b> tablosunda tek satır
          olmalı. <b>user_id</b> unique değilse upsert çakışır.
        </div>
      </div>

      {showLogoutModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Modalı kapat"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!globalLogoutLoading) setShowLogoutModal(false);
            }}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_35px_130px_rgba(0,0,0,0.45)] dark:bg-[#0B0F19]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-500/15 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative p-6">
              <div className="mb-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                🛡️ HalApp Security
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-2xl">
                  🔐
                </div>

                <div className="min-w-0">
                  <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                    Tüm Oturumları Kapat
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
                    Bu işlem hesabınızın açık olduğu tüm telefon, tablet ve
                    bilgisayarlardaki HalApp oturumlarını sonlandıracaktır.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                <div className="text-sm font-black text-red-600 dark:text-red-300">
                  ⚠ Güvenlik İşlemi
                </div>

                <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
                  Yeniden giriş yapmak için SMS, Google veya Apple hesabınızla
                  tekrar oturum açmanız gerekir.
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={globalLogoutLoading}
                  onClick={() => setShowLogoutModal(false)}
                  className={clsx(
                    "h-[52px] rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-black text-zinc-900",
                    "transition hover:bg-black/10",
                    "dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={globalLogoutLoading}
                  onClick={logoutAllDevices}
                  className={clsx(
                    "h-[52px] rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-3 text-sm font-black text-white",
                    "shadow-[0_20px_60px_rgba(244,63,94,.30)] transition hover:scale-[1.02]",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  )}
                >
                  {globalLogoutLoading
                    ? "Kapatılıyor..."
                    : "Tüm Oturumları Kapat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}