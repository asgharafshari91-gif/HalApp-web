// app/api/pazar/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

const TABLE = "listing_reports"; // <-- sende farklıysa değiştir

const ALLOWED_REASONS = new Set([
  "spam_or_fake",
  "wrong_price_or_info",
  "illegal_or_abuse",
]);

export async function POST(req: NextRequest) {
  const sb = await supabaseRouteClient();

  // auth
  const { data: auth, error: aErr } = await sb.auth.getUser();
  if (aErr) return json({ error: aErr.message }, 401);
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const listing_id = safeStr(body?.listing_id);
  const reason = safeStr(body?.reason);
  const details = safeStr(body?.details ?? "");

  if (!listing_id) return json({ error: "missing_listing_id" }, 400);
  if (!reason || !ALLOWED_REASONS.has(reason)) return json({ error: "invalid_reason" }, 400);

  // ilan var mı? (soft delete değil)
  const { data: exists, error: e0 } = await sb
    .from("listings")
    .select("id")
    .eq("id", listing_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (e0) return json({ error: e0.message }, 400);
  if (!exists) return json({ error: "listing_not_found" }, 404);

  // insert report
  const { error } = await sb.from(TABLE).insert({
    listing_id,
    reporter_id: user.id,
    reason,
    details: details || null,
  });

  if (error) return json({ error: error.message }, 400);

  return json({ ok: true }, 200);
}