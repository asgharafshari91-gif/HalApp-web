// app/404/page.tsx
import { Suspense } from "react";
import NotFoundClient from "./ui/not-found-client";

export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
          Yükleniyor…
        </div>
      }
    >
      <NotFoundClient />
    </Suspense>
  );
}