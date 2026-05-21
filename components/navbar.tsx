"use client";

import React, { useEffect, useState } from "react";
import HalAppLogo from "./halapp-logo";

type NavItem = {
  label: string;
  href: string;
};

const items: NavItem[] = [
  {
    label: "Özellikler",
    href: "#features",
  },
  {
    label: "Canlı İlanlar",
    href: "#live",
  },
  {
    label: "Fiyat",
    href: "#pricing",
  },
];

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

export default function Navbar() {
  const [scrolled, setScrolled] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(
        window.scrollY > 8
      );
    };

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      mobileOpen
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-10 pointer-events-none w-full">
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div
            className={clsx(
              "pointer-events-auto",
              "relative overflow-hidden rounded-[28px]",
              "border transition-all duration-300",
              "px-4 py-3 sm:px-5",
              "backdrop-blur-2xl",
              scrolled
                ? "border-white/10 bg-black/60 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
                : "border-white/10 bg-black/35"
            )}
          >
            {/* PREMIUM GLOW */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[-80px] top-[-80px] h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

              <div className="absolute right-[-80px] top-[-60px] h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.18),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,.10),transparent_35%)]" />
            </div>

            {/* CONTENT */}
            <div className="relative flex items-center justify-between gap-3">
              {/* LOGO */}
              <a
                href="/"
                className="group flex shrink-0 items-center gap-3"
              >
                <HalAppLogo />

                <div className="hidden sm:block">
                  <div className="text-sm font-black tracking-wide text-white">
                    HalApp
                  </div>

                  <div className="text-[11px] font-semibold text-white/50">
                    Premium Hal Platformu
                  </div>
                </div>
              </a>

              {/* DESKTOP NAV */}
              <nav className="hidden items-center gap-1 lg:flex">
                {items.map((it) => (
                  <a
                    key={it.href}
                    href={it.href}
                    className={clsx(
                      "rounded-2xl px-4 py-2",
                      "text-sm font-bold",
                      "text-white/70",
                      "transition",
                      "hover:bg-white/5",
                      "hover:text-white"
                    )}
                  >
                    {it.label}
                  </a>
                ))}
              </nav>

              {/* RIGHT */}
              <div className="flex items-center gap-2">
                {/* LIVE BADGE */}
                <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

                  <span className="text-[11px] font-black uppercase tracking-wide text-emerald-200">
                    CANLI
                  </span>
                </div>

                {/* AUTH */}
                <a
                  href="/auth"
                  className={clsx(
                    "hidden sm:inline-flex",
                    "items-center justify-center",
                    "rounded-2xl",
                    "border border-white/10",
                    "bg-white/[0.04]",
                    "px-4 py-2.5",
                    "text-sm font-bold",
                    "text-white/80",
                    "transition",
                    "hover:bg-white/10",
                    "hover:text-white"
                  )}
                >
                  Web’e Gir
                </a>

                {/* PREMIUM */}
                <a
                  href="#pricing"
                  className={clsx(
                    "inline-flex items-center justify-center",
                    "rounded-2xl bg-emerald-500",
                    "px-4 py-2.5",
                    "text-sm font-black text-black",
                    "transition",
                    "hover:scale-[1.02]",
                    "hover:bg-emerald-400",
                    "shadow-[0_20px_60px_rgba(34,197,94,.25)]"
                  )}
                >
                  Premium Başla
                </a>

                {/* MOBILE BTN */}
                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(
                      (s) => !s
                    )
                  }
                  className={clsx(
                    "inline-flex h-11 w-11",
                    "items-center justify-center",
                    "rounded-2xl",
                    "border border-white/10",
                    "bg-white/[0.04]",
                    "text-white",
                    "transition",
                    "hover:bg-white/10",
                    "lg:hidden"
                  )}
                >
                  <div className="space-y-1">
                    <div className="h-[2px] w-5 rounded-full bg-white" />

                    <div className="h-[2px] w-5 rounded-full bg-white" />

                    <div className="h-[2px] w-5 rounded-full bg-white" />
                  </div>
                </button>
              </div>
            </div>

            {/* MOBILE MENU */}
            <div
              className={clsx(
                "grid transition-all duration-300 lg:hidden",
                mobileOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="relative mt-4 border-t border-white/10 pt-4">
                  <nav className="flex flex-col gap-2">
                    {items.map((it) => (
                      <a
                        key={it.href}
                        href={it.href}
                        onClick={() =>
                          setMobileOpen(
                            false
                          )
                        }
                        className={clsx(
                          "rounded-2xl border border-white/5",
                          "bg-white/[0.03]",
                          "px-4 py-3",
                          "text-sm font-bold text-white/80",
                          "transition",
                          "hover:bg-white/10",
                          "hover:text-white"
                        )}
                      >
                        {it.label}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <a
                      href="/auth"
                      className={clsx(
                        "inline-flex items-center justify-center",
                        "rounded-2xl border border-white/10",
                        "bg-white/[0.04]",
                        "px-4 py-3",
                        "text-sm font-bold text-white/80",
                        "transition",
                        "hover:bg-white/10",
                        "hover:text-white"
                      )}
                    >
                      Web’e Gir
                    </a>

                    <a
                      href="#pricing"
                      className={clsx(
                        "inline-flex items-center justify-center",
                        "rounded-2xl bg-emerald-500",
                        "px-4 py-3",
                        "text-sm font-black text-black",
                        "transition",
                        "hover:bg-emerald-400"
                      )}
                    >
                      Premium Başla
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}