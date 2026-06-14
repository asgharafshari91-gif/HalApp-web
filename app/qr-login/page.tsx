"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

type QrStatus =
  | "loading"
  | "pending"
  | "approved"
  | "expired"
  | "cancelled"
  | "error";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function safeNext(raw: string | null) {
  const v = (raw ?? "").trim();
  if (!v) return "/";
  if (v.startsWith("http://") || v.startsWith("https://")) return "/";
  if (v.startsWith("//")) return "/";
  if (!v.startsWith("/")) return "/";
  return v;
}

function makeToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);

  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function QrLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);

  const [token] = useState(() => makeToken());
  const [qrUrl, setQrUrl] = useState("");
  const [status, setStatus] = useState<QrStatus>("loading");
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [message, setMessage] = useState("QR oturumu hazırlanıyor...");

  const consumedRef = useRef(false);

  const qrPayload = useMemo(() => {
    return `halapp://web-login?token=${token}`;
  }, [token]);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        setStatus("loading");
        setMessage("QR oturumu hazırlanıyor...");

        const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

        const { error } = await supabase.from("web_qr_login_sessions").insert({
          token,
          status: "pending",
          expires_at: expiresAt,
          device_label: "HalApp Web",
          user_agent: navigator.userAgent,
        });

        if (error) throw error;

        const qr = await QRCode.toDataURL(qrPayload, {
          margin: 2,
          width: 320,
          color: {
            dark: "#111827",
            light: "#FFFFFF",
          },
        });

        if (!alive) return;

        setQrUrl(qr);
        setStatus("pending");
        setMessage("HalApp mobil uygulamasından QR kodu okut.");
      } catch (e) {
        console.error("QR LOGIN BOOT ERROR:", e);

        if (!alive) return;

        setStatus("error");
        setMessage("QR oluşturulamadı. Sayfayı yenile.");
      }
    }

    boot();

    return () => {
      alive = false;
    };
  }, [token, qrPayload]);

  useEffect(() => {
    if (!token) return;

    const channel = supabase
      .channel(`qr-login-${token}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "web_qr_login_sessions",
          filter: `token=eq.${token}`,
        },
        async (payload) => {
          const row = payload.new as {
            status?: string;
            user_id?: string | null;
          };

          if (row.status === "approved") {
            setStatus("approved");
            setMessage("Mobil onay alındı. Web oturumu hazırlanıyor...");

            if (!consumedRef.current) {
              consumedRef.current = true;

              // Şimdilik onay sonrası yönlendiriyoruz.
              // Gerçek web session için sonraki adımda server API / Edge Function bağlayacağız.
              window.setTimeout(() => {
                router.replace(next);
              }, 1200);
            }
          }

          if (row.status === "cancelled") {
            setStatus("cancelled");
            setMessage("QR giriş isteği mobil uygulamada iptal edildi.");
          }

          if (row.status === "expired") {
            setStatus("expired");
            setMessage("QR süresi doldu. Sayfayı yenile.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, next, router]);

  useEffect(() => {
    if (status !== "pending" && status !== "loading") return;

    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          setStatus("expired");
          setMessage("QR süresi doldu. Yeni QR almak için sayfayı yenile.");
          return 0;
        }

        return s - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const progress = Math.max(0, Math.min(100, (secondsLeft / 120) * 100));

  const statusText =
    status === "loading"
      ? "Hazırlanıyor"
      : status === "pending"
      ? "Bekleniyor"
      : status === "approved"
      ? "Onaylandı"
      : status === "cancelled"
      ? "İptal edildi"
      : status === "expired"
      ? "Süresi doldu"
      : "Hata";

  return (
    <main
      className={clsx(
        "relative min-h-screen overflow-hidden px-4 py-10",
        "bg-[#F4F8F5] text-slate-950",
        "dark:bg-[#050B09] dark:text-white"
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute bottom-[-160px] right-[-160px] h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,.10),transparent_36%)]" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-md items-center justify-center">
        <div
          className={clsx(
            "w-full overflow-hidden rounded-[36px] border shadow-2xl backdrop-blur-2xl",
            "border-black/10 bg-white/86 shadow-black/10",
            "dark:border-white/10 dark:bg-white/[0.06] dark:shadow-black/40"
          )}
        >
          <div className="relative p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border",
                    "border-black/10 bg-white shadow-lg",
                    "dark:border-white/10 dark:bg-white/[0.06]"
                  )}
                >
                  <Image
                    src="/halapp-logo.png"
                    alt="HalApp"
                    width={34}
                    height={34}
                    priority
                  />
                </div>

                <div>
                  <div className="text-sm font-black">HalApp Web</div>
                  <div className="text-xs font-bold text-slate-500 dark:text-white/45">
                    QR güvenli giriş
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/auth")}
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-black transition",
                  "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  "dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
                )}
              >
                Geri
              </button>
            </div>

            <div className="mb-5">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(34,197,94,.9)]" />
                {statusText}
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                QR ile Giriş
              </h1>

              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 dark:text-white/55">
                Mobil uygulamada hesabın açıksa QR kodu okutarak HalApp Web’e
                hızlı ve güvenli giriş yap.
              </p>
            </div>

            <div
              className={clsx(
                "relative mb-5 rounded-[30px] border p-4",
                "border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.08)]",
                "dark:border-white/10 dark:bg-black/25 dark:shadow-black/30"
              )}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(34,197,94,.08),transparent_40%)]" />

              <div className="relative flex items-center justify-center rounded-[24px] bg-white p-4">
                {qrUrl ? (
                  <Image
                    src={qrUrl}
                    alt="HalApp QR Login"
                    width={320}
                    height={320}
                    unoptimized
                    className={clsx(
                      "h-[280px] w-[280px] rounded-2xl object-contain",
                      status !== "pending" && status !== "loading"
                        ? "opacity-45 grayscale"
                        : "opacity-100"
                    )}
                  />
                ) : (
                  <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-black text-slate-500">
                    QR hazırlanıyor...
                  </div>
                )}
              </div>
            </div>

            <div
              className={clsx(
                "mb-5 rounded-3xl border p-4",
                "border-slate-200 bg-slate-50",
                "dark:border-white/10 dark:bg-white/[0.05]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {message}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-white/45">
                    Mobil: Profil → QR ile Web Girişi → Web QR Kodunu Okut.
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-black text-slate-400 dark:text-white/35">
                <span>Güvenli oturum</span>
                <span>{secondsLeft} sn</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className={clsx(
                  "h-12 rounded-2xl border text-sm font-black transition",
                  "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  "dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 dark:hover:bg-white/[0.08]"
                )}
              >
                Başka yöntemle giriş
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-12 rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_18px_50px_rgba(34,197,94,.22)] transition hover:bg-emerald-400"
              >
                Yeni QR Oluştur
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}