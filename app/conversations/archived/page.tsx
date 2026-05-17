import { Suspense } from "react";
import ArchivedClient from "./ui/archived-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        Yükleniyor…
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ArchivedClient />
    </Suspense>
  );
}