"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CookieConsent from "@/components/CookieConsent";
import MobileWebNotice from "@/components/MobileWebNotice";

export default function RootChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCleanPage = pathname?.startsWith("/qr-login");

  if (isCleanPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <MobileWebNotice />

      <main className="relative mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 pb-16 pt-6">
        {children}
      </main>

      <footer className="w-full max-w-full overflow-x-clip border-t border-black/10 bg-white/50 dark:border-white/10 dark:bg-black/30">
        <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-10 text-sm text-black/60 dark:text-white/60">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold text-black/80 dark:text-white/80">
              HalApp
            </div>
            <div className="shrink-0">
              ©️ {new Date().getFullYear()} HalApp • Tüm hakları saklıdır.
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <a href="/privacy" className="font-extrabold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white">
              KVKK & Çerez Politikası
            </a>
            <a href="/terms" className="font-extrabold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white">
              Kullanım Koşulları
            </a>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </>
  );
}