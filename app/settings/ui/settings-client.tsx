"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
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
          <div className="text-lg font-black tracking-tight">{title}</div>
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as any });
    }
  }, []);

  async function logout() {
    try {
      await supabase.auth.signOut();
      toast({ variant: "success", title: "Çıkış yapıldı", message: "Tekrar görüşürüz." });
      router.replace("/");
    } catch (e: any) {
      toast({ variant: "error", title: "Çıkış yapılamadı", message: e?.message ?? "Hata oluştu." });
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* HERO */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight">Ayarlar</div>
            <div className="mt-2 text-sm text-black/60 dark:text-white/60">
              Hesap, gizlilik ve bildirim tercihleri. <span className="ml-2 opacity-80">({today})</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
              >
                ← Ana sayfa
              </Link>

              <Link
                href="/profile"
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/80 dark:hover:bg-black/20 transition"
              >
                Profil →
              </Link>

              <button
                onClick={logout}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
              >
                Çıkış yap
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
              Kısa Not
            </div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70 leading-6">
              Buradaki sayfalar “güvenlik + kontrol” içindir. Engelleme, gizleme,
              bildirim, destek ve hesap silme işlemleri.
            </div>
          </div>
        </div>
      </div>

      {/* LINKS */}
      <Card
        title="Hesap & Güvenlik"
        subtitle="Engellediklerin, gizlediklerin, hesap silme ve diğer güvenlik seçenekleri."
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
            desc="Gizlediğin ilan/kullanıcı (varsa)"
          />
          <RowLink
            href="/settings/notifications"
            title="Bildirimler"
            desc="Push / e-posta tercihleri"
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

      {/* LEGAL */}
      <Card title="Yasal" subtitle="Şartlar ve gizlilik politikaları">
        <div className="grid gap-2">
          <RowLink href="/terms" title="Kullanım Şartları" desc="Platform kuralları" />
          <RowLink href="/privacy" title="KVKK & Çerez Politikası" desc="Veri işleme ve çerezler" />
        </div>
      </Card>

      <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Not: Eğer build’de tekrar “useSearchParams() should be wrapped in a suspense boundary” görürsen, o sayfayı da
        aynı şekilde **page.tsx (server) + client component** olarak ayıracağız.
      </div>
    </div>
  );
}