import { Suspense } from "react";
import DeleteClient from "./ui/delete-client";

export const dynamic = "force-dynamic";

export default function DeletePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl p-6">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            Yükleniyor…
          </div>
        </div>
      }
    >
      <DeleteClient />
    </Suspense>
  );
}