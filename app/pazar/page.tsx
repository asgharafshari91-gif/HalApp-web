// app/pazar/page.tsx
import Link from "next/link";
import PazarClient from "./ui/pazar-client";

export const dynamic = "force-dynamic";

export default function PazarPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // ✅ NOT: Server Component içinde onClick + redirect() çalışmaz.
  // redirect() sadece server tarafında koşar; butonla yönlendirme için Link kullan.
  const admin = typeof searchParams?.admin === "string" && searchParams.admin === "1";

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">🧺 Pazar</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              HalApp’in kalbi • hızlı filtre • şık kartlar • net sonuç
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
              Premium UI
            </span>

            {admin ? (
              <Link
                href="/admin"
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
              >
                Admin →
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <PazarClient />
    </div>
  );
}