// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function guardAdmin(nextPath = "/admin/users") {
  const g = await requireAdminOrRedirect(nextPath);
  if (!g.ok) return { ok: false as const, res: json({ error: g.reason ?? "not_allowed" }, 403) };
  return { ok: true as const, uid: g.uid };
}

/**
 * GET /api/admin/users
 * Query:
 *  - q (optional): isim / şirket / public_id araması
 *  - page (optional): 1..n
 *  - pageSize (optional): 10..100
 */
export async function GET(req: NextRequest) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const sb = await adminServerClient();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? "20") || 20;
  const pageSize = Math.min(100, Math.max(10, pageSizeRaw));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from("profiles")
    .select(
      `
      id,
      full_name,
      company_name,
      public_id,
      avatar_url,
      is_premium,
      premium_until,
      is_admin,
      verified,
      is_banned,
      banned_until,
      ban_reason,
      created_at,
      updated_at
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    // basit arama: full_name/company_name/public_id
    // supabase "or" ile ilike
    const like = `%${q.replace(/%/g, "")}%`;
    query = query.or(
      `full_name.ilike.${like},company_name.ilike.${like},public_id.ilike.${like}`
    );
  }

  const { data, error, count } = await query;
  if (error) return json({ error: error.message }, 400);

  return json(
    {
      items: data ?? [],
      page,
      pageSize,
      total: count ?? (data?.length ?? 0),
    },
    200
  );
}

/**
 * POST /api/admin/users
 * (Opsiyonel) Admin panelden manuel kullanıcı oluşturmak istersen diye.
 * Sen istemiyorsan silebilirsin.
 */
export async function POST(req: NextRequest) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const sb = await adminServerClient();
  const body = await req.json().catch(() => ({}));

  // minimum alanlar (istersen genişlet)
  const id = String(body?.id ?? "").trim();
  if (!id) return json({ error: "id_required" }, 400);

  const patch: any = {
    id,
    full_name: body?.full_name ?? null,
    company_name: body?.company_name ?? null,
    public_id: body?.public_id ?? null,
    account_type: body?.account_type ?? "standard",
    is_premium: Boolean(body?.is_premium ?? false),
    is_admin: Boolean(body?.is_admin ?? false),
  };

  const { data, error } = await sb.from("profiles").upsert(patch).select("*").maybeSingle();
  if (error) return json({ error: error.message }, 400);

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: id,
    action: "user.create",
    summary: "Kullanıcı admin tarafından oluşturuldu / upsert edildi",
    before: null,
    after: data ?? null,
  });

  return json({ profile: data }, 201);
}