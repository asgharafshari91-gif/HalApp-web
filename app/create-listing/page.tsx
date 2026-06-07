import { Suspense } from "react";
import CreateListingClient from "./CreateListingClient";

export const dynamic = "force-dynamic";

export default function CreateListingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-50 p-10 text-center text-sm font-black text-zinc-500 dark:bg-black dark:text-white/50">
          İlan oluşturma sayfası yükleniyor...
        </main>
      }
    >
      <CreateListingClient />
    </Suspense>
  );
}