// app/page.tsx
import { Suspense } from "react";
import HomeClient from "./ui/home-client";

export const dynamic = "force-dynamic";

function LoadingScreen() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/80 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 animate-pulse space-y-6">
        {/* badge */}
        <div className="h-8 w-40 rounded-full bg-black/5 dark:bg-white/10" />

        {/* title */}
        <div className="space-y-3">
          <div className="h-12 w-full max-w-2xl rounded-2xl bg-black/10 dark:bg-white/10" />
          <div className="h-12 w-full max-w-xl rounded-2xl bg-emerald-500/20" />
        </div>

        {/* desc */}
        <div className="space-y-2">
          <div className="h-4 w-full max-w-3xl rounded-xl bg-black/5 dark:bg-white/10" />
          <div className="h-4 w-full max-w-2xl rounded-xl bg-black/5 dark:bg-white/10" />
        </div>

        {/* buttons */}
        <div className="flex gap-3 pt-2">
          <div className="h-14 w-44 rounded-2xl bg-emerald-500/20" />
          <div className="h-14 w-40 rounded-2xl bg-black/5 dark:bg-white/10" />
        </div>

        {/* cards */}
        <div className="grid gap-4 pt-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[28px] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20" />
              <div className="mt-4 h-5 w-32 rounded-xl bg-black/10 dark:bg-white/10" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded-xl bg-black/5 dark:bg-white/10" />
                <div className="h-3 w-5/6 rounded-xl bg-black/5 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative mx-auto w-full max-w-7xl space-y-6">
      {/* top ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[5%] top-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[0%] top-[120px] h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <Suspense fallback={<LoadingScreen />}>
        <HomeClient />
      </Suspense>
    </div>
  );
}