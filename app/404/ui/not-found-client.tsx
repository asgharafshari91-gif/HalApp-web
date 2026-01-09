// app/404/ui/not-found-client.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const sp = useSearchParams();
  const from = sp.get("from") || "";
  const q = sp.get("q") || "";

  return (
    <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xl font-semibold">Sayfa bulunamadı</div>

      <div className="mt-2 text-sm text-black/60 dark:text-white/60">
        Aradığın sayfa yok veya taşınmış olabilir.
      </div>

      {(from || q) && (
        <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          {from && (
            <div>
              <span className="font-medium">from:</span> {from}
            </div>
          )}
          {q && (
            <div className="mt-1">
              <span className="font-medium">q:</span> {q}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Anasayfa
        </Link>

        <Link
          href="/pazar"
          className="rounded-xl border border-black/15 px-4 py-2 text-sm font-medium text-black/80 dark:border-white/15 dark:text-white/80"
        >
          Pazara dön
        </Link>
      </div>
    </div>
  );
}