// app/auth/ui/auth-client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function normalizePhoneTR(raw: string) {
  let v = raw.trim().replace(/\s+/g, "");
  if (!v) return "";
  if (v.startsWith("0")) v = v.slice(1);
  if (v.startsWith("+90")) v = v.slice(3);
  if (v.startsWith("90")) v = v.slice(2);
  if (!v.startsWith("5")) return "";
  if (v.length !== 10) return "";
  return `+90${v}`;
}

/** ✅ next param güvenli olsun: sadece internal path */
function safeNext(raw: string | null) {
  const v = (raw ?? "").trim();
  if (!v) return "/";
  if (v.startsWith("http://") || v.startsWith("https://")) return "/";
  if (v.startsWith("//")) return "/";
  if (!v.startsWith("/")) return "/";
  return v;
}

export default function AuthClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  // ✅ useMemo dependency: string üzerinden
  const nextRaw = sp.get("next");
  const next = useMemo(() => safeNext(nextRaw), [nextRaw]);

  const [mode, setMode] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [sentPhone, setSentPhone] = useState<string | null>(null);

  // ✅ replace döngüsünü kesin kes
  const redirectedRef = useRef(false);

  useEffect(() => {
    let alive = true;

    async function checkSessionOnce() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data.session && !redirectedRef.current) {
        redirectedRef.current = true;
        router.replace(next);
      }
    }

    checkSessionOnce();

    // ✅ auth event olursa da 1 kere redirect
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      if (session && !redirectedRef.current) {
        redirectedRef.current = true;
        router.replace(next);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  async function signInGoogle() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Google giriş hatası",
        message: e?.message ?? "Hata oluştu.",
      });
      setLoading(false);
    }
  }

  async function signInApple() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Apple giriş hatası",
        message: e?.message ?? "Hata oluştu.",
      });
      setLoading(false);
    }
  }

  async function sendOtp() {
    const phone = normalizePhoneTR(phoneInput);
    if (!phone) {
      toast({
        variant: "error",
        title: "Telefon geçersiz",
        message:
          "05xx… ya da 5xx… formatında 10 haneli gir. (Örn: 5xxxxxxxxx)",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;

      setSentPhone(phone);
      setMode("otp");
      toast({
        variant: "success",
        title: "Kod gönderildi",
        message: `SMS kodu ${phone} numarasına gönderildi.`,
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Kod gönderilemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!sentPhone) return;

    const code = otp.trim();
    if (code.length < 4) {
      toast({ variant: "error", title: "Kod eksik", message: "SMS kodunu gir." });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        phone: sentPhone,
        token: code,
        type: "sms",
      });
      if (error) throw error;

      toast({
        variant: "success",
        title: "Giriş başarılı",
        message: "Yönlendiriliyorsun…",
      });

      // ✅ burada da sadece 1 kere
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        router.replace(next);
      }
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Kod hatalı",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black tracking-tight">HalApp Web</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Telefon, Google veya Apple ile giriş yap.
        </div>

        {/* OAuth */}
        <div className="mt-5 space-y-2">
          <button
            disabled={loading}
            onClick={signInGoogle}
            className={[
              "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-black/5 transition",
              "dark:border-white/10 dark:bg-black/40 dark:text-white/85 dark:hover:bg-white/5",
              loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            Google ile devam et
          </button>

          <button
            disabled={loading}
            onClick={signInApple}
            className={[
              "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-black/5 transition",
              "dark:border-white/10 dark:bg-black/40 dark:text-white/85 dark:hover:bg-white/5",
              loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            Apple ile devam et
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          <div className="text-xs font-black text-black/50 dark:text-white/50">veya</div>
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        {/* Phone OTP */}
        {mode === "phone" ? (
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
              Telefon ile giriş
            </div>
            <input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="5xxxxxxxxx (örn: 5xx...)"
              inputMode="tel"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
            <button
              disabled={loading}
              onClick={sendOtp}
              className={[
                "w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              SMS Kodu Gönder
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
              Kod gir ({sentPhone})
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="SMS kodu"
              inputMode="numeric"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
            <button
              disabled={loading}
              onClick={verifyOtp}
              className={[
                "w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
                loading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              Giriş Yap
            </button>

            <button
              disabled={loading}
              onClick={() => {
                setMode("phone");
                setOtp("");
                setSentPhone(null);
              }}
              className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
            >
              Telefonu değiştir
            </button>
          </div>
        )}

        <div className="mt-6 text-xs text-black/50 dark:text-white/50">
          Giriş yaparak HalApp kullanım şartlarını kabul etmiş olursun.
        </div>
      </div>
    </div>
  );
}