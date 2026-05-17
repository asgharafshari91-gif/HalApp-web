// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import Providers from "./providers";
import { ToastProvider } from "@/components/ui/toast";

import CookieConsent from "@/components/CookieConsent";
import ConsentSync from "@/components/ConsentSync";
import TrackInit from "@/components/TrackInit";
import ConsentScripts from "@/components/ConsentScripts";

import PushNavigationListener from "@/components/PushNavigationListener";

export const metadata: Metadata = {
  metadataBase: new URL("https://halapp.tr"),
  title: {
    default: "HalApp • Premium Hal & İlan Platformu",
    template: "%s • HalApp",
  },
  description:
    "HalApp ile canlı ilanları takip et, hızlı mesajlaş, premium üyelikle öne çık. Türkiye'nin modern hal & ilan platformu.",
  applicationName: "HalApp",
  keywords: ["HalApp", "hal ilan", "meyve sebze", "toptancı hal", "ilan", "premium", "supabase"],
  openGraph: {
    title: "HalApp • Premium Hal & İlan Platformu",
    description: "Canlı ilanlar, premium vitrin, hızlı iletişim. HalApp ile hal piyasasını cebinde taşı.",
    url: "https://halapp.tr",
    siteName: "HalApp",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HalApp • Premium Hal & İlan Platformu",
    description: "Canlı ilanlar, premium vitrin, hızlı iletişim. HalApp ile hal piyasasını cebinde taşı.",
  },
  icons: {
  icon: [
    { url: "/favicon.ico?v=2" },
    { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
    { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
  ],
  apple: [
    { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
  ],
  shortcut: "/favicon.ico?v=2",
},
};

// ✅ iOS “tam kadraj + safe-area”
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// ✅ hydration farkı olmasın diye yıl client-only
function FooterYear() {
  // Server'da da aynı string basması için sabit render:
  // İstersen direkt "2026" yaz.
  // Burada CSR'da da aynı çıktıyı verir: "©️ 2026"
  return <>{new Date().getFullYear()}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeBoot = `
(function() {
  try {
    var saved = localStorage.getItem("halapp-theme");
    var t = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  } catch(e) {}
})();
`;

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        <meta name="theme-color" content="#16a34a" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0b0f0c" media="(prefers-color-scheme: dark)" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>

      <body
        className={[
          // ✅ KÖKTE X TAŞMA KAPAT (iOS dahil)
          "min-h-dvh w-full max-w-full overflow-x-clip",
          "antialiased selection:bg-emerald-500/30 selection:text-white",
          "bg-white text-zinc-950 dark:bg-black dark:text-white",
        ].join(" ")}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <Providers>
          <ToastProvider>
            {/* Background glow */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              {/* DARK */}
              <div className="hidden dark:block">
                <div className="absolute left-[-200px] top-[-260px] h-[520px] w-[520px] rounded-full bg-emerald-500/18 blur-3xl" />
                <div className="absolute right-[-240px] top-[120px] h-[560px] w-[560px] rounded-full bg-emerald-400/14 blur-3xl" />
                <div className="absolute left-[10%] bottom-[-320px] h-[680px] w-[680px] rounded-full bg-emerald-600/12 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(34,197,94,.08),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(52,211,153,.06),transparent_60%)]" />
              </div>

              {/* LIGHT */}
              <div className="block dark:hidden">
                <div className="absolute left-[-220px] top-[-300px] h-[560px] w-[560px] rounded-full bg-emerald-500/12 blur-3xl" />
                <div className="absolute right-[-260px] top-[60px] h-[620px] w-[620px] rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute left-[10%] bottom-[-360px] h-[720px] w-[720px] rounded-full bg-emerald-600/8 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.10),transparent_52%),radial-gradient(circle_at_80%_40%,rgba(34,197,94,.08),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(52,211,153,.06),transparent_62%)]" />
              </div>
            </div>

            <TrackInit />
            <ConsentSync />
            <ConsentScripts />
            <PushNavigationListener />

            {/* ✅ Navbar zaten sticky */}
            <Navbar />

            {/* ✅ CONTENT WRAPPER: taşma kilidi burada da var */}
            <main className="relative mx-auto w-full min-w-0 max-w-6xl px-4 pb-16 pt-6 overflow-x-clip">
              {children}
            </main>

            <footer className="w-full max-w-full border-t border-black/10 bg-white/50 dark:border-white/10 dark:bg-black/30 overflow-x-clip">
              <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-10 text-sm text-black/60 dark:text-white/60">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-semibold text-black/80 dark:text-white/80">HalApp</div>
                  <div className="shrink-0">
                    ©️ <FooterYear /> HalApp • Tüm hakları saklıdır.
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <a
                    href="/privacy"
                    className="font-extrabold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
                  >
                    KVKK & Çerez Politikası
                  </a>
                  <a
                    href="/terms"
                    className="font-extrabold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
                  >
                    Kullanım Koşulları
                  </a>
                </div>
              </div>
            </footer>

            <CookieConsent />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}