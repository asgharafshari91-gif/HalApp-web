import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f6f8fb] p-8 text-center text-sm font-black text-zinc-500 dark:bg-[#050816] dark:text-white/50">
          Ödeme sayfası hazırlanıyor...
        </main>
      }
    >
      <PaymentClient />
    </Suspense>
  );
}