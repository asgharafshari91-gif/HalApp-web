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

function normalizeKycRow(row: any) {
  if (!row) return null;

  return {
    ...row,

    user_id: row.id,
    status: row.kyc_status ?? "none",

    submitted_at: row.kyc_submitted_at ?? null,
    reviewed_at: row.kyc_approved_at ?? row.kyc_rejected_at ?? null,
    reject_reason: row.kyc_comment ?? null,

    id_front_path: row.kyc_id_front_url ?? row.id_card_front_url ?? null,
    id_back_path: row.kyc_id_back_url ?? row.id_card_back_url ?? null,
    selfie_path: row.kyc_selfie_url ?? row.selfie_url ?? null,

    trade_registry_path: row.kyc_trade_registry_url ?? null,
    tax_plate_path: row.kyc_tax_plate_url ?? null,
    activity_cert_path: row.kyc_activity_cert_url ?? null,
    signature_circ_path: row.kyc_signature_circ_url ?? null,

    profiles: {
      id: row.id,
      full_name: row.full_name,
      company_name: row.company_name,
      phone: row.phone,
      email: row.email,
      account_type: row.account_type,
      user_role: row.user_role ?? row.role,
      role: row.role,
      city: row.city,
      district: row.district,
      avatar_url: row.avatar_url,
      kyc_status: row.kyc_status,
      verified: row.verified,
    },
  };
}

const PROFILE_SELECT = `
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
`;

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
    .select(PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return json(
      {
        error: error.message,
        details: error,
      },
      400
    );
  }

  if (!data) return json({ error: "not_found" }, 404);

  return json({ kyc: normalizeKycRow(data) }, 200);
}

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

  if (!nextStatus) {
    return json({ error: "no_fields" }, 400);
  }

  const rejectReason =
    body.reject_reason !== undefined ? normText(body.reject_reason) : null;

  const { data: beforeRow, error: beforeError } = await sb
    .from("profiles")
    .select("id,kyc_status,verified")
    .eq("id", id)
    .maybeSingle();

  if (beforeError) {
    return json(
      {
        error: beforeError.message,
        details: beforeError,
      },
      400
    );
  }

  if (!beforeRow) return json({ error: "not_found" }, 404);

  const now = new Date().toISOString();

  const patch: Record<string, any> = {
    kyc_last_updated: now,
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

  const { data: afterRow, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    return json(
      {
        error: error.message,
        details: error,
        patch,
      },
      400
    );
  }

  if (!afterRow) {
    return json(
      {
        error: "update_failed",
        patch,
      },
      400
    );
  }

  return json({ ok: true, kyc: normalizeKycRow(afterRow) }, 200);
}