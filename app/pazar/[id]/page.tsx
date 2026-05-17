// app/pazar/[id]/page.tsx
import { notFound } from "next/navigation";
import PazarDetailClient from "./ui/pazar-detail-client";

export const dynamic = "force-dynamic";

function safeId(v: any) {
  return String(v ?? "").trim();
}

export default async function PazarDetailPage({
  params,
}: {
  // Next bazı sürümlerde params'ı Promise olarak geçirebiliyor
  params: { id?: string } | Promise<{ id?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = safeId(resolvedParams?.id);

  // ✅ id yoksa Pazar'a redirect yerine 404 (notFound) daha doğru
  // çünkü redirect bazen "detaya tıkla -> pazar" loop'u gibi görünüyor
  if (!id) notFound();

  return <PazarDetailClient id={id} />;
}