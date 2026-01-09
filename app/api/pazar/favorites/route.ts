// app/api/pazar/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeId(v: any) {
  return String(v ?? "").trim();
}

const TABLE = "listing_favorites"; // <-- sende farklıysa burayı değiştir

/**
 * GET /api/pazar/favorites
 * -> { ids: string[] }
 */
export async function GET(req: NextRequest) {
  const sb = await supabaseRouteClient();

  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  const { data, error } = await sb
    .from(TABLE)
    .select("listing_id")
    .eq("user_id", user.id);

  if (error) return json({ error: error.message }, 400);

  const ids = (data ?? [])
    .map((x: any) => safeId(x?.listing_id))
    .filter(Boolean);

  return json({ ids });
}

/**
 * POST /api/pazar/favorites
 * Body: { listing_id: string }
 * -> { favorited: boolean }
 */
export async function POST(req: NextRequest) {
  const sb = await supabaseRouteClient();

  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const listing_id = safeId(body?.listing_id);
  if (!listing_id) return json({ error: "missing_listing_id" }, 400);

  // var mı?
  const { data: existing, error: e1 } = await sb
    .from(TABLE)
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listing_id)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);

  if (existing) {
    // delete
    const { error: e2 } = await sb
      .from(TABLE)
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listing_id);

    if (e2) return json({ error: e2.message }, 400);

    return json({ favorited: false });
  }

  // insert
  const { error: e3 } = await sb.from(TABLE).insert({
    user_id: user.id,
    listing_id,
  });

  if (e3) return json({ error: e3.message }, 400);

  return json({ favorited: true });
}