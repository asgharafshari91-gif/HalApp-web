import { Suspense } from "react";
import TermsClient from "./ui/terms-client";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            Yükleniyor…
          </div>
        </div>
      }
    >
      <TermsClient />
    </Suspense>
  );
}