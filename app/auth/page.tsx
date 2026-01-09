// app/auth/page.tsx
import { Suspense } from "react";
import AuthClient from "./ui/auth-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-5 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
            Yükleniyor…
          </div>
        </div>
      }
    >
      <AuthClient />
    </Suspense>
  );
}