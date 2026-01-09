// app/404/ui/page404-client.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function safeNext(raw: string | null) {
  const v = (raw ?? "").trim();
  if (!v) return "/";
  if (v.startsWith("http://") || v.startsWith("https://")) return "/";
  if (v.startsWith("//")) return "/";
  if (!v.startsWith("/")) return "/";
  return v;
}

export default function Page404Client() {
  const sp = useSearchParams();
  const next = useMemo(() => safeNext(sp.get("next")), [sp]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black tracking-tight">404 — Sayfa bulunamadı</div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">
          Aradığın sayfa yok. İstersen geldiğin yere dönebilirsin.
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={next}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            ← Geri dön
          </Link>

          <Link
            href="/"
            className="rounded-2xl bg-black/5 px-5 py-3 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}