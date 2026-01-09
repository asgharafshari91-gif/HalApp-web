// app/api/admin/users/[id]/ban/route.ts
import { NextResponse } from "next/server";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import { writeAudit } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/users");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  // body:
  // { action: "ban", days: 7, reason?: string }
  // { action: "unban" }
  const action = (body.action ?? "").toString();
  const days = Number(body.days ?? 0);
  const reason = (body.reason ?? "").toString().trim() || null;

  const sb = await adminServerClient();

  const { data: beforeRow, error: bErr } = await sb
    .from("profiles")
    .select("id, banned_until, ban_reason, full_name, company_name")
    .eq("id", id)
    .single();
  if (bErr) return json({ error: bErr.message }, 400);

  let patch: any = {};
  let auditAction = "";
  let summary = "";

  if (action === "unban") {
    patch = { banned_until: null, ban_reason: null };
    auditAction = "user.unban";
    summary = `${id} unban`;
  } else {
    const until = body.until ? new Date(body.until).toISOString() : addDays(Math.max(1, days || 7));
    patch = { banned_until: until, ban_reason: reason };
    auditAction = "user.ban";
    summary = `${id} ban until ${until}${reason ? ` (${reason})` : ""}`;
  }

  const { data: afterRow, error: uErr } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id, banned_until, ban_reason, full_name, company_name")
    .single();

  if (uErr) return json({ error: uErr.message }, 400);

  await writeAudit(req, {
    action: auditAction,
    target_user_id: id,
    summary,
    before: beforeRow,
    after: afterRow,
  });

  return json({ ok: true, user: afterRow });
}