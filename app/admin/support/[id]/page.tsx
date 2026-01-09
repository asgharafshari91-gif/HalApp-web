// app/admin/support/[id]/page.tsx
import { redirect } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin";
import SupportDetailClient from "./ui/support-detail-client";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function buildBaseUrl() {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "http://localhost:3000";

  const withProto = base.startsWith("http") ? base : `https://${base}`;
  return withProto.replace(/\/$/, "");
}

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const g = await requireAdminOrRedirect("/admin/support");
  if (!g.ok) redirect(g.redirectTo);

  const { id } = await params;

  // ✅ cookie header'ını doğru şekilde al
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const base = buildBaseUrl();
  const url = `${base}/api/admin/support/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });

  const j = await res.json().catch(() => ({}));

  if (!res.ok) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🎫 Support Ticket</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          API Hatası: {j?.error ?? "ticket_fetch_failed"}
        </div>
      </div>
    );
  }

  return <SupportDetailClient initialTicket={j.ticket} />;
}