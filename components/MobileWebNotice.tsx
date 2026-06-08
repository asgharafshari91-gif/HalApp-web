"use client";

import { useEffect, useState } from "react";

export default function MobileWebNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const closed = sessionStorage.getItem("halapp_mobile_notice_closed");
    const isMobile = window.innerWidth < 768;

    if (isMobile && !closed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function close() {
    sessionStorage.setItem("halapp_mobile_notice_closed", "1");
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[9999] px-4 md:hidden">
      <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] border border-emerald-500/25 bg-zinc-950 text-white shadow-2xl shadow-emerald-500/20">
        <div className="relative p-5">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />

          <div className="relative">
            <div className="mb-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-300">
              📱 Mobil deneyim önerisi
            </div>

            <h3 className="text-xl font-black leading-tight">
              HalApp’i daha verimli kullanın
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Web sitemizi daha rahat kullanmak için bilgisayar veya tablet üzerinden giriş yapabilirsiniz.
              Mobil kullanım için HalApp uygulamasını Google Play veya App Store’dan indirmenizi öneririz.
            </p>

            <div className="mt-5 grid gap-2">
              <a
                href="#"
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-black text-black"
              >
                Google Play’den İndir
              </a>

              <a
                href="#"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-black text-white"
              >
                App Store’dan İndir
              </a>

              <button
                onClick={close}
                className="rounded-2xl px-4 py-2 text-sm font-black text-white/55"
              >
                Şimdilik kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}