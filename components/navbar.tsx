"use client";

import React, { useEffect, useState } from "react";
import HalAppLogo from "./halapp-logo";

type NavItem = { label: string; href: string };

const items: NavItem[] = [
  { label: "Özellikler", href: "#features" },
  { label: "Canlı ilanlar", href: "#live" },
  { label: "Fiyat", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={[
          "mx-auto w-full max-w-6xl px-4 sm:px-6",
          "pt-3",
        ].join(" ")}
      >
        <div
          className={[
            "relative flex items-center justify-between gap-3",
            "rounded-2xl border",
            "px-4 py-3 sm:px-5",
            "backdrop-blur-xl",
            scrolled
              ? "bg-black/55 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,.35)]"
              : "bg-black/30 border-white/10",
          ].join(" ")}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,.12),transparent_45%)]" />

          <a href="#top" className="relative flex items-center gap-3">
            <HalAppLogo />
          </a>

          <nav className="relative hidden md:flex items-center gap-1">
            {items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
              >
                {it.label}
              </a>
            ))}
          </nav>

          <div className="relative flex items-center gap-2">
            <a
              href="#web"
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Web’e Gir
            </a>

            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 transition shadow-[0_18px_50px_rgba(34,197,94,.18)]"
            >
              Premium Başla
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}