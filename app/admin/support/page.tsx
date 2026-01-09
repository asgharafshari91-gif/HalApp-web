// app/admin/support/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdminOrRedirect } from "@/lib/admin";
import SupportClient from "../ui/support-client";

export const dynamic = "force-dynamic";

function toInt(v: string | undefined, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

async function getBaseUrlFromHeaders() {
  const h = await headers(); // ✅ Next 16: headers() -> Promise

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; limit?: string }>;
}) {
  const g = await requireAdminOrRedirect("/admin/support");
  if (!g.ok) redirect(g.redirectTo);

  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "open").trim(); // open|closed|all
  const page = Math.max(1, toInt(sp.page, 1));

  const limit = Math.min(100, Math.max(1, toInt(sp.limit, 25)));
  const offset = (page - 1) * limit;

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  const baseUrl = await getBaseUrlFromHeaders();

  // ✅ Cookie forward: not_authed fix
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/admin/support?${qs.toString()}`, {
    cache: "no-store",
    headers: { cookie }, // ✅ kritik
  });

  const j = await res.json().catch(() => ({}));

  if (!res.ok) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🎫 Destek Talepleri</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          API Hatası: {j?.error ?? "support_fetch_failed"}
        </div>
      </div>
    );
  }

  const items = (j.items ?? []) as any[];
  const total = Number(j.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / limit));

  if (page > pages) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (limit !== 25) p.set("limit", String(limit));
    p.set("page", String(pages));
    redirect(`/admin/support?${p.toString()}`);
  }

  return (
    <SupportClient
      initialItems={items}
      q={q}
      status={status}
      page={page}
      pages={pages}
      total={total}
      limit={limit}
    />
  );
}