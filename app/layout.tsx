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

const SITE_URL = "https://halapp.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "HalApp | Dijital Toptancı Hali",
    template: "%s | HalApp",
  },

  description:
    "HalApp, Türkiye'nin dijital toptancı hali platformudur. Meyve, sebze ve tarım ürünleri için ilan, alım-satım, premium vitrin ve pazar istihbaratı sunar.",

  applicationName: "HalApp",

  generator: "Next.js",

  category: "business",

  keywords: [
    "HalApp",
    "dijital toptancı hali",
    "toptancı hali",
    "hal ilan",
    "halapp.app",
    "meyve sebze",
    "tarım ürünleri",
    "meyve ilanları",
    "sebze ilanları",
    "tarım pazarı",
    "premium ilan",
    "vitrin ilan",
    "market intelligence",
    "pazar istihbaratı",
    "limon",
    "kayısı",
    "avokado",
    "kuşkonmaz",
    "domates",
    "biber",
    "kiraz",
    "üzüm",
  ],

  authors: [
    {
      name: "HalApp",
      url: SITE_URL,
    },
  ],

  creator: "HalApp",
  publisher: "HalApp",

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "HalApp | Dijital Toptancı Hali",
    description:
      "Meyve, sebze ve tarım ürünleri için dijital toptancı hal platformu. Canlı ilanlar, premium vitrin, hızlı iletişim ve pazar istihbaratı.",
    url: SITE_URL,
    siteName: "HalApp",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HalApp Dijital Toptancı Hali",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "HalApp | Dijital Toptancı Hali",
    description:
      "Türkiye'nin dijital toptancı hali. Meyve, sebze ve tarım ürünleri alım-satım platformu.",
    images: ["/og-image.png"],
  },

  appleWebApp: {
    capable: true,
    title: "HalApp",
    statusBarStyle: "black-translucent",
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico?v=100",
        sizes: "any",
      },
      {
        url: "/favicon-32x32.png?v=100",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png?v=100",
        sizes: "16x16",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png?v=100",
        sizes: "180x180",
        type: "image/png",
      },
    ],

    shortcut: ["/favicon.ico?v=100"],
  },

  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#16a34a",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0b0f0c",
    },
  ],
};

function FooterYear() {
  return <>{new Date().getFullYear()}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeBoot = `
(function() {
  try {
    var saved = localStorage.getItem("halapp-theme");

    var t =
      saved === "light" || saved === "dark"
        ? saved
        : (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
          )
          ? "dark"
          : "light";

    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch(e) {}
})();
`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HalApp",
    url: SITE_URL,
    description:
      "Türkiye'nin dijital toptancı hali. Meyve, sebze ve tarım ürünleri için ilan, alım-satım ve pazar istihbaratı platformu.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/listings?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HalApp",
    url: SITE_URL,
    logo: `${SITE_URL}/halapp-logo.png`,
    sameAs: [SITE_URL],
  };

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <meta
          name="theme-color"
          content="#16a34a"
          media="(prefers-color-scheme: light)"
        />

        <meta
          name="theme-color"
          content="#0b0f0c"
          media="(prefers-color-scheme: dark)"
        />

        <meta name="apple-mobile-web-app-capable" content="yes" />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="format-detection" content="telephone=no" />

        <script
          dangerouslySetInnerHTML={{
            __html: themeBoot,
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationLd),
          }}
        />
      </head>

      <body
        className={[
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
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="hidden dark:block">
                <div className="absolute left-[-200px] top-[-260px] h-[520px] w-[520px] rounded-full bg-emerald-500/18 blur-3xl" />

                <div className="absolute right-[-240px] top-[120px] h-[560px] w-[560px] rounded-full bg-emerald-400/14 blur-3xl" />

                <div className="absolute left-[10%] bottom-[-320px] h-[680px] w-[680px] rounded-full bg-emerald-600/12 blur-3xl" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(34,197,94,.08),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(52,211,153,.06),transparent_60%)]" />
              </div>

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

            <Navbar />

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