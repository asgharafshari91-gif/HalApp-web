// app/qr-login/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabaseClient";

function makeToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function QrLoginPage() {
  const [token] = useState(() => makeToken());
  const [qrUrl, setQrUrl] = useState("");
  const [status, setStatus] = useState<"loading" | "pending" | "approved" | "expired" | "error">("loading");
  const [message, setMessage] = useState("QR hazırlanıyor...");

  const qrPayload = useMemo(() => {
    return `halapp://web-login?token=${token}`;
  }, [token]);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
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
          width: 280,
        });

        if (!alive) return;

        setQrUrl(qr);
        setStatus("pending");
        setMessage("HalApp mobil uygulamasından QR kodu okut.");
      } catch (e) {
        console.error(e);
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
        (payload) => {
          const next = payload.new as {
            status?: string;
            user_id?: string | null;
          };

          if (next.status === "approved") {
            setStatus("approved");
            setMessage("Mobil onay alındı. Web oturumu hazırlanıyor...");
          }

          if (next.status === "expired" || next.status === "cancelled") {
            setStatus("expired");
            setMessage("QR süresi doldu veya iptal edildi. Sayfayı yenile.");
          }
        }
      )
      .subscribe();

    const timer = window.setTimeout(() => {
      setStatus("expired");
      setMessage("QR süresi doldu. Sayfayı yenile.");
    }, 2 * 60 * 1000);

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#07100c] text-white flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
        <div className="mb-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            📱
          </div>
          <h1 className="mt-4 text-2xl font-black">QR ile Giriş</h1>
          <p className="mt-2 text-sm font-semibold text-white/60">
            Mobil uygulamada hesabın açıksa QR kodu okutarak web’e giriş yap.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-4 flex items-center justify-center">
          {qrUrl ? (
            <img src={qrUrl} alt="HalApp QR Login" className="h-[280px] w-[280px]" />
          ) : (
            <div className="h-[280px] w-[280px] flex items-center justify-center text-black">
              Hazırlanıyor...
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold text-white/80">{message}</p>
          <p className="mt-2 text-xs text-white/40">
            Durum: {status}
          </p>
        </div>
      </section>
    </main>
  );
}