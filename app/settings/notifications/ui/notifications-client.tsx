"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

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

function ToggleRow({
  title,
  desc,
  value,
  onChange,
  disabled,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-black/10 bg-black/5 p-5",
        "dark:border-white/10 dark:bg-white/5",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">
          <div className="text-sm font-black text-black/90 dark:text-white/90">
            {title}
          </div>

          <div className="mt-1 text-xs leading-5 text-black/60 dark:text-white/60">
            {desc}
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange(!value)
          }
          className={clsx(
            "relative h-8 w-14 rounded-full border border-black/10 transition",
            "dark:border-white/10",
            value
              ? "bg-emerald-500"
              : "bg-black/10 dark:bg-white/10",
            disabled &&
              "cursor-not-allowed"
          )}
        >
          <span
            className={clsx(
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition",
              value
                ? "left-7"
                : "left-1"
            )}
          />
        </button>

      </div>
    </div>
  );
}

type NotifPrefs = {
  push_enabled: boolean;
  message_push: boolean;
  marketing_push: boolean;

  email_enabled: boolean;
  email_messages: boolean;
  email_marketing: boolean;
};

const DEFAULTS: NotifPrefs = {
  push_enabled: true,
  message_push: true,
  marketing_push: false,

  email_enabled: true,
  email_messages: true,
  email_marketing: false,
};

export default function NotificationsClient() {

  const router = useRouter();
  const { toast } = useToast();

  // ✅ build-safe params
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(
          window.location.search
        )
      : null;

  const back = useMemo(
    () =>
      (
        params?.get("next") ||
        "/settings"
      ).trim(),
    [params]
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [myId, setMyId] =
    useState<string | null>(null);

  const [prefs, setPrefs] =
    useState<NotifPrefs>(DEFAULTS);

  async function load() {
    setLoading(true);

    try {
      const { data: s } =
        await supabase.auth.getSession();

      const uid =
        s.session?.user?.id ?? null;

      if (!uid) {
        router.replace(
          `/auth?next=${encodeURIComponent(
            "/settings/notifications"
          )}`
        );

        return;
      }

      setMyId(uid);

      const { data, error } =
        await supabase
          .from(
            "notification_settings"
          )
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();

      if (error) {
        toast({
          variant: "warning",
          title: "Uyarı",
          message:
            "Varsayılan ayarlar gösteriliyor.",
        });

        setPrefs(DEFAULTS);
      } else {
        setPrefs({
          push_enabled:
            data?.push_enabled ??
            DEFAULTS.push_enabled,

          message_push:
            data?.message_push ??
            DEFAULTS.message_push,

          marketing_push:
            data?.marketing_push ??
            DEFAULTS.marketing_push,

          email_enabled:
            data?.email_enabled ??
            DEFAULTS.email_enabled,

          email_messages:
            data?.email_messages ??
            DEFAULTS.email_messages,

          email_marketing:
            data?.email_marketing ??
            DEFAULTS.email_marketing,
        });
      }
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Yüklenemedi",
        message:
          e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(
    nextPrefs: NotifPrefs
  ) {
    const uid = myId;

    if (!uid) return;

    setSaving(true);

    try {
      const { error } =
        await supabase
          .from(
            "notification_settings"
          )
          .upsert(
            {
              user_id: uid,
              ...nextPrefs,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

      if (error) throw error;

      toast({
        variant: "success",
        title: "Kaydedildi",
        message:
          "Bildirim ayarların güncellendi.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        message:
          e?.message ?? "Hata oluştu.",
      });

      load();
    } finally {
      setSaving(false);
    }
  }

  function patch(
    p: Partial<NotifPrefs>
  ) {
    setPrefs((prev) => {
      const next = {
        ...prev,
        ...p,
      };

      if (
        p.push_enabled === false
      ) {
        next.message_push = false;
        next.marketing_push = false;
      }

      if (
        p.email_enabled === false
      ) {
        next.email_messages = false;
        next.email_marketing = false;
      }

      save(next);

      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">

      <div className="flex items-end justify-between gap-3">

        <div>
          <div className="text-2xl font-black tracking-tight">
            Bildirim Ayarları
          </div>

          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Push ve e-posta tercihlerini yönet.
          </div>
        </div>

        <Link
          href={back || "/settings"}
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
        >
          ← Geri
        </Link>

      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">

        {loading ? (
          <div className="text-sm text-black/60 dark:text-white/60">
            Yükleniyor…
          </div>
        ) : (
          <div
            className={clsx(
              "space-y-3",
              saving && "opacity-80"
            )}
          >

            <div className="text-sm font-black text-black/85 dark:text-white/85">
              Push Bildirimleri
            </div>

            <ToggleRow
              title="Push bildirimleri"
              desc="Genel push bildirimlerini aç/kapat."
              value={prefs.push_enabled}
              disabled={saving}
              onChange={(v) =>
                patch({
                  push_enabled: v,
                })
              }
            />

            <ToggleRow
              title="Mesaj bildirimleri"
              desc="Yeni mesaj geldiğinde bildirim al."
              value={prefs.message_push}
              disabled={
                saving ||
                !prefs.push_enabled
              }
              onChange={(v) =>
                patch({
                  message_push: v,
                })
              }
            />

            <ToggleRow
              title="Pazarlama"
              desc="Kampanya bildirimleri."
              value={prefs.marketing_push}
              disabled={
                saving ||
                !prefs.push_enabled
              }
              onChange={(v) =>
                patch({
                  marketing_push: v,
                })
              }
            />

          </div>
        )}

      </div>
    </div>
  );
}