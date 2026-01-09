"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastCtx = {
  toast: (t: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

function iconFor(v: ToastVariant) {
  switch (v) {
    case "success":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "error":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M10.3 4.6h3.4L22 19.2H2L10.3 4.6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "warning":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M10.3 4.6h3.4L22 19.2H2L10.3 4.6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 7h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
  }
}

function colors(v: ToastVariant) {
  switch (v) {
    case "success":
      return "text-emerald-700 dark:text-emerald-200 border-emerald-500/25 bg-emerald-500/10";
    case "error":
      return "text-rose-700 dark:text-rose-200 border-rose-500/25 bg-rose-500/10";
    case "warning":
      return "text-amber-800 dark:text-amber-200 border-amber-500/25 bg-amber-500/10";
    default:
      return "text-sky-800 dark:text-sky-200 border-sky-500/25 bg-sky-500/10";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id =
      (globalThis.crypto?.randomUUID?.() as string | undefined) ??
      String(Date.now()) + "-" + String(Math.random()).slice(2);

    const variant: ToastVariant = t.variant ?? "info";
    const durationMs = t.durationMs ?? 2600;

    const item: ToastItem = { id, ...t, variant, durationMs };
    setItems((prev) => [item, ...prev].slice(0, 3));

    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* ✅ iOS taşma fix: 100vw yok. inset ile genişlik */}
      <div
        className={[
          "pointer-events-none fixed top-4 z-[200]",
          "left-4 right-4", // mobilde tam oturur, asla taşımaz
          "sm:left-auto sm:right-4 sm:w-[420px]", // desktop’ta sağda sabit
          "space-y-2",
        ].join(" ")}
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-none relative overflow-hidden rounded-2xl border p-4 shadow-[0_18px_55px_rgba(0,0,0,0.18)]",
              "backdrop-blur-xl",
              "bg-white/80 dark:bg-zinc-950/70",
              colors(t.variant ?? "info"),
              "animate-[toastIn_.22s_ease-out]",
            ].join(" ")}
          >
            <div className="absolute inset-0 opacity-40">
              <div className="absolute -inset-12 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.55),transparent_55%)] dark:bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.18),transparent_55%)]" />
            </div>

            <div className="relative flex gap-3">
              <div className="mt-0.5">{iconFor(t.variant ?? "info")}</div>
              <div className="min-w-0">
                {t.title ? <div className="text-sm font-black tracking-tight">{t.title}</div> : null}
                <div className="mt-0.5 text-sm font-semibold text-black/70 dark:text-white/70">{t.message}</div>
              </div>
            </div>

            <style jsx>{`
              @keyframes toastIn {
                from {
                  opacity: 0;
                  transform: translateY(-8px) scale(0.98);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}</style>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}