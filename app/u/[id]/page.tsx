// app/u/[id]/page.tsx
import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic"; // ✅ Next.js özel export, kalsın

function safeId(v: unknown) {
  return String(v ?? "").trim();
}

// ✅ Client component'i dinamik yükle (SSR kapalı)
const UserPublicClient = dynamicImport(() => import("./ui/user-public-client"), {
  ssr: false,
  // (opsiyonel) loading skeleton:
  loading: () => (
    <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
      Yükleniyor…
    </div>
  ),
});

export default function Page({ params }: { params: { id: string } }) {
  const id = safeId(params?.id);

  if (!id) redirect("/"); // ya da /u

  return <UserPublicClient id={id} />;
}