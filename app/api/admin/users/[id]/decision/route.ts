// app/api/admin/kyc/[id]/decision/route.ts
import { NextResponse } from "next/server";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import { writeAudit } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const decision = (body.decision ?? "").toString(); // "approved" | "rejected"
  const note = (body.note ?? "").toString().trim() || null;

  if (decision !== "approved" && decision !== "rejected") {
    return json({ error: "invalid_decision" }, 400);
  }

  const sb = await adminServerClient();

  // BEFORE
  const { data: beforeRow, error: bErr } = await sb
    .from("kyc_requests")
    .select("id, user_id, status, note, created_at")
    .eq("id", id)
    .single();
  if (bErr) return json({ error: bErr.message }, 400);

  // UPDATE
  const { data: afterRow, error: uErr } = await sb
    .from("kyc_requests")
    .update({ status: decision, note })
    .eq("id", id)
    .select("id, user_id, status, note, created_at")
    .single();

  if (uErr) return json({ error: uErr.message }, 400);

  // AUDIT
  await writeAudit(req, {
    action: decision === "approved" ? "kyc.approve" : "kyc.reject",
    target_user_id: afterRow.user_id,
    summary: `kyc ${id} => ${decision}${note ? ` (${note})` : ""}`,
    before: beforeRow,
    after: afterRow,
  });

  return json({ ok: true, kyc: afterRow });
}