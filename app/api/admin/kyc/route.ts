import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toInt(v: string | null, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function escLike(s: string) {
  // ilike içinde % ve _ kaçış
  return s.replace(/[%_]/g, "\\$&");
}

/**
 * GET /api/admin/kyc?q=&status=pending|approved|rejected|all&limit=25&offset=0
 */
export async function GET(req: Request) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const url = new URL(req.url);
  const qRaw = (url.searchParams.get("q") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "pending").trim().toLowerCase();

  const limit = Math.min(100, Math.max(1, toInt(url.searchParams.get("limit"), 25)));
  const offset = Math.max(0, toInt(url.searchParams.get("offset"), 0));
  const from = offset;
  const to = offset + limit - 1;

  const sb = await adminServerClient();

  let qb = sb
    .from("kyc_requests")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (status && status !== "all") qb = qb.eq("status", status);

  // ✅ ARAMA
  if (qRaw) {
    if (isUuid(qRaw)) {
      // UUID → exact
      qb = qb.or(`id.eq.${qRaw},user_id.eq.${qRaw}`);
    } else {
      // Text → profiles’ta ara, sonra kyc_requests user_id in (...)
      const q = escLike(qRaw);

      const { data: profs, error: pe } = await sb
        .from("profiles")
        .select("id")
        .or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

      if (pe) return json({ error: pe.message }, 400);

      const ids = (profs ?? []).map((p: any) => p.id).filter(Boolean);
      if (ids.length === 0) return json({ items: [], total: 0, limit, offset });

      qb = qb.in("user_id", ids);
    }
  }

  const { data, error, count } = await qb.range(from, to);
  if (error) return json({ error: error.message }, 400);

  // ✅ profiles’ı server-side merge (relationship cache derdi yok)
  const userIds = [...new Set((data ?? []).map((x: any) => x.user_id).filter(Boolean))];
  const map: Record<string, any> = {};

  if (userIds.length) {
    const { data: проф, error: pe2 } = await sb
      .from("profiles")
      .select("id,full_name,company_name,phone,email")
      .in("id", userIds);

    if (pe2) return json({ error: pe2.message }, 400);

    for (const p of проф ?? []) map[p.id] = p;
  }

  const items = (data ?? []).map((x: any) => ({
    ...x,
    profiles: x.user_id ? map[x.user_id] ?? null : null,
  }));

  return json({ items, total: count ?? 0, limit, offset });
}