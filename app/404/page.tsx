// app/404/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import ParamsClient from "./ui/params-client";

export const dynamic = "force-dynamic";

export default function Page404() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black tracking-tight text-black/90 dark:text-white/90">
          Sayfa bulunamadı
        </div>

        <div className="mt-2 text-sm text-black/60 dark:text-white/60">
          Aradığın sayfa silinmiş olabilir veya link yanlış.
        </div>

        {/* ✅ useSearchParams burada değil, client child içinde.
            ✅ child Suspense ile sarıldı -> build hatası biter */}
        <Suspense fallback={null}>
          <ParamsClient />
        </Suspense>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            Ana sayfa
          </Link>

          <Link
            href="/pazar"
            className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-black/5 transition dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10"
          >
            Pazar
          </Link>

          <Link
            href="/auth"
            className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-black/5 transition dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10"
          >
            Giriş
          </Link>
        </div>
      </div>
    </div>
  );
}