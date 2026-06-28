// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin";
import AdminShell from "./ui/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = await requireAdminOrRedirect("/admin");
  if (!gate.ok) redirect(gate.redirectTo);

  return <AdminShell>{children}</AdminShell>;
}