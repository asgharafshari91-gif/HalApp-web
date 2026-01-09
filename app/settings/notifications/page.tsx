// app/settings/notifications/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { getWebPushSupport } from "@/lib/browserPush";
import {
  canWebPush,
  getNotificationPermission,
  enableWebPush,
  disableWebPush,
  getMyWebPushRow,
  upsertPushTokenToDb,
} from "@/lib/webPush";

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

function Row({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <div className="text-sm font-black text-black/85 dark:text-white/85">
          {title}
        </div>
        {desc ? (
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            {desc}
          </div>
        ) : null}
      </div>
      <div className="shrink-0">{right}</div>
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
        "min-w-[92px] rounded-full px-3 py-2 text-xs font-black transition",
        checked
          ? "bg-emerald-500 text-black hover:bg-emerald-400"
          : "border border-black/10 bg-white/80 text-black/70 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/70 dark:hover:bg-black/20",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-pressed={checked}
    >
      {checked ? labelOn : labelOff}
    </button>
  );
}

function Badge({
  children,
  variant = "sky",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "sky" | "rose";
}) {
  const cls =
    variant === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : variant === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : variant === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      : "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
        cls
      )}
    >
      {children}
    </span>
  );
}

type PushRow = {
  id: number;
  user_id: string;
  token: string;
  platform: string;
  enabled: boolean;
  msg_enabled: boolean;
  system_enabled: boolean;
  listing_enabled: boolean;
  updated_at: string;
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [row, setRow] = useState<PushRow | null>(null);

  const support = useMemo(() => getWebPushSupport(), []);
  const supported = useMemo(() => canWebPush(), []);
  const [perm, setPerm] = useState<NotificationPermission>("default");

  // UI states
  const [webEnabled, setWebEnabled] = useState(false);
  const [msgEnabled, setMsgEnabled] = useState(true);
  const [sysEnabled, setSysEnabled] = useState(true);
  const [listEnabled, setListEnabled] = useState(true);

  function hydrate(r: PushRow | null) {
    setWebEnabled(Boolean(r?.enabled));
    setMsgEnabled(r ? Boolean(r.msg_enabled) : true);
    setSysEnabled(r ? Boolean(r.system_enabled) : true);
    setListEnabled(r ? Boolean(r.listing_enabled) : true);
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user?.id;
      if (!u) {
        router.replace(`/auth?next=${encodeURIComponent("/settings/notifications")}`);
        return;
      }
      setUid(u);

      const p = await getNotificationPermission();
      setPerm(p);

      const r = (await getMyWebPushRow()) as PushRow | null;
      setRow(r);
      hydrate(r);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Yüklenemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canEditChannels = Boolean(webEnabled && row?.token && supported && perm === "granted");

  async function patchChannels(next: {
    msg_enabled?: boolean;
    system_enabled?: boolean;
    listing_enabled?: boolean;
  }) {
    if (!uid) return;

    if (!row?.token) {
      toast({
        variant: "warning",
        title: "Önce web push aç",
        message: "Kanal ayarlarını kaydetmek için önce Web Push'u açıp token üretmelisin.",
      });
      return;
    }

    setSaving(true);
    try {
      await upsertPushTokenToDb({
        userId: uid,
        token: row.token,
        platform: "web",
        enabled: webEnabled,
        msgEnabled: next.msg_enabled ?? msgEnabled,
        systemEnabled: next.system_enabled ?? sysEnabled,
        listingEnabled: next.listing_enabled ?? listEnabled,
      });

      if (typeof next.msg_enabled === "boolean") setMsgEnabled(next.msg_enabled);
      if (typeof next.system_enabled === "boolean") setSysEnabled(next.system_enabled);
      if (typeof next.listing_enabled === "boolean") setListEnabled(next.listing_enabled);

      toast({
        variant: "success",
        title: "Kaydedildi",
        message: "Bildirim tercihlerin güncellendi.",
        durationMs: 1200,
      });

      await load();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleWeb(next: boolean) {
    if (!uid) return;

    if (!supported) {
      toast({
        variant: "warning",
        title: "Desteklenmiyor",
        message: support.reason ?? "Bu tarayıcı Web Push desteklemiyor.",
      });
      return;
    }

    setSaving(true);
    try {
      if (next) {
        const r = await enableWebPush();
        if (!r.ok) {
          toast({ variant: "error", title: "Açılamadı", message: r.reason });
          await load();
          return;
        }

        await upsertPushTokenToDb({
          userId: uid,
          token: r.token,
          platform: "web",
          enabled: true,
          msgEnabled,
          systemEnabled: sysEnabled,
          listingEnabled: listEnabled,
        });

        toast({ variant: "success", title: "Aktif", message: "Web bildirimleri açıldı." });
      } else {
        const r = await disableWebPush();
        if (!r.ok) {
          toast({ variant: "error", title: "Kapatılamadı", message: r.reason ?? "Hata" });
          await load();
          return;
        }
        toast({ variant: "info", title: "Kapalı", message: "Web bildirimleri kapatıldı." });
      }

      const p = await getNotificationPermission();
      setPerm(p);

      await load();
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card
        title="Bildirim Ayarları"
        desc="Web push (tarayıcı) bildirimlerini ve kategori tercihlerini yönet."
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="sky">Web Push: {webEnabled ? "Açık" : "Kapalı"}</Badge>
          <Badge variant={perm === "granted" ? "emerald" : perm === "denied" ? "rose" : "amber"}>
            Tarayıcı İzni: {perm}
          </Badge>
          <Badge variant={supported ? "emerald" : "rose"}>
            Destek: {supported ? "Var" : "Yok"}
          </Badge>
          {support.isSafari ? (
            <Badge variant="amber">
              Safari: {support.isIOS ? "iOS" : "macOS"}
            </Badge>
          ) : null}
        </div>

        {!supported ? (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm font-semibold text-black/70 dark:text-white/70 leading-6">
            <b>Bilgi:</b> {support.reason ?? "Bu tarayıcı FCM Web Push desteklemiyor."}
            <div className="mt-2 text-xs font-semibold text-black/60 dark:text-white/60">
              Safari için Apple Push Notification (APNs/WebPush) gerekir. Chrome/Edge/Firefox önerilir.
            </div>
          </div>
        ) : null}

        {row?.token ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-4 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            <div className="font-black">Web Token</div>
            <div className="mt-1 break-all">{row.token}</div>
          </div>
        ) : null}
      </Card>

      <Card
        title="Web Bildirimleri (Tarayıcı)"
        desc="FCM web push: Chrome/Edge/Firefox. Safari’de kapalı gösterilir."
      >
        {!supported ? (
          <Row
            title="Web Push"
            desc={support.reason ?? "Bu tarayıcı Web Push desteklemiyor."}
            right={<Toggle checked={false} disabled onChange={() => {}} />}
          />
        ) : perm === "denied" ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm font-semibold text-black/70 dark:text-white/70">
            Tarayıcı bildirim izni <b>ENGELLİ</b>. Tarayıcı ayarlarından izin verip tekrar dene.
          </div>
        ) : (
          <Row
            title="Web Push"
            desc="Tarayıcı üzerinden bildirim al."
            right={
              <Toggle checked={webEnabled} disabled={saving} onChange={(v) => toggleWeb(v)} />
            }
          />
        )}

        <div className="mt-3 rounded-2xl border border-black/10 bg-black/5 p-4 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 leading-6">
          <b>Not:</b> Web push açık değilse kategori ayarları pasif görünür.
        </div>
      </Card>

      <Card
        title="Kategori Tercihleri"
        desc="Bu tercihler push_tokens tablosundaki msg_enabled / system_enabled / listing_enabled kolonlarına yazılır."
      >
        <div className={clsx(!canEditChannels && "opacity-60 pointer-events-none")}>
          <div className="grid gap-3">
            <Row
              title="Mesaj Bildirimleri"
              desc="Yeni mesaj geldiğinde bildirim."
              right={
                <Toggle
                  checked={msgEnabled}
                  disabled={saving || !canEditChannels}
                  onChange={(v) => patchChannels({ msg_enabled: v })}
                />
              }
            />
            <Row
              title="Sistem Bildirimleri"
              desc="Güvenlik ve önemli duyurular."
              right={
                <Toggle
                  checked={sysEnabled}
                  disabled={saving || !canEditChannels}
                  onChange={(v) => patchChannels({ system_enabled: v })}
                />
              }
            />
            <Row
              title="İlan Bildirimleri"
              desc="Favoriler ve ilan güncellemeleri."
              right={
                <Toggle
                  checked={listEnabled}
                  disabled={saving || !canEditChannels}
                  onChange={(v) => patchChannels({ listing_enabled: v })}
                />
              }
            />
          </div>
        </div>

        {!canEditChannels ? (
          <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-black/70 dark:text-white/70 leading-6">
            Kategori tercihlerini değiştirmek için:
            <ul className="mt-2 list-disc pl-5 text-xs">
              <li>Web Push destekli tarayıcı kullan (Safari değil)</li>
              <li>Bildirim iznini <b>granted</b> yap</li>
              <li>Web Push’u açıp token üret</li>
            </ul>
          </div>
        ) : null}
      </Card>

      <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        KVKK/Çerez:{" "}
        <a className="font-black underline" href="/privacy">
          /privacy
        </a>
      </div>
    </div>
  );
}