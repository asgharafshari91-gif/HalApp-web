import { NextResponse, type NextRequest } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeId(v: unknown) {
  return String(v ?? "").trim();
}

/**
 * PATCH /api/pazar/:id/manage
 * Body: { is_active: boolean }
 * - login zorunlu
 * - ilan sahibi zorunlu
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = safeId(ctx?.params?.id);
  if (!id) return json({ error: "missing_id" }, 400);

  const sb = await supabaseRouteClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const is_active = Boolean(body?.is_active);

  // ilan var mı + sahibi mi?
  const { data: row, error: e1 } = await sb
    .from("listings")
    .select("id,seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);
  if (!row) return json({ error: "not_found" }, 404);
  if (row.seller_id !== user.id)
    return json({ error: "not_owner" }, 403);

  const { error: e2 } = await sb
    .from("listings")
    .update({ is_active })
    .eq("id", id);

  if (e2) return json({ error: e2.message }, 400);

  return json({ ok: true, is_active });
}