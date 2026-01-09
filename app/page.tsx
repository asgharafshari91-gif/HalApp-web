// app/page.tsx
import { Suspense } from "react";
import HomeClient from "./ui/home-client";

export const dynamic = "force-dynamic"; // ✅ ana sayfayı static export zorlamasından kurtarır

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Suspense
        fallback={
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            Yükleniyor…
          </div>
        }
      >
        <HomeClient />
      </Suspense>
    </div>
  );
}