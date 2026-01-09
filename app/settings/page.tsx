"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { useMe } from "@/lib/me";

const LS_HIDE = "halapp_hide_listing_ids_v1";
const LS_BLOCK = "halapp_block_seller_ids_v1";
const EVT_LOCAL_UPDATED = "halapp:local-filters-updated";

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
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="text-lg font-black">{title}</div>
      {desc ? (
        <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">
          {desc}
        </div>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 text-[11px] font-extrabold tracking-wide text-black/45 dark:text-white/45 uppercase">
      {children}
    </div>
  );
}

function Item({
  href,
  onClick,
  icon,
  title,
  subtitle,
  right,
  danger,
  external,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  danger?: boolean;
  external?: boolean;
}) {
  const content = (
    <div
      className={clsx(
        "group flex items-center gap-3 rounded-3xl border border-black/10 bg-white/70 px-4 py-3 transition",
        "hover:bg-white dark:border-white/10 dark:bg-black/25 dark:hover:bg-black/35",
        danger && "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
      )}
    >
      <div
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-2xl ring-1",
          danger
            ? "bg-rose-500/10 ring-rose-500/20 text-rose-600 dark:text-rose-200"
            : "bg-emerald-500/10 ring-emerald-500/15 text-emerald-700 dark:text-emerald-200"
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={clsx(
            "text-sm font-black",
            danger
              ? "text-rose-700 dark:text-rose-200"
              : "text-black/90 dark:text-white/90"
          )}
        >
          {title}
        </div>
        {subtitle ? (
          <div className="mt-0.5 text-xs text-black/55 dark:text-white/55">
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 flex items-center gap-2 text-black/45 dark:text-white/45">
        {right}
        <span className="text-lg leading-none opacity-60 group-hover:opacity-80">
          ›
        </span>
      </div>
    </div>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className="block">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      {children}
    </span>
  );
}

function readLSCount(key: string) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as any[]) : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const me = useMe();

  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [hiddenCount, setHiddenCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  const displayName = useMemo(() => {
    const p: any = me.profile ?? null;
    const c = (p?.company_name ?? "").trim();
    const f = (p?.full_name ?? "").trim();
    return c || f || "HalApp Kullanıcısı";
  }, [me.profile]);

  const isPremium = Boolean((me.profile as any)?.is_premium);
  const isAdmin = Boolean((me.profile as any)?.is_admin);

  const supportWhatsapp = "https://wa.me/905555555555";
  const supportPhone = "+905555555555";
  const supportEmail = "destek@halapp.com";

  function refreshLocalCounts() {
    setHiddenCount(readLSCount(LS_HIDE));
    setBlockedCount(readLSCount(LS_BLOCK));
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const id = data.session?.user?.id ?? null;
        if (!id) {
          router.replace(`/auth?next=${encodeURIComponent("/settings")}`);
          return;
        }
        if (!mounted) return;
        setUid(id);

        // ✅ local counts
        refreshLocalCounts();
      } catch (e: any) {
        toast({ variant: "error", title: "Yüklenemedi", message: e?.message ?? "Hata oluştu." });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key === LS_HIDE || e.key === LS_BLOCK) refreshLocalCounts();
    }
    function onLocalUpdated() {
      refreshLocalCounts();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT_LOCAL_UPDATED, onLocalUpdated as any);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT_LOCAL_UPDATED, onLocalUpdated as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await me.signOut();
      toast({ variant: "info", title: "Çıkış", message: "Oturum kapatıldı." });
      router.push("/");
    } catch (e: any) {
      toast({ variant: "error", title: "Çıkış yapılamadı", message: e?.message ?? "Bir hata oluştu." });
    }
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card title="Ayarlar" desc="Hesabını, bildirimlerini, gizlilik seçeneklerini ve destek kanallarını yönet.">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{displayName}</Chip>
          <Chip>{isPremium ? "Premium üye" : "Standart üye"}</Chip>
          {isAdmin ? <Chip>Admin</Chip> : null}
          {uid ? <Chip>UID: {uid.slice(0, 8)}…</Chip> : null}
        </div>
      </Card>

      <Card title="Bildirimler" desc="Mesaj / Sistem / İlan bildirimlerini aç-kapat.">
        <div className="space-y-3">
          <SectionTitle>Bildirimler</SectionTitle>
          <Item
            href="/settings/notifications"
            icon={<span className="text-lg">🔔</span>}
            title="Bildirim Ayarları"
            subtitle="Mesaj / Sistem / İlan aç-kapat"
          />
        </div>
      </Card>

      {/* ✅ Gizlilik: ayrı sayfalara link */}
      <Card title="Gizlilik" desc="Gizlenen ilanları ve engellediğin satıcıları yönet.">
        <div className="space-y-3">
          <SectionTitle>Gizlilik</SectionTitle>

          <Item
            href="/settings/hidden"
            icon={<span className="text-lg">🙈</span>}
            title="Gizlenen İlanlar"
            subtitle="Gizlediğin ilanları geri al"
            right={<span className="text-xs font-black opacity-70">{hiddenCount}</span>}
          />

          <Item
            href="/settings/blocked"
            icon={<span className="text-lg">⛔️</span>}
            title="Engellenen Satıcılar"
            subtitle="Engellediğin satıcıları yönet"
            right={<span className="text-xs font-black opacity-70">{blockedCount}</span>}
          />
        </div>
      </Card>

      <Card title="Yardım & Destek" desc="Sık sorulanlar, hızlı destek ve sorun bildirimi.">
        <div className="space-y-3">
          <SectionTitle>Yardım & Destek</SectionTitle>

          <Item href="/settings/help" icon={<span className="text-lg">❓</span>} title="Yardım Merkezi" subtitle="Sık sorulan sorular ve rehber" />

          <Item href="/settings/report" icon={<span className="text-lg">📝</span>} title="Sorun Bildir" subtitle="Hata / öneri / şikayet gönder" />

          <Item
            href={supportWhatsapp}
            external
            icon={<span className="text-lg">💬</span>}
            title="WhatsApp Destek"
            subtitle="Hızlı destek için WhatsApp"
            right={<span className="text-xs font-black opacity-70">Aç</span>}
          />

          <Item
            href={`tel:${supportPhone}`}
            external
            icon={<span className="text-lg">📞</span>}
            title="Telefon ile Ara"
            subtitle={supportPhone}
            right={<span className="text-xs font-black opacity-70">Ara</span>}
          />

          <Item
            href={`mailto:${supportEmail}`}
            external
            icon={<span className="text-lg">✉️</span>}
            title="E-posta"
            subtitle={supportEmail}
            right={<span className="text-xs font-black opacity-70">Mail</span>}
          />
        </div>
      </Card>

      {isAdmin ? (
        <Card title="Yönetim" desc="Sadece admin kullanıcılar görür.">
          <div className="space-y-3">
            <SectionTitle>Yönetim</SectionTitle>
            <Item href="/admin" icon={<span className="text-lg">🛡️</span>} title="Admin Panel" subtitle="Yönetim ekranları" />
          </div>
        </Card>
      ) : null}

      <Card title="Hukuk" desc="Sözleşmeler ve aydınlatma metinleri.">
        <div className="space-y-3">
          <SectionTitle>Hukuk</SectionTitle>
          <Item href="/terms" icon={<span className="text-lg">📄</span>} title="Sözleşme & Kullanım Koşulları" subtitle="Metni görüntüle" />
          <Item href="/privacy" icon={<span className="text-lg">🧾</span>} title="KVKK & Çerez Politikası" subtitle="Aydınlatma metni" />
        </div>
      </Card>

      <Card title="Hesap" desc="Hesap silme ve güvenli çıkış.">
        <div className="space-y-3">
          <SectionTitle>Hesap</SectionTitle>

          <Item
            href="/settings/delete"
            danger
            icon={<span className="text-lg">🗑️</span>}
            title="Hesap Silme"
            subtitle="Silme talebi oluştur"
          />

          <Item
            onClick={logout}
            danger
            icon={<span className="text-lg">🚪</span>}
            title="Çıkış Yap"
            subtitle="Hesabından güvenli çıkış"
            right={<span className="text-xs font-black opacity-70">Çık</span>}
          />
        </div>

        <div className="mt-4 rounded-3xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
          HalApp • v1.0.0
        </div>
      </Card>
    </div>
  );
}