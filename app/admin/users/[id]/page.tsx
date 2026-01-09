// app/admin/users/[id]/page.tsx
import { redirect } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin";
import UserClient from "./ui/user-client";

export const dynamic = "force-dynamic";

function safeId(v: any) {
  return String(v ?? "").trim();
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = safeId(rawId);

  if (!id) redirect("/admin/users");

  const gate = await requireAdminOrRedirect(`/admin/users/${encodeURIComponent(id)}`);
  if (!gate.ok) redirect(gate.redirectTo);

  return <UserClient id={id} />;
}