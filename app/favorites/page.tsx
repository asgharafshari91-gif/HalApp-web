import { Suspense } from "react";
import FavoritesClient from "./ui/favorites-client";

export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl p-4">
          <div className="rounded-[22px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            Yükleniyor…
          </div>
        </div>
      }
    >
      <FavoritesClient />
    </Suspense>
  );
}