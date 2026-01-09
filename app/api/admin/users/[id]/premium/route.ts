// app/api/admin/users/[id]/premium/route.ts
import { NextResponse } from "next/server";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import { writeAudit } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/users");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const enabled = !!body.enabled;

  const sb = await adminServerClient();

  // BEFORE snapshot
  const { data: beforeRow, error: bErr } = await sb
    .from("profiles")
    .select("id, is_premium, full_name, company_name")
    .eq("id", id)
    .single();
  if (bErr) return json({ error: bErr.message }, 400);

  // UPDATE
  const { data: afterRow, error: uErr } = await sb
    .from("profiles")
    .update({ is_premium: enabled })
    .eq("id", id)
    .select("id, is_premium, full_name, company_name")
    .single();

  if (uErr) return json({ error: uErr.message }, 400);

  // AUDIT
  await writeAudit(req, {
    action: enabled ? "user.premium.enable" : "user.premium.disable",
    target_user_id: id,
    summary: `${id} premium => ${enabled}`,
    before: beforeRow,
    after: afterRow,
  });

  return json({ ok: true, user: afterRow });
}