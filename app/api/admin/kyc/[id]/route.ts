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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminOrRedirect("/admin/kyc");

  if (!gate.ok) {
    return json({ error: gate.reason ?? "not_allowed" }, 403);
  }

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data, error } = await sb
    .from("profiles")
    .select(
      `
      id,
      full_name,
      company_name,
      phone,
      email,
      account_type,
      user_role,
      role,
      city,
      district,
      avatar_url,
      kyc_status,
      verified,
      kyc_submitted_at,
      kyc_approved_at,
      kyc_rejected_at,
      kyc_last_updated,
      kyc_comment,
      kyc_note,
      kyc_id_front_url,
      kyc_id_back_url,
      kyc_selfie_url,
      id_card_front_url,
      id_card_back_url,
      selfie_url,
      kyc_trade_registry_url,
      kyc_tax_plate_url,
      kyc_activity_cert_url,
      kyc_signature_circ_url
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "not_found" }, 404);

  return json({ kyc: data }, 200);
}

/**
 * PATCH /api/admin/kyc/:id
 * Body:
 *  - status?: pending|approved|rejected
 *  - reject_reason?: string|null
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminOrRedirect("/admin/kyc");

  if (!gate.ok) {
    return json({ error: gate.reason ?? "not_allowed" }, 403);
  }

  const { id } = await ctx.params;
  const sb = await adminServerClient();
  const body = await req.json().catch(() => ({}));

  const nextStatus = body.status !== undefined ? normStatus(body.status) : null;

  if (body.status !== undefined && !nextStatus) {
    return json({ error: "invalid_status" }, 400);
  }

  const rejectReason =
    body.reject_reason !== undefined ? normText(body.reject_reason) : null;

  const { data: beforeRow, error: be } = await sb
    .from("profiles")
    .select("id,kyc_status,verified")
    .eq("id", id)
    .maybeSingle();

  if (be) return json({ error: be.message }, 400);
  if (!beforeRow) return json({ error: "not_found" }, 404);

  const now = new Date().toISOString();

  const patch: Record<string, any> = {
    kyc_last_updated: now,
    kyc_reviewed_by: gate.uid,
  };

  if (nextStatus === "approved") {
    patch.kyc_status = "approved";
    patch.verified = true;
    patch.kyc_approved_at = now;
    patch.kyc_rejected_at = null;
    patch.kyc_comment = null;
  }

  if (nextStatus === "rejected") {
    patch.kyc_status = "rejected";
    patch.verified = false;
    patch.kyc_rejected_at = now;
    patch.kyc_approved_at = null;
    patch.kyc_comment = rejectReason || "KYC belgeleri uygun bulunmadı.";
  }

  if (nextStatus === "pending") {
    patch.kyc_status = "pending";
    patch.verified = false;
    patch.kyc_approved_at = null;
    patch.kyc_rejected_at = null;
    patch.kyc_comment = null;
  }

  if (!nextStatus) {
    return json({ error: "no_fields" }, 400);
  }

  const { data: afterRow, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select(
      `
      id,
      full_name,
      company_name,
      phone,
      email,
      account_type,
      user_role,
      role,
      city,
      district,
      avatar_url,
      kyc_status,
      verified,
      kyc_submitted_at,
      kyc_approved_at,
      kyc_rejected_at,
      kyc_last_updated,
      kyc_comment,
      kyc_note,
      kyc_id_front_url,
      kyc_id_back_url,
      kyc_selfie_url,
      id_card_front_url,
      id_card_back_url,
      selfie_url,
      kyc_trade_registry_url,
      kyc_tax_plate_url,
      kyc_activity_cert_url,
      kyc_signature_circ_url
    `
    )
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!afterRow) return json({ error: "update_failed" }, 400);

  return json({ ok: true, kyc: afterRow }, 200);
}