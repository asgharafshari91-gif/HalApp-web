// app/api/admin/audit/[id]/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function guardAdmin() {
  const g = await requireAdminOrRedirect("/admin/audit");
  if (!g.ok) return { ok: false as const, res: json({ error: g.reason ?? "not_allowed" }, 403) };
  return { ok: true as const };
}

/**
 * GET /api/admin/audit/:id
 */
export async function GET(_req: Request, ctx: Ctx) {
  const gate = await guardAdmin();
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  if (!id) return json({ error: "missing_id" }, 400);

  const sb = await adminServerClient();

  const { data, error } = await sb
    .from("admin_audit_log")
    .select(
      `
      id,
      actor_id,
      target_user_id,
      action,
      summary,
      ip,
      user_agent,
      before,
      after,
      meta,
      created_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "not_found" }, 404);

  return json({ item: data }, 200);
}