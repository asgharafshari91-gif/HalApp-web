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

function safeStr(v: any) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function safeNum(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeBool(v: any) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return null;
}

// ✅ sadece bu alanlar güncellenebilir
const ALLOWED_FIELDS = [
  "title",
  "description",
  "product_name",
  "product_type",
  "post_type",
  "city",
  "district",
  "neighborhood",
  "market_name",
  "price",
  "price_per_unit",
  "unit",
  "quantity",
  "min_quantity",
  "is_active",
  "is_boosted",
  "expires_at",
] as const;

type AllowedKey = (typeof ALLOWED_FIELDS)[number];

function buildPatch(body: any) {
  const patch: Record<string, any> = {};

  for (const k of ALLOWED_FIELDS) {
    if (!(k in (body ?? {}))) continue;

    const val = (body as any)[k];

    // alan tipleri
    if (
      k === "price" ||
      k === "price_per_unit" ||
      k === "quantity" ||
      k === "min_quantity"
    ) {
      patch[k] = safeNum(val);
      continue;
    }

    if (k === "is_active" || k === "is_boosted") {
      const b = safeBool(val);
      // null ise ignore (yanlış data)
      if (b !== null) patch[k] = b;
      continue;
    }

    if (k === "expires_at") {
      const s = safeStr(val);
      // ISO format bekliyoruz; boş gelirse null yapabilir
      patch[k] = s;
      continue;
    }

    // string alanlar
    patch[k] = safeStr(val);
  }

  // undefined sil (garanti)
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) delete patch[key];
  }

  return patch as Partial<Record<AllowedKey, any>>;
}

async function isAdmin(sb: any, userId: string) {
  // profiles içinde admin flag varsayımı
  const { data, error } = await sb
    .from("profiles")
    .select("id,is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.is_admin);
}

/**
 * PATCH /api/pazar/:id/manage
 * Body -> allowlist patch
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const listingId = safeId(id);

  if (!listingId) return json({ error: "missing_id" }, 400);

  const sb = await supabaseRouteClient();

  // ✅ auth
  const { data: auth, error: aErr } = await sb.auth.getUser();
  if (aErr) return json({ error: aErr.message }, 401);
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  // ✅ ilan var mı / sahibi kim
  const { data: row, error: e0 } = await sb
    .from("listings")
    .select("id,seller_id,deleted_at")
    .eq("id", listingId)
    .maybeSingle();

  if (e0) return json({ error: e0.message }, 400);
  if (!row || row.deleted_at) return json({ error: "not_found" }, 404);

  const ownerId = row.seller_id ? String(row.seller_id) : null;

  // ✅ owner veya admin
  const meIsAdmin = await isAdmin(sb, user.id);
  const isOwner = ownerId && ownerId === user.id;

  if (!isOwner && !meIsAdmin) {
    return json({ error: "not_allowed" }, 403);
  }

  // ✅ patch
  const body = await req.json().catch(() => ({}));
  const patch = buildPatch(body);

  if (!patch || Object.keys(patch).length === 0) {
    return json({ error: "no_fields" }, 400);
  }

  // ✅ update
  const { data: updated, error: e1 } = await sb
    .from("listings")
    .update(patch)
    .eq("id", listingId)
    .select(
      `
      id,
      title,
      description,
      product_name,
      product_type,
      post_type,
      city,
      district,
      neighborhood,
      market_name,
      price,
      price_per_unit,
      unit,
      quantity,
      min_quantity,
      is_active,
      is_boosted,
      expires_at,
      created_at,
      seller_id
    `
    )
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);

  return json({ ok: true, item: updated }, 200);
}