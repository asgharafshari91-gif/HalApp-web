"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const REASONS = [
  { v: "spam", t: "Spam / Dolandırıcılık" },
  { v: "harassment", t: "Taciz / Tehdit" },
  { v: "inappropriate", t: "Uygunsuz içerik" },
  { v: "fake", t: "Sahte hesap" },
  { v: "other", t: "Diğer" },
];

export default function ReportClient() {
  const router = useRouter();
  const { toast } = useToast();

  // ✅ Build-safe params
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const targetUserId = useMemo(
    () => (params?.get("user") || "").trim() || null,
    [params]
  );

  const back = useMemo(
    () => (params?.get("next") || "/settings").trim(),
    [params]
  );

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");

  const [sending, setSending] = useState(false);

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
            "/settings/report"
          )}`
        );

        return;
      }

      setMyId(uid);

      if (
        targetUserId &&
        targetUserId === uid
      ) {
        toast({
          variant: "warning",
          title: "Uyarı",
          message:
            "Kendini şikayet edemezsin 🙂",
        });
      }
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Açılış hatası",
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

  async function submit() {
    const uid = myId;

    if (!uid) return;

    if (!targetUserId) {
      toast({
        variant: "warning",
        title: "Eksik",
        message:
          "Şikayet edilecek kullanıcı bulunamadı.",
      });

      return;
    }

    if (targetUserId === uid) {
      toast({
        variant: "warning",
        title: "Geçersiz",
        message:
          "Kendini şikayet edemezsin.",
      });

      return;
    }

    setSending(true);

    try {
      const payload = {
        reporter_id: uid,
        target_user_id: targetUserId,
        reason,
        details:
          details.trim() || null,
        created_at:
          new Date().toISOString(),
      };

      const { error } =
        await supabase
          .from("reports")
          .insert(payload);

      if (error) throw error;

      toast({
        variant: "success",
        title: "Gönderildi",
        message:
          "Şikayetin incelemeye alınacak.",
      });

      setDetails("");

      router.push(
        back || "/settings"
      );
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Gönderilemedi",
        message:
          e?.message ?? "Hata oluştu.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">

      <div className="flex items-end justify-between gap-3">

        <div>
          <div className="text-2xl font-black tracking-tight">
            Sorun Bildir
          </div>

          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Spam, sahte hesap veya uygunsuz içerikleri bildir.
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
          <div className="space-y-4">

            <div className="rounded-3xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">

              <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
                Şikayet edilen kullanıcı
              </div>

              <div className="mt-2 text-sm font-black text-black/85 dark:text-white/85">
                {targetUserId || "—"}
              </div>

            </div>

            <div className="rounded-3xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">

              <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
                Sebep
              </div>

              <div className="mt-3 grid gap-2">

                {REASONS.map((x) => (
                  <button
                    key={x.v}
                    type="button"
                    onClick={() =>
                      setReason(x.v)
                    }
                    className={clsx(
                      "w-full rounded-2xl border px-4 py-3 text-left text-sm font-extrabold transition",
                      reason === x.v
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                        : "border-black/10 bg-white/70 text-black/80 hover:bg-white dark:border-white/10 dark:bg-black/20 dark:text-white/80 dark:hover:bg-black/30"
                    )}
                  >
                    {x.t}
                  </button>
                ))}

              </div>

            </div>

            <div className="rounded-3xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-white/5">

              <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
                Detay
              </div>

              <textarea
                value={details}
                onChange={(e) =>
                  setDetails(e.target.value)
                }
                placeholder="Detay yazabilirsin…"
                className={clsx(
                  "mt-3 min-h-[120px] w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-black/80 outline-none",
                  "focus:ring-2 focus:ring-emerald-500/40",
                  "dark:border-white/10 dark:bg-black/30 dark:text-white/85"
                )}
              />

            </div>

            <button
              type="button"
              onClick={submit}
              disabled={
                sending ||
                !targetUserId
              }
              className={clsx(
                "w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-400",
                (sending ||
                  !targetUserId) &&
                  "cursor-not-allowed opacity-60"
              )}
            >
              {sending
                ? "Gönderiliyor…"
                : "Şikayeti Gönder"}
            </button>

          </div>
        )}

      </div>
    </div>
  );
}