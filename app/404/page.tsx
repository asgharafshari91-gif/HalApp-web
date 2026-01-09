// app/404/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Page404() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black tracking-tight">404 — Sayfa bulunamadı</div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">
          Bu URL sistemde yok. Menüden devam edebilirsin.
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            Ana sayfa
          </Link>
          <Link
            href="/pazar"
            className="rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] transition"
          >
            Pazar
          </Link>
        </div>
      </div>
    </div>
  );
}