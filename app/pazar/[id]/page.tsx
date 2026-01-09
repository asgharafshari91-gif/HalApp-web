// app/pazar/[id]/page.tsx
import { redirect } from "next/navigation";
import PazarDetailClient from "./ui/pazar-detail-client";

export const dynamic = "force-dynamic";

function safeId(v: any) {
  return String(v ?? "").trim();
}

export default function PazarDetailPage({ params }: { params: { id: string } }) {
  const id = safeId(params?.id);
  if (!id) redirect("/pazar");

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-black">🧺 İlan Detayı</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Ürün • fiyat • satıcı • görseller
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
              Premium
            </span>

            <a
              href="/pazar"
              className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              ← Pazar
            </a>
          </div>
        </div>
      </div>

      <PazarDetailClient id={id} />
    </div>
  );
}