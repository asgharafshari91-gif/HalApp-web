import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const id = String(ctx?.params?.id ?? "").trim();
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
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (e2) return json({ error: e2.message }, 400);

  return json({ ok: true });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const id = String(ctx?.params?.id ?? "").trim();
  if (!id) return json({ error: "missing_id" }, 400);

  const sb = await supabaseRouteClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const is_active = typeof body?.is_active === "boolean" ? body.is_active : null;

  if (is_active === null) return json({ error: "missing_is_active" }, 400);

  const { data: row, error: e1 } = await sb
    .from("listings")
    .select("id,seller_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);
  if (!row) return json({ error: "not_found" }, 404);
  if (row.seller_id !== user.id) return json({ error: "not_owner" }, 403);

  const { error: e2 } = await sb.from("listings").update({ is_active }).eq("id", id);
  if (e2) return json({ error: e2.message }, 400);

  return json({ ok: true, is_active });
}