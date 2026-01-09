"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { MeProvider } from "@/lib/me";

type Theme = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function getInitialTheme(): Theme {
  // 1) localStorage
  try {
    const saved = localStorage.getItem("halapp-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}

  // 2) system
  if (typeof window !== "undefined") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  }
  return "dark";
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const t = getInitialTheme();
    setThemeState(t);
    applyThemeClass(t);
  }, []);

  // System theme change (only if user didn't set manually)
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }

    const onChange = () => {
      try {
        const saved = localStorage.getItem("halapp-theme");
        if (saved === "light" || saved === "dark") return; // user override
      } catch {}
      const t: Theme = mq!.matches ? "dark" : "light";
      setThemeState(t);
      applyThemeClass(t);
    };

    mq.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyThemeClass(t);
    try {
      localStorage.setItem("halapp-theme", t);
    } catch {}
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {/* ✅ useToast hatasını kesin çözer */}
      <ToastProvider>
        {/* ✅ giriş + profile global */}
        <MeProvider>{children}</MeProvider>
      </ToastProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within Providers");
  return ctx;
}