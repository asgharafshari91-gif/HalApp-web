// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

import Providers from "./providers";
import { ToastProvider } from "@/components/ui/toast";

import ConsentSync from "@/components/ConsentSync";
import TrackInit from "@/components/TrackInit";
import ConsentScripts from "@/components/ConsentScripts";
import PushNavigationListener from "@/components/PushNavigationListener";
import RootChrome from "@/components/layout/RootChrome";
import WebSessionGuard from "@/components/WebSessionGuard";

const SITE_URL = "https://halapp.app";
const ICON_VERSION = "20260822";

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
        url: `/favicon.png?v=${ICON_VERSION}`,
        type: "image/png",
        sizes: "any",
      },
      {
        url: `/favicon-32x32.png?v=${ICON_VERSION}`,
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: `/favicon-16x16.png?v=${ICON_VERSION}`,
        type: "image/png",
        sizes: "16x16",
      },
    ],

    shortcut: [
      {
        url: `/favicon.png?v=${ICON_VERSION}`,
        type: "image/png",
      },
    ],

    apple: [
      {
        url: `/apple-touch-icon.png?v=${ICON_VERSION}`,
        type: "image/png",
        sizes: "180x180",
      },
    ],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <link
          rel="icon"
          href={`/favicon.png?v=${ICON_VERSION}`}
          type="image/png"
        />

        <link
          rel="shortcut icon"
          href={`/favicon.png?v=${ICON_VERSION}`}
          type="image/png"
        />

        <link
          rel="apple-touch-icon"
          href={`/apple-touch-icon.png?v=${ICON_VERSION}`}
          sizes="180x180"
        />

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
            <WebSessionGuard />

            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
              <div className="hidden dark:block">
                <div className="absolute left-[-200px] top-[-260px] h-[520px] w-[520px] rounded-full bg-emerald-500/18 blur-3xl" />

                <div className="absolute right-[-240px] top-[120px] h-[560px] w-[560px] rounded-full bg-emerald-400/14 blur-3xl" />

                <div className="absolute bottom-[-320px] left-[10%] h-[680px] w-[680px] rounded-full bg-emerald-600/12 blur-3xl" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(34,197,94,.08),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(52,211,153,.06),transparent_60%)]" />
              </div>

              <div className="block dark:hidden">
                <div className="absolute left-[-220px] top-[-300px] h-[560px] w-[560px] rounded-full bg-emerald-500/12 blur-3xl" />

                <div className="absolute right-[-260px] top-[60px] h-[620px] w-[620px] rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="absolute bottom-[-360px] left-[10%] h-[720px] w-[720px] rounded-full bg-emerald-600/8 blur-3xl" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.10),transparent_52%),radial-gradient(circle_at_80%_40%,rgba(34,197,94,.08),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(52,211,153,.06),transparent_62%)]" />
              </div>
            </div>

            <TrackInit />
            <ConsentSync />
            <ConsentScripts />
            <PushNavigationListener />

            <RootChrome>{children}</RootChrome>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}