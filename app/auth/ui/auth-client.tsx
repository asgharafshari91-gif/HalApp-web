"use client";

import Image from "next/image";
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

export default function AuthClient() {
  const router = useRouter();

  const { toast } =
    useToast();

  const params =
    typeof window !==
    "undefined"
      ? new URLSearchParams(
          window.location.search
        )
      : null;

  const next = useMemo(
    () =>
      safeNext(
        params?.get("next") ??
          null
      ),
    [params]
  );

  const [mode, setMode] =
    useState<
      "phone" | "otp"
    >("phone");

  const [
    phoneInput,
    setPhoneInput,
  ] = useState("");

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
const [qrModalOpen, setQrModalOpen] = useState(false);
const [qrLoading, setQrLoading] = useState(false);
const [qrMessage, setQrMessage] = useState(
  "HalApp mobil uygulamasındaki QR okuyucu ile web QR kodunu okut."
);
  useEffect(() => {
    let alive = true;

    async function check() {
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

    check();

    const { data: sub } =
      supabase.auth.onAuthStateChange(
        (
          _evt,
          session
        ) => {
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
            provider:
              "google",

            options: {
              redirectTo:
                `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                  next
                )}`,
            },
          }
        );

      if (error)
        throw error;
    } catch (e: any) {
      toast({
        variant:
          "error",
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
            provider:
              "apple",

            options: {
              redirectTo:
                `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                  next
                )}`,
            },
          }
        );

      if (error)
        throw error;
    } catch (e: any) {
      toast({
        variant:
          "error",
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
        variant:
          "error",
        title:
          "Telefon geçersiz",
        message:
          "5XXXXXXXXX formatı kullan.",
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

      if (error)
        throw error;

      setSentPhone(phone);

      setMode("otp");

      toast({
        variant:
          "success",
        title:
          "Kod gönderildi",
        message:
          `${phone} numarasına SMS gönderildi.`,
      });
    } catch (e: any) {
      toast({
        variant:
          "error",
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
    if (!sentPhone)
      return;

    const code =
      otp.trim();

    if (code.length < 4) {
      toast({
        variant:
          "error",
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
            phone:
              sentPhone,
            token: code,
            type: "sms",
          }
        );

      if (error)
        throw error;

      toast({
        variant:
          "success",
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
        variant:
          "error",
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
function openQrLogin() {
  setQrModalOpen(true);
  setQrMessage(
    "HalApp mobil uygulamasındaki QR okuyucu ile web QR kodunu okut."
  );
}
  return (
    <div className="relative z-[200] mx-auto flex min-h-[75vh] w-full max-w-md items-center justify-center px-4 py-10">
      <div
        className={clsx(
          "relative w-full overflow-hidden",
          "rounded-[38px]",
          "border border-white/10",
          "bg-white/80 dark:bg-[#0B0F19]/90",
          "shadow-[0_25px_120px_rgba(0,0,0,0.18)]",
          "backdrop-blur-2xl"
        )}
      >
        {/* PREMIUM GLOW */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-90px] top-[-90px] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="absolute bottom-[-100px] right-[-100px] h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.08),transparent_35%)]" />
        </div>

        <div className="relative p-7 sm:p-8">
          {/* LOGO */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/10 bg-white/70 shadow-[0_20px_60px_rgba(34,197,94,.15)] dark:bg-white/[0.04]">
              <Image
                src="/halapp-logo.png"
                alt="HalApp"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
              HalApp Web
            </h1>

            <p className="mt-2 max-w-xs text-sm leading-relaxed text-black/60 dark:text-white/60">
              Güvenli giriş ile
              canlı hal piyasasına
              bağlan.
            </p>
          </div>

          {/* GOOGLE */}
          <button
            type="button"
            disabled={loading}
            onClick={
              signInGoogle
            }
            className={clsx(
              "group mb-3 flex h-14 w-full items-center justify-center gap-3",
              "rounded-2xl border border-black/10 dark:border-white/10",
              "bg-white dark:bg-white/[0.04]",
              "font-bold text-black dark:text-white",
              "transition-all duration-200",
              "hover:scale-[1.01]",
              "hover:shadow-[0_15px_40px_rgba(0,0,0,.08)]"
            )}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5Z"
              />
            </svg>

            Google ile devam et
          </button>

          {/* APPLE */}
          <button
            type="button"
            disabled={loading}
            onClick={
              signInApple
            }
            className={clsx(
              "group mb-7 flex h-14 w-full items-center justify-center gap-3",
              "rounded-2xl border border-black/10 dark:border-white/10",
              "bg-black text-white",
              "font-bold",
              "transition-all duration-200",
              "hover:scale-[1.01]",
              "hover:opacity-90"
            )}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M16.125 1.5c.056 1.09-.313 2.133-.983 2.95-.703.865-1.855 1.53-2.97 1.44-.14-1.048.342-2.16 1.01-2.94.734-.86 1.96-1.49 2.943-1.45ZM19.5 17.16c-.56 1.25-.83 1.81-1.55 2.93-1 1.56-2.42 3.5-4.18 3.52-1.57.02-1.98-1.03-4.11-1.02-2.13.01-2.58 1.04-4.15 1-1.76-.03-3.1-1.77-4.1-3.33-2.8-4.28-3.1-9.3-1.37-11.94 1.22-1.87 3.15-2.96 4.97-2.96 1.86 0 3.03 1.03 4.57 1.03 1.5 0 2.42-1.03 4.56-1.03 1.62 0 3.35.88 4.57 2.4-4.03 2.2-3.38 7.95.74 9.43Z" />
            </svg>

            Apple ile devam et
          </button>
{/* QR LOGIN */}
<button
  type="button"
  disabled={loading || qrLoading}
  onClick={openQrLogin}
  className={clsx(
    "group mb-7 flex h-14 w-full items-center justify-center gap-3",
    "rounded-2xl border border-emerald-500/25",
    "bg-gradient-to-r from-emerald-500 to-green-500",
    "font-black text-black",
    "shadow-[0_20px_60px_rgba(34,197,94,.22)]",
    "transition-all duration-200",
    "hover:scale-[1.01]",
    "hover:from-emerald-400 hover:to-green-400",
    "disabled:opacity-60"
  )}
>
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="5" height="5" rx="1" />
    <rect x="16" y="3" width="5" height="5" rx="1" />
    <rect x="3" y="16" width="5" height="5" rx="1" />
    <path d="M16 16h1" />
    <path d="M20 16v1" />
    <path d="M16 20h4" />
    <path d="M20 17v3" />
  </svg>

  QR Kod ile Giriş Yap
</button>
          {/* DIVIDER */}
          <div className="relative mb-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10 dark:border-white/10" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-[11px] font-black uppercase tracking-[0.2em] text-black/40 dark:bg-[#0B0F19] dark:text-white/40">
                veya telefon ile
              </span>
            </div>
          </div>

          {/* PHONE */}
          {mode ===
          "phone" ? (
            <>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-black/70 dark:text-white/70">
                  Telefon Numaran
                </label>

                <div
                  className={clsx(
                    "group relative overflow-hidden",
                    "rounded-[24px]",
                    "border border-black/10 dark:border-white/10",
                    "bg-white dark:bg-white/[0.04]",
                    "transition-all duration-200",
                    "focus-within:border-emerald-500/40",
                    "focus-within:shadow-[0_0_0_4px_rgba(34,197,94,.12)]"
                  )}
                >
                  {/* glow */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(34,197,94,.12),transparent_40%)]" />
                  </div>

                  <div className="relative flex items-center">
                    <div className="flex h-16 items-center border-r border-black/10 px-5 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          🇹🇷
                        </span>

                        <span className="text-sm font-black text-black/75 dark:text-white/75">
                          +90
                        </span>
                      </div>
                    </div>

                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="5XX XXX XX XX"
                      value={phoneInput}
                      onChange={(e) =>
                        setPhoneInput(
                          e.target
                            .value
                        )
                      }
                      className={clsx(
                        "h-16 w-full bg-transparent px-5",
                        "text-[15px] font-bold tracking-wide",
                        "text-black dark:text-white",
                        "outline-none",
                        "placeholder:text-black/30 dark:placeholder:text-white/30"
                      )}
                    />
                  </div>
                </div>

                <div className="mt-2 pl-1 text-[12px] text-black/45 dark:text-white/45">
                  SMS doğrulama kodu gönderilecektir.
                </div>
              </div>

              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  sendOtp
                }
                className={clsx(
                  "relative h-14 w-full overflow-hidden rounded-2xl",
                  "bg-emerald-500",
                  "text-sm font-black text-black",
                  "transition-all duration-200",
                  "hover:scale-[1.01]",
                  "hover:bg-emerald-400",
                  "disabled:opacity-60",
                  "shadow-[0_20px_60px_rgba(34,197,94,.25)]"
                )}
              >
                <span className="relative z-10">
                  {loading
                    ? "Gönderiliyor..."
                    : "SMS Kodu Gönder"}
                </span>

                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent)] animate-[shine_2.5s_linear_infinite]" />
              </button>
            </>
          ) : (
            <>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-black/70 dark:text-white/70">
                  SMS Kodu
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target
                        .value
                    )
                  }
                  className={clsx(
                    "h-16 w-full rounded-[24px]",
                    "border border-black/10 dark:border-white/10",
                    "bg-white dark:bg-white/[0.04]",
                    "px-5 text-center",
                    "text-2xl font-black tracking-[10px]",
                    "text-black dark:text-white",
                    "outline-none",
                    "focus:border-emerald-500/40",
                    "focus:shadow-[0_0_0_4px_rgba(34,197,94,.12)]"
                  )}
                />
              </div>

              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  verifyOtp
                }
                className={clsx(
                  "h-14 w-full rounded-2xl",
                  "bg-emerald-500",
                  "text-sm font-black text-black",
                  "transition-all duration-200",
                  "hover:scale-[1.01]",
                  "hover:bg-emerald-400",
                  "disabled:opacity-60",
                  "shadow-[0_20px_60px_rgba(34,197,94,.25)]"
                )}
              >
                {loading
                  ? "Doğrulanıyor..."
                  : "Giriş Yap"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setMode(
                    "phone"
                  )
                }
                className="mt-4 w-full text-center text-sm font-bold text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
              >
                Telefon numarasını değiştir
              </button>
            </>
          )}
        </div>
      </div>
{qrModalOpen && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
    <div className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-white/10 bg-[#07100C] p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,.45)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-80px] top-[-80px] h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-[-90px] right-[-90px] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="16" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="16" width="5" height="5" rx="1" />
              <path d="M16 16h1" />
              <path d="M20 16v1" />
              <path d="M16 20h4" />
              <path d="M20 17v3" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black">QR ile Web Girişi</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-white/55">
              Mobil HalApp uygulamasında Profil &gt; Web QR Girişi bölümünden
              bu web oturumunu onayla.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQrModalOpen(false)}
            className="rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/15 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-emerald-500/25 bg-black/25 p-5 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2h-3" />
                  <path d="M1 19a2 2 0 0 0 2 2h3" />
                  <path d="M23 5a2 2 0 0 0-2-2h-3" />
                  <path d="M1 5a2 2 0 0 1 2-2h3" />
                  <path d="M7 8h10" />
                  <path d="M7 12h10" />
                  <path d="M7 16h10" />
                </svg>
              </div>

              <p className="text-sm font-bold text-white/80">{qrMessage}</p>
              <p className="mt-2 text-xs font-semibold text-white/40">
                Kamera mobil uygulamada açılır. Web burada QR giriş sayfasına
                yönlendirilir.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setQrModalOpen(false)}
            className="h-12 rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={() => {
              setQrModalOpen(false);
              router.push(`/qr-login?next=${encodeURIComponent(next)}`);
            }}
            className="h-12 rounded-2xl bg-emerald-500 text-sm font-black text-black transition hover:bg-emerald-400"
          >
            QR Sayfasını Aç
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}