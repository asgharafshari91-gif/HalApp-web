"use client";

import Image from "next/image";
import QRCode from "qrcode";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function QrLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);

  const [token, setToken] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [status, setStatus] = useState<QrStatus>("loading");
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [message, setMessage] = useState("QR oturumu hazırlanıyor...");

  const consumedRef = useRef(false);

  const qrPayload = useMemo(() => {
    if (!token) return "";
    return `halapp://web-login?token=${token}`;
  }, [token]);

  const completeQrLogin = useCallback(
    async (silent = false) => {
      if (!token) return false;
      if (consumedRef.current) return false;

      consumedRef.current = true;

      try {
        if (!silent) {
          setStatus("approved");
          setMessage("Mobil onay alındı. Web oturumu hazırlanıyor...");
        }

        const res = await fetch("/api/auth/qr-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const j = await res.json().catch(() => ({}));

        if (!res.ok) {
          consumedRef.current = false;

          if (j?.error === "qr_not_approved") return false;

          if (!silent) {
            setStatus("error");
            setMessage(j?.error ?? "Web oturumu oluşturulamadı.");
          }

          return false;
        }

        setStatus("approved");
        setMessage("Giriş tamamlandı. Yönlendiriliyorsun...");

        window.setTimeout(() => {
          router.replace(next);
          router.refresh();
        }, 600);

        return true;
      } catch (e: any) {
        consumedRef.current = false;

        if (!silent) {
          setStatus("error");
          setMessage(e?.message ?? "Web oturumu oluşturulamadı.");
        }

        return false;
      }
    },
    [token, next, router]
  );

  useEffect(() => {
    setToken(makeToken());
  }, []);

  useEffect(() => {
    if (!token || !qrPayload) return;

    let alive = true;

    async function boot() {
      try {
        consumedRef.current = false;
        setStatus("loading");
        setSecondsLeft(120);
        setMessage("QR oturumu hazırlanıyor...");

        const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

        const { error } = await supabase.from("web_qr_login_sessions").insert({
          token,
          status: "pending",
          expires_at: expiresAt,
          device_label: "HalApp Web",
          user_agent:
            typeof navigator !== "undefined" ? navigator.userAgent : "web",
        });

        if (error) throw error;

        const qr = await QRCode.toDataURL(qrPayload, {
          margin: 2,
          width: 340,
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
          const row = payload.new as { status?: string };

          if (row.status === "approved") {
            await completeQrLogin(false);
          }

          if (row.status === "cancelled") {
            setStatus("cancelled");
            setMessage("QR giriş isteği mobil uygulamada iptal edildi.");
          }

          if (row.status === "expired") {
            setStatus("expired");
            setMessage("QR süresi doldu. Sayfayı yenile.");
          }

          if (row.status === "used") {
            setStatus("approved");
            setMessage("Giriş tamamlandı. Yönlendiriliyorsun...");
            window.setTimeout(() => {
              router.replace(next);
              router.refresh();
            }, 600);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, next, router, completeQrLogin]);

  useEffect(() => {
    if (!token) return;
    if (status !== "pending" && status !== "loading") return;

    const timer = window.setInterval(() => {
      completeQrLogin(true);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [token, status, completeQrLogin]);

  useEffect(() => {
    if (status !== "pending" && status !== "loading") return;

    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          setStatus("expired");
          setMessage("QR süresi doldu. Yeni QR almak için sayfayı yenile.");

          if (token) {
            supabase
              .from("web_qr_login_sessions")
              .update({ status: "expired" })
              .eq("token", token)
              .eq("status", "pending")
              .then(() => {});
          }

          return 0;
        }

        return s - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, token]);

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

  const statusColor =
    status === "approved"
      ? "text-emerald-700 bg-emerald-500/12 border-emerald-500/25"
      : status === "expired" || status === "cancelled" || status === "error"
        ? "text-red-700 bg-red-500/10 border-red-500/20"
        : "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";

  return (
    <main className="fixed inset-0 z-[9999] overflow-y-auto bg-[#F4F8F5] px-4 py-10 text-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-150px] top-[-150px] h-[420px] w-[420px] rounded-full bg-emerald-300/35 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-160px] h-[420px] w-[420px] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute left-[20%] top-[12%] h-56 w-56 rounded-full bg-lime-200/30 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[38px] border border-white/80 bg-white/90 shadow-[0_28px_120px_rgba(15,23,42,.13)] backdrop-blur-2xl">
          <div className="relative p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(34,197,94,.16)]">
                  <Image
                    src="/halapp-logo.png"
                    alt="HalApp"
                    width={34}
                    height={34}
                    priority
                  />
                </div>

                <div>
                  <div className="text-sm font-black text-slate-950">
                    HalApp Web
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    QR güvenli giriş
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
              >
                Geri
              </button>
            </div>

            <div className="mb-5">
              <div
                className={clsx(
                  "mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black",
                  statusColor
                )}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(34,197,94,.9)]" />
                {statusText}
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                QR ile Giriş
              </h1>

              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                Mobil uygulamada hesabın açıksa QR kodu okutarak HalApp Web’e
                hızlı ve güvenli giriş yap.
              </p>
            </div>

            <div className="relative mb-5 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,.09)]">
              <div className="relative flex items-center justify-center rounded-[26px] bg-white p-4 ring-1 ring-slate-100">
                {qrUrl ? (
                  <Image
                    src={qrUrl}
                    alt="HalApp QR Login"
                    width={340}
                    height={340}
                    unoptimized
                    className={clsx(
                      "h-[285px] w-[285px] rounded-2xl object-contain",
                      status !== "pending" && status !== "loading"
                        ? "opacity-45 grayscale"
                        : "opacity-100"
                    )}
                  />
                ) : (
                  <div className="flex h-[285px] w-[285px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-black text-slate-500">
                    QR hazırlanıyor...
                  </div>
                )}
              </div>
            </div>

            <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700">
                  ✓
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900">
                    {message}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    Mobil: Profil → QR ile Web Girişi → Web QR Kodunu Okut.
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-black text-slate-400">
                <span>Güvenli oturum</span>
                <span>{secondsLeft} sn</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Başka yöntemle giriş
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-12 rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_18px_50px_rgba(34,197,94,.24)] transition hover:bg-emerald-400"
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

export default function QrLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F4F8F5] text-slate-950">
          <div className="text-sm font-black text-slate-600">
            QR hazırlanıyor...
          </div>
        </main>
      }
    >
      <QrLoginContent />
    </Suspense>
  );
}