// app/api/pazar/[id]/manage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeId(v: any) {
  return String(v ?? "").trim();
}

const ALLOWED_FIELDS = [
  "title",
  "description",
  "price",
  "price_per_unit",
  "unit",
  "quantity",
  "min_quantity",
  "is_active",
  "is_boosted",
  "expires_at",
  "city",
  "district",
  "neighborhood",
  "market_name",
  "product_name",
  "product_type",
  "post_type",
] as const;

function pickPatch(body: any) {
  const patch: Record<string, any> = {};
  for (const k of ALLOWED_FIELDS) if (k in (body ?? {})) patch[k] = (body as any)[k];
  return patch;
}

/**
 * PATCH /api/pazar/:id/manage
 * (Sadece allowlist alanları update eder)
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id: rawId } = await ctx.params;
  const id = safeId(rawId);
  if (!id) return json({ error: "missing_id" }, 400);

  const body = await req.json().catch(() => ({}));
  const patch = pickPatch(body);

  if (Object.keys(patch).length === 0) {
    return json({ error: "no_fields" }, 400);
  }

  const sb = await supabaseRouteClient();

  // TODO: burada “ilan sahibi mi?” kontrolü istersen ekleriz
  const { data, error } = await sb
    .from("listings")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "not_found" }, 404);

  return json({ item: data }, 200);
}