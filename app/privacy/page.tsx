// app/privacy/page.tsx
import { Suspense } from "react";
import PrivacyClient from "./ui/privacy-client";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            Yükleniyor…
          </div>
        </div>
      }
    >
      <PrivacyClient />
    </Suspense>
  );
}