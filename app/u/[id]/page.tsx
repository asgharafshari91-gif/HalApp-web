// app/u/[id]/page.tsx
import { redirect } from "next/navigation";
import UserPublicShell from "./ui/user-public-shell";

export const dynamic = "force-dynamic"; // ✅ kalsın

function safeId(v: unknown) {
  return String(v ?? "").trim();
}

export default function Page({ params }: { params: { id: string } }) {
  const id = safeId(params?.id);

  if (!id) redirect("/"); // ya da /u

  // ✅ Artık SSR kapatma burada yok -> build hatası biter
  return <UserPublicShell id={id} />;
}