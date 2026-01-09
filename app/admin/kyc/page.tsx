import { redirect } from "next/navigation";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import KycClient from "@/app/admin/ui/kyc-client";

export const dynamic = "force-dynamic";

function toInt(v: any, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

function escLike(s: string) {
  return String(s ?? "").replace(/[%_]/g, "\\$&");
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function AdminKycPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) redirect(gate.redirectTo);

  const sp = (await searchParams) ?? {};
  const q = String((sp.q as any) ?? "").trim();
  const status = String((sp.status as any) ?? "pending").trim().toLowerCase();
  const limit = Math.min(100, Math.max(1, toInt(sp.limit, 25)));
  const page = Math.max(1, toInt(sp.page, 1));
  const offset = (page - 1) * limit;

  const sb = await adminServerClient();

  // base query
  let qb = sb
    .from("kyc_requests")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (status !== "all") qb = qb.eq("status", status);

  // search (server-side, safe)
  if (q) {
    if (isUuid(q)) {
      qb = qb.or(`id.eq.${q},user_id.eq.${q}`);
    } else {
      const qq = escLike(q);
      const { data: profs, error: pe } = await sb
        .from("profiles")
        .select("id")
        .or(`full_name.ilike.%${qq}%,company_name.ilike.%${qq}%,email.ilike.%${qq}%,phone.ilike.%${qq}%`);

      if (pe) {
        return (
          <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-lg font-black">🪪 KYC Talepleri</div>
            <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">API Hatası: {pe.message}</div>
          </div>
        );
      }

      const ids = (profs ?? []).map((p: any) => p.id).filter(Boolean);
      if (ids.length === 0) {
        return (
          <KycClient
            initialItems={[]}
            q={q}
            status={status}
            page={page}
            pages={1}
            total={0}
            limit={limit}
          />
        );
      }

      qb = qb.in("user_id", ids);
    }
  }

  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await qb.range(from, to);

  if (error) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🪪 KYC Talepleri</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">API Hatası: {error.message}</div>
      </div>
    );
  }

  // merge profiles
  const userIds = [...new Set((data ?? []).map((x: any) => x.user_id).filter(Boolean))];
  const map: Record<string, any> = {};

  if (userIds.length) {
    const { data: проф, error: pe2 } = await sb
      .from("profiles")
      .select("id,full_name,company_name,phone,email")
      .in("id", userIds);

    if (pe2) {
      return (
        <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-lg font-black">🪪 KYC Talepleri</div>
          <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">API Hatası: {pe2.message}</div>
        </div>
      );
    }

    for (const p of проф ?? []) map[p.id] = p;
  }

  const items = (data ?? []).map((x: any) => ({
    ...x,
    profiles: x.user_id ? map[x.user_id] ?? null : null,
  }));

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  // clamp page
  if (page > pages && pages > 0) {
    const p2 = new URLSearchParams();
    if (q) p2.set("q", q);
    if (status) p2.set("status", status);
    if (limit !== 25) p2.set("limit", String(limit));
    p2.set("page", String(pages));
    redirect(`/admin/kyc?${p2.toString()}`);
  }

  return (
    <KycClient
      initialItems={items as any}
      q={q}
      status={status}
      page={page}
      pages={pages}
      total={total}
      limit={limit}
    />
  );
}