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
  return s.replace(/[%_]/g, "\\$&").replace(/,/g, " ");
}

function normStatus(v: string) {
  const s = String(v || "pending").trim().toLowerCase();
  if (["pending", "approved", "verified", "rejected", "none", "all"].includes(s)) return s;
  return "pending";
}

/**
 * GET /api/admin/kyc?q=&status=pending|approved|verified|rejected|none|all&limit=25&offset=0
 */
export async function GET(req: Request) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const url = new URL(req.url);

  const qRaw = (url.searchParams.get("q") ?? "").trim();
  const status = normStatus(url.searchParams.get("status") ?? "pending");

  const limit = Math.min(100, Math.max(1, toInt(url.searchParams.get("limit"), 25)));
  const offset = Math.max(0, toInt(url.searchParams.get("offset"), 0));

  const from = offset;
  const to = offset + limit - 1;

  const sb = await adminServerClient();

  let qb = sb
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
    `,
      { count: "exact" }
    )
    .not("kyc_status", "is", null)
    .order("kyc_submitted_at", { ascending: false, nullsFirst: false })
    .order("kyc_last_updated", { ascending: false, nullsFirst: false });

  if (status !== "all") {
    if (status === "approved" || status === "verified") {
      qb = qb.or("kyc_status.eq.approved,kyc_status.eq.verified,verified.eq.true");
    } else {
      qb = qb.eq("kyc_status", status);
    }
  } else {
    qb = qb.in("kyc_status", ["pending", "approved", "verified", "rejected", "none"]);
  }

  if (qRaw) {
    if (isUuid(qRaw)) {
      qb = qb.eq("id", qRaw);
    } else {
      const q = escLike(qRaw);

      qb = qb.or(
        [
          `full_name.ilike.%${q}%`,
          `company_name.ilike.%${q}%`,
          `email.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
        ].join(",")
      );
    }
  }

  const { data, error, count } = await qb.range(from, to);

  if (error) return json({ error: error.message }, 400);

  const items = (data ?? []).map((row: any) => ({
    ...row,
    account_type: row.account_type ?? "individual",
    user_role: row.user_role ?? row.role ?? "buyer",

    kyc_id_front_url: row.kyc_id_front_url ?? row.id_card_front_url ?? null,
    kyc_id_back_url: row.kyc_id_back_url ?? row.id_card_back_url ?? null,
    kyc_selfie_url: row.kyc_selfie_url ?? row.selfie_url ?? null,
  }));

  return json({
    items,
    total: count ?? 0,
    limit,
    offset,
  });
}