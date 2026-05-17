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
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">{children}</div>
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
        "group flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-black/5 px-4 py-3",
        "hover:bg-black/10 transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
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
      <div className="shrink-0 text-sm font-black text-black/40 group-hover:text-black/60 dark:text-white/40 dark:group-hover:text-white/70">
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
        "flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white px-4 py-4",
        "dark:border-white/10 dark:bg-zinc-950/40"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            {icon ? <span className="mr-1">{icon}</span> : null}
            {label}
          </div>
          {badge ? (
            <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
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
          disabled && "opacity-60 cursor-not-allowed"
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
  const [err, setErr] = useState<string | null>(null);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // debounce save
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as any });
    }
  }, []);

  async function logout() {
    try {
      await supabase.auth.signOut();
      toast({
        variant: "success",
        title: "Çıkış yapıldı",
        message: "Tekrar görüşürüz.",
      });
      router.replace("/");
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Çıkış yapılamadı",
        message: e?.message ?? "Hata oluştu.",
      });
    }
  }

  async function ensureRow(userId: string) {
    // varsa çek
    const { data, error } = await supabase
      .from("user_settings")
      .select("user_id,push_enabled,email_enabled,sms_enabled,updated_at")
      .eq("user_id", userId)
      .maybeSingle<UserSettingsRow>();

    if (error) throw error;

    if (data) return data;

    // yoksa oluştur (defaultlar)
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

    return ins.data!;
  }

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        router.replace("/");
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
    load();
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

      // upsert: user_id unique olmalı
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

  // UI handlers (toggle + autosave)
  function setPush(v: boolean) {
    setPushEnabled(v);
    scheduleSave({ push_enabled: v, email_enabled: emailEnabled, sms_enabled: smsEnabled });
  }
  function setEmail(v: boolean) {
    setEmailEnabled(v);
    scheduleSave({ push_enabled: pushEnabled, email_enabled: v, sms_enabled: smsEnabled });
  }
  function setSms(v: boolean) {
    setSmsEnabled(v);
    scheduleSave({ push_enabled: pushEnabled, email_enabled: emailEnabled, sms_enabled: v });
  }

  const updatedLabel = useMemo(() => {
    if (!updatedAt) return null;
    try {
      const d = new Date(updatedAt);
      return d.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return updatedAt;
    }
  }, [updatedAt]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* HERO */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Ayarlar
            </div>
            <div className="mt-2 text-sm text-black/60 dark:text-white/60">
              Bildirim ve güvenlik tercihleri.{" "}
              <span className="ml-2 opacity-80">({today})</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
              >
                ← Ana sayfa
              </Link>

              <button
                onClick={logout}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
              >
                Çıkış yap
              </button>

              {updatedLabel ? (
                <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black text-zinc-700 dark:border-white/10 dark:bg-black/30 dark:text-zinc-200">
                  Son kayıt: {updatedLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
              Premium Not
            </div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70 leading-6">
              Değişiklikler otomatik kaydedilir. Push kapalıysa uygulama bildirim
              göndermez.
            </div>
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      ) : null}

      {/* NOTIFICATIONS */}
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
              desc="Hızlı doğrulama / kritik uyarılar (aktifse)."
              checked={!!smsEnabled}
              onChange={setSms}
              disabled={saving}
            />

            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white/60">
              İpucu: Push açık olsa bile iOS/Android cihaz ayarlarında uygulama bildirimleri kapalıysa
              bildirim gelmez.
            </div>
          </div>
        )}
      </Card>

      {/* LINKS */}
      <Card
        title="Hesap & Kontrol"
        subtitle="Engellediklerin, gizlediklerin, destek ve hesap silme."
      >
        <div className="grid gap-2">
          <RowLink href="/settings/blocked" title="Engellediklerim" desc="Engellediğin kullanıcıları yönet" />
          <RowLink href="/settings/hidden" title="Gizlenenler" desc="Gizlediğin ilan/kullanıcı (varsa)" />
          <RowLink href="/settings/help" title="Yardım" desc="SSS / destek kanalı" />
          <RowLink href="/settings/report" title="Sorun Bildir" desc="Şikayet / spam / uygunsuz içerik" />
          <RowLink href="/settings/delete-account" title="Hesabı Sil" desc="Kalıcı silme / veri kaldırma" />
        </div>
      </Card>

      {/* LEGAL */}
      <Card title="Yasal" subtitle="Şartlar ve gizlilik politikaları">
        <div className="grid gap-2">
          <RowLink href="/terms" title="Kullanım Şartları" desc="Platform kuralları" />
          <RowLink href="/privacy" title="KVKK & Çerez Politikası" desc="Veri işleme ve çerezler" />
        </div>
      </Card>

      <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Not: Her kullanıcı için <b>user_settings</b> tablosunda tek satır olmalı (user_id unique).
        Değilse upsert çakışır.
      </div>
    </div>
  );
}