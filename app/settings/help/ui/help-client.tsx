"use client";

import Link from "next/link";
import { useMemo } from "react";

function clsx(
  ...a: (
    | string
    | false
    | null
    | undefined
  )[]
) {
  return a.filter(Boolean).join(" ");
}

function Item({
  title,
  desc,
  href,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group block rounded-3xl border border-black/10 bg-black/5 p-5 transition",
        "hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
    >
      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">
          <div className="truncate text-sm font-black text-black/90 dark:text-white/90">
            {title}
          </div>

          <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
            {desc}
          </div>
        </div>

        {badge ? (
          <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-800 dark:text-emerald-200">
            {badge}
          </span>
        ) : null}

      </div>

      <div className="mt-4 text-xs font-extrabold text-emerald-700 dark:text-emerald-200">
        Aç →
      </div>
    </Link>
  );
}

export default function HelpClient() {

  // ✅ build-safe next param
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(
          window.location.search
        )
      : null;

  const next = useMemo(
    () =>
      (
        params?.get("next") ||
        "/settings"
      ).trim(),
    [params]
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">

      <div className="flex items-end justify-between gap-3">

        <div>
          <div className="text-2xl font-black tracking-tight">
            Yardım & Destek
          </div>

          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            SSS, gizlilik, bildirimler ve hesap işlemleri.
          </div>
        </div>

        <Link
          href={next || "/settings"}
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
        >
          ← Geri
        </Link>

      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">

        <div className="text-lg font-black text-black/90 dark:text-white/90">
          Hızlı bağlantılar
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">

          <Item
            title="Gizlilik Politikası"
            desc="KVKK/Gizlilik metnini oku."
            href="/privacy"
          />

          <Item
            title="Bildirimler"
            desc="Bildirim ayarları ve geçmiş."
            href="/notifications"
          />

          <Item
            title="Engellenen Kullanıcılar"
            desc="Engellediklerini gör."
            href="/settings/blocked"
          />

          <Item
            title="Gizlenen İlanlar"
            desc="Gizlediğin ilanları yönet."
            href="/settings/hidden"
          />

          <Item
            title="Şikayet / Sorun Bildir"
            desc="Spam veya uygunsuz içerik bildir."
            href="/settings/report"
            badge="Önerilen"
          />

          <Item
            title="Hesabı Sil"
            desc="Kalıcı silme işlemleri."
            href="/settings/delete-account"
            badge="Dikkat"
          />

        </div>

        <div className="mt-6 rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">

          <div className="text-sm font-black text-black/85 dark:text-white/85">
            Sık Sorulan Sorular
          </div>

          <div className="mt-3 space-y-3 text-sm text-black/70 dark:text-white/70">

            <div>
              <div className="font-extrabold">
                KYC neden gerekli?
              </div>

              <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
                Güvenli ilan ve mesajlaşma için kimlik doğrulama gerekir.
              </div>
            </div>

            <div>
              <div className="font-extrabold">
                Engellenen kişi mesaj atabilir mi?
              </div>

              <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
                Engellenen kullanıcı seni göremez.
              </div>
            </div>

            <div>
              <div className="font-extrabold">
                Hesabı silince ne olur?
              </div>

              <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
                Kalıcı silme geri alınamaz.
              </div>
            </div>

          </div>

        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-semibold text-black/70 dark:text-white/70">
          Destek kanalı daha sonra eklenebilir.
        </div>

      </div>
    </div>
  );
}