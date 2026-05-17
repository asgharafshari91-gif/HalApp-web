"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function normalizePhoneTR(
  raw: string
) {
  let v = raw
    .trim()
    .replace(/\s+/g, "");

  if (!v) return "";

  if (v.startsWith("0"))
    v = v.slice(1);

  if (v.startsWith("+90"))
    v = v.slice(3);

  if (v.startsWith("90"))
    v = v.slice(2);

  if (!v.startsWith("5"))
    return "";

  if (v.length !== 10)
    return "";

  return `+90${v}`;
}

function safeNext(
  raw: string | null
) {
  const v = (raw ?? "").trim();

  if (!v) return "/";

  if (
    v.startsWith("http://") ||
    v.startsWith("https://")
  ) {
    return "/";
  }

  if (v.startsWith("//"))
    return "/";

  if (!v.startsWith("/"))
    return "/";

  return v;
}

export default function AuthClient() {

  const router = useRouter();
  const { toast } = useToast();

  // ✅ build-safe params
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(
          window.location.search
        )
      : null;

  const next = useMemo(
    () =>
      safeNext(
        params?.get("next") ||
          null
      ),
    [params]
  );

  const [mode, setMode] =
    useState<
      "phone" | "otp"
    >("phone");

  const [phoneInput, setPhoneInput] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    sentPhone,
    setSentPhone,
  ] = useState<
    string | null
  >(null);

  const redirectedRef =
    useRef(false);

  useEffect(() => {

    let alive = true;

    async function checkSession() {

      const { data } =
        await supabase.auth.getSession();

      if (!alive) return;

      if (
        data.session &&
        !redirectedRef.current
      ) {
        redirectedRef.current = true;

        router.replace(next);
      }
    }

    checkSession();

    const { data: sub } =
      supabase.auth.onAuthStateChange(
        (_evt, session) => {

          if (!alive) return;

          if (
            session &&
            !redirectedRef.current
          ) {
            redirectedRef.current = true;

            router.replace(next);
          }
        }
      );

    return () => {
      alive = false;

      sub.subscription.unsubscribe();
    };

  }, [next, router]);

  async function signInGoogle() {

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",

            options: {
              redirectTo:
                `${window.location.origin}` +
                `/auth/callback?next=${encodeURIComponent(
                  next
                )}`,
            },
          }
        );

      if (error) throw error;

    } catch (e: any) {

      toast({
        variant: "error",
        title:
          "Google giriş hatası",
        message:
          e?.message ??
          "Hata oluştu.",
      });

      setLoading(false);
    }
  }

  async function signInApple() {

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "apple",

            options: {
              redirectTo:
                `${window.location.origin}` +
                `/auth/callback?next=${encodeURIComponent(
                  next
                )}`,
            },
          }
        );

      if (error) throw error;

    } catch (e: any) {

      toast({
        variant: "error",
        title:
          "Apple giriş hatası",
        message:
          e?.message ??
          "Hata oluştu.",
      });

      setLoading(false);
    }
  }

  async function sendOtp() {

    const phone =
      normalizePhoneTR(
        phoneInput
      );

    if (!phone) {

      toast({
        variant: "error",
        title:
          "Telefon geçersiz",
        message:
          "5xxxxxxxxx formatı kullan.",
      });

      return;
    }

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.signInWithOtp(
          {
            phone,

            options: {
              shouldCreateUser: true,
            },
          }
        );

      if (error) throw error;

      setSentPhone(phone);

      setMode("otp");

      toast({
        variant: "success",
        title:
          "Kod gönderildi",
        message:
          `${phone} numarasına SMS gönderildi.`,
      });

    } catch (e: any) {

      toast({
        variant: "error",
        title:
          "Kod gönderilemedi",
        message:
          e?.message ??
          "Hata oluştu.",
      });

    } finally {

      setLoading(false);
    }
  }

  async function verifyOtp() {

    if (!sentPhone) return;

    const code =
      otp.trim();

    if (code.length < 4) {

      toast({
        variant: "error",
        title:
          "Kod eksik",
        message:
          "SMS kodunu gir.",
      });

      return;
    }

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.verifyOtp(
          {
            phone: sentPhone,
            token: code,
            type: "sms",
          }
        );

      if (error) throw error;

      toast({
        variant: "success",
        title:
          "Giriş başarılı",
        message:
          "Yönlendiriliyorsun…",
      });

      if (
        !redirectedRef.current
      ) {
        redirectedRef.current = true;

        router.replace(next);
      }

    } catch (e: any) {

      toast({
        variant: "error",
        title:
          "Kod hatalı",
        message:
          e?.message ??
          "Hata oluştu.",
      });

    } finally {

      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">

        <div className="text-2xl font-black tracking-tight">
          HalApp Web
        </div>

        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Telefon, Google veya Apple ile giriş yap.
        </div>

      </div>

    </div>
  );
}