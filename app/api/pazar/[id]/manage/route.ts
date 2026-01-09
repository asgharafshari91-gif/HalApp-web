// app/api/pazar/[id]/manage/route.ts
import { NextRequest, NextResponse } from "next/server";
// ⚠️ Bu import yolu sende farklıysa aynı fonksiyonu nereden alıyorsan onu kullan
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id: rawId } = await ctx.params;
  const id = safeId(rawId);
  if (!id) return json({ error: "missing_id" }, 400);

  const body = await req.json().catch(() => ({}));
  const is_active = Boolean(body?.is_active);

  const sb = await supabaseRouteClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  // ilan benim mi?
  const { data: row, error: e1 } = await sb
    .from("listings")
    .select("id,seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);
  if (!row) return json({ error: "not_found" }, 404);
  if (row.seller_id !== user.id) return json({ error: "not_owner" }, 403);

  const { error: e2 } = await sb
    .from("listings")
    .update({ is_active })
    .eq("id", id);

  if (e2) return json({ error: e2.message }, 400);

  return json({ ok: true, is_active }, 200);
}

/**
 * DELETE /api/pazar/:id/manage
 * Soft delete (deleted_at)
 * - login zorunlu
 * - ilan sahibi zorunlu
 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id: rawId } = await ctx.params;
  const id = safeId(rawId);
  if (!id) return json({ error: "missing_id" }, 400);

  const sb = await supabaseRouteClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  // ilan benim mi?
  const { data: row, error: e1 } = await sb
    .from("listings")
    .select("id,seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);
  if (!row) return json({ error: "not_found" }, 404);
  if (row.seller_id !== user.id) return json({ error: "not_owner" }, 403);

  const { error: e2 } = await sb
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (e2) return json({ error: e2.message }, 400);

  return json({ ok: true }, 200);
}