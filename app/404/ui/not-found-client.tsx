// app/404/ui/not-found-client.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const sp = useSearchParams();
  const next = sp.get("next");

  return (
    <div className="mx-auto max-w-lg space-y-3 rounded-[22px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xl font-black">404 – Sayfa bulunamadı</div>
      <div className="text-sm text-black/60 dark:text-white/60">
        Aradığın sayfa yok. {next ? `İpucu: next=${next}` : ""}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400"
        >
          Ana sayfa
        </Link>
        <Link
          href="/pazar"
          className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          Pazara git
        </Link>
      </div>
    </div>
  );
}