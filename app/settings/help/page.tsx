"use client";

import Link from "next/link";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="text-lg font-black">{title}</div>
      {desc ? <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">{desc}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Item({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="text-sm font-black text-black/85 dark:text-white/85">{q}</div>
      <div className="mt-2 text-sm text-black/70 dark:text-white/70 leading-6">{a}</div>
    </div>
  );
}

function Action({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group flex items-start gap-3 rounded-3xl border border-black/10 bg-white/70 p-4 hover:bg-white transition",
        "dark:border-white/10 dark:bg-black/25 dark:hover:bg-black/35"
      )}
    >
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
        <span className="text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-black text-black/90 dark:text-white/90 group-hover:opacity-95">{title}</div>
        <div className="mt-1 text-xs text-black/60 dark:text-white/60 leading-5">{desc}</div>
      </div>
      <div className="ml-auto mt-2 opacity-50">›</div>
    </Link>
  );
}

export default function HelpCenterPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card title="Yardım Merkezi" desc="Sık sorulanlar + hızlı çözümler + destek kanalları.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Action title="Sorun Bildir" desc="Hata/öneri/şikayet göndermek için." href="/settings/report" icon="📝" />
          <Action title="Bildirim Ayarları" desc="Mesaj/Sistem/İlan bildirimlerini yönet." href="/settings/notifications" icon="🔔" />
          <Action title="Engellediklerim" desc="Engellediğin kullanıcıları yönet." href="/settings/blocked" icon="⛔️" />
          <Action title="Hesap Silme" desc="Hesap silme talebi oluştur." href="/settings/delete" icon="🗑️" />
        </div>
      </Card>

      <Card title="Sık Sorulan Sorular">
        <div className="grid gap-3">
          <Item q="Bildirim gelmiyor, ne yapmalıyım?" a="Tarayıcı bildirim iznini kontrol et. Ayarlar → Bildirim Ayarları’ndan Web Push’u aç. Safari’de Web Push bazı sürümlerde kısıtlı olabilir." />
          <Item q="Mesajlar görünmüyor / geç geliyor?" a="İnternet bağlantısını kontrol et. Sayfayı yenile. Devam ederse Sorun Bildir’den detayları yaz." />
          <Item q="Premium nedir?" a="Premium üyelikte ilanların öne çıkar, daha fazla görünürlük ve ek özellikler aktif olur." />
        </div>
      </Card>

      <Card title="Yasal" desc="KVKK ve kullanım şartları">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/privacy" className="rounded-3xl border border-black/10 bg-black/5 p-4 text-sm font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            KVKK & Çerez Politikası
          </Link>
          <Link href="/terms" className="rounded-3xl border border-black/10 bg-black/5 p-4 text-sm font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
            Kullanım Koşulları
          </Link>
        </div>
      </Card>
    </div>
  );
}