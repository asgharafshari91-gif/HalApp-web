import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normStatus(v: any): "pending" | "approved" | "rejected" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "pending" || s === "approved" || s === "rejected") return s;
  return null;
}

function normText(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

async function fetchProfile(sb: any, userId: string | null) {
  if (!userId) return null;
  const { data: p } = await sb
    .from("profiles")
    .select("id,full_name,company_name,phone,email")
    .eq("id", userId)
    .maybeSingle();
  return p ?? null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data, error } = await sb.from("kyc_requests").select("*").eq("id", id).maybeSingle();
  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "not_found" }, 404);

  const profile = await fetchProfile(sb, data.user_id ?? null);
  return json({ kyc: { ...data, profiles: profile } }, 200);
}

/**
 * PATCH /api/admin/kyc/:id
 * Body:
 *  - status?: pending|approved|rejected
 *  - reject_reason?: string|null
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const sb = await adminServerClient();
  const body = await req.json().catch(() => ({}));

  const nextStatus = body.status !== undefined ? normStatus(body.status) : null;
  if (body.status !== undefined && !nextStatus) return json({ error: "invalid_status" }, 400);

  const nextReason = body.reject_reason !== undefined ? normText(body.reject_reason) : undefined;

  const { data: beforeRow, error: be } = await sb.from("kyc_requests").select("*").eq("id", id).maybeSingle();
  if (be) return json({ error: be.message }, 400);
  if (!beforeRow) return json({ error: "not_found" }, 404);

  const patch: Record<string, any> = {};
  const now = new Date().toISOString();

  if (nextReason !== undefined) patch.reject_reason = nextReason;

  if (nextStatus) {
    patch.status = nextStatus;
    patch.reviewed_at = now;
    patch.reviewed_by = gate.uid;
  }

  if (Object.keys(patch).length === 0) return json({ error: "no_fields" }, 400);

  patch.updated_at = now;

  const { data: afterRow, error } = await sb.from("kyc_requests").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) return json({ error: error.message }, 400);
  if (!afterRow) return json({ error: "update_failed" }, 400);

  const profile = await fetchProfile(sb, afterRow.user_id ?? null);
  return json({ ok: true, kyc: { ...afterRow, profiles: profile } }, 200);
}