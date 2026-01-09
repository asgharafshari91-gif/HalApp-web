"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "halapp-theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement; // <html>
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  // Mobil adres bar rengi gibi his: light/dark değişebilir
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0b0f10" : "#f6f7f8");
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1) storage varsa onu al
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;

    // 2) yoksa sistem temasını al
    const initial: Theme = saved ?? getSystemTheme();

    setTheme(initial);
    applyTheme(initial);
    setMounted(true);

    // 3) kullanıcı seçmediyse, sistem değişimini takip et
    // (saved yoksa: sistem değişince theme de değişsin)
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const onChange = () => {
      const stillNoChoice = !localStorage.getItem(STORAGE_KEY);
      if (!stillNoChoice) return;
      const t = mq.matches ? "dark" : "light";
      setTheme(t);
      applyTheme(t);
    };

    // Safari uyumlu
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Hydration glitch olmasın diye mounted bekliyoruz
  if (!mounted) {
    return (
      <div className="inline-flex h-10 w-20 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] text-xs font-bold text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        …
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2",
        "border border-black/10 bg-black/[0.03] text-black/80 hover:bg-black/[0.06]",
        "dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.08]",
        "transition",
      ].join(" ")}
      aria-label="Tema değiştir"
      title={isDark ? "Gündüz moduna geç" : "Gece moduna geç"}
    >
      {/* icon */}
      {isDark ? (
        // Moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 14.5A8.5 8.5 0 0 1 9.5 3a6.8 6.8 0 1 0 11.5 11.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // Sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}

      <span className="text-sm font-extrabold">
        {isDark ? "Gece" : "Gündüz"}
      </span>
    </button>
  );
}