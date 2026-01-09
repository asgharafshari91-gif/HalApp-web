// app/pazar/[id]/edit/page.tsx
import { redirect } from "next/navigation";
import EditListingClient from "./ui/edit-listing-client";

export const dynamic = "force-dynamic";

function safeId(v: unknown) {
  return String(v ?? "").trim();
}

export default function EditPage({ params }: { params: { id: string } }) {
  const id = safeId(params?.id);
  if (!id) redirect("/pazar");

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-black">✏️ İlan Düzenle</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Başlık • fiyat • stok • konum • açıklama
            </div>
          </div>

          <a
            href={`/pazar/${encodeURIComponent(id)}`}
            className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            ← Geri dön
          </a>
        </div>
      </div>

      <EditListingClient id={id} />
    </div>
  );
}