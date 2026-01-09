"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const sp = useSearchParams();
  const from = sp.get("from"); // kullanıyorsan

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black tracking-tight">
          Sayfa bulunamadı
        </div>

        <div className="mt-2 text-sm text-black/60 dark:text-white/60">
          Aradığın sayfa bulunamadı veya taşınmış olabilir.
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}