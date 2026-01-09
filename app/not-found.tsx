// app/not-found.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black">404</div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">
          Aradığın sayfa bulunamadı.
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
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
            Pazar
          </Link>
        </div>
      </div>
    </div>
  );
}