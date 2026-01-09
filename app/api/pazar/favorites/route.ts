// app/api/pazar/favorites/route.ts
import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeId(v: any) {
  return String(v ?? "").trim();
}

/**
 * GET /api/pazar/favorites
 * -> { ids: string[] }
 */
export async function GET() {
  const sb = await supabaseRouteClient();
  const { data: auth, error: aErr } = await sb.auth.getUser();
  if (aErr) return json({ error: aErr.message }, 400);

  const user = auth?.user;
  if (!user) return json({ ids: [] }, 200);

  const { data, error } = await sb
    .from("listing_favorites")
    .select("listing_id")
    .eq("user_id", user.id);

  if (error) return json({ error: error.message }, 400);

  return json({ ids: (data ?? []).map((x: any) => x.listing_id).filter(Boolean) }, 200);
}

/**
 * POST /api/pazar/favorites
 * Body: { listing_id: string }
 *
 * Toggle:
 *  - varsa siler
 *  - yoksa ekler
 */
export async function POST(req: Request) {
  const sb = await supabaseRouteClient();
  const { data: auth, error: aErr } = await sb.auth.getUser();
  if (aErr) return json({ error: aErr.message }, 400);

  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const listingId = safeId(body?.listing_id);
  if (!listingId) return json({ error: "missing_listing_id" }, 400);

  // ✅ mevcut mu?
  const { data: existing, error: e1 } = await sb
    .from("listing_favorites")
    .select("listing_id")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);

  // ✅ varsa -> sil
  if (existing) {
    const { error: delErr } = await sb
      .from("listing_favorites")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", user.id);

    if (delErr) return json({ error: delErr.message }, 400);

    return json({ ok: true, favorited: false, listing_id: listingId }, 200);
  }

  // ✅ yoksa -> ekle
  const { error: insErr } = await sb.from("listing_favorites").insert({
    listing_id: listingId,
    user_id: user.id,
  });

  if (insErr) return json({ error: insErr.message }, 400);

  return json({ ok: true, favorited: true, listing_id: listingId }, 200);
}