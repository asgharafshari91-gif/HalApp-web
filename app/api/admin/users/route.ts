// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";
import { auditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function guardAdmin(nextPath = "/admin/users") {
  const g = await requireAdminOrRedirect(nextPath);
  if (!g.ok) return { ok: false as const, res: json({ error: g.reason ?? "not_allowed" }, 403) };
  return { ok: true as const, uid: g.uid };
}

const ALLOWED_FIELDS = [
  "full_name",
  "company_name",
  "avatar_url",
  "is_premium",
  "premium_until",
  "is_admin",
  "banned_until",
  "ban_reason",
  "deleted_at",
  "verified",
] as const;

function pickPatch(body: any) {
  const patch: Record<string, any> = {};
  for (const k of ALLOWED_FIELDS) if (k in body) patch[k] = body[k];
  return patch;
}

function premiumAction(before: any, after: any) {
  const b = Boolean(before?.is_premium);
  const a = Boolean(after?.is_premium);
  if (b === a) return null;
  return a ? ("user.premium.enable" as const) : ("user.premium.disable" as const);
}

function banAction(before: any, after: any) {
  const b = before?.banned_until ? new Date(before.banned_until).getTime() : 0;
  const a = after?.banned_until ? new Date(after.banned_until).getTime() : 0;

  const now = Date.now();
  const bActive = b > now;
  const aActive = a > now;

  if (bActive === aActive) return null;
  return aActive ? ("user.ban" as const) : ("user.unban" as const);
}

/**
 * GET /api/admin/users/:id
 */
export async function GET(_req: Request, ctx: Ctx) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "not_found" }, 404);

  return json({ profile: data }, 200);
}

/**
 * PATCH /api/admin/users/:id
 * Body allowlist -> profiles update
 * Otomatik audit insert ✅
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const body = await req.json().catch(() => ({}));
  const patch = pickPatch(body);

  if (Object.keys(patch).length === 0) {
    return json({ error: "no_fields" }, 400);
  }

  // BEFORE snapshot
  const { data: beforeRow } = await sb
    .from("profiles")
    .select("id,is_admin,is_premium,premium_until,banned_until,ban_reason,deleted_at,verified,full_name,company_name,avatar_url")
    .eq("id", id)
    .maybeSingle();

  const { data: afterRow, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id,is_admin,is_premium,premium_until,banned_until,ban_reason,deleted_at,verified,full_name,company_name,avatar_url")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);

  // Action classify
  const a1 = premiumAction(beforeRow, afterRow);
  const a2 = banAction(beforeRow, afterRow);
  const action =
    a2 ??
    a1 ??
    (patch.deleted_at ? ("user.soft_delete" as const) : ("user.update" as const));

  const summary =
    action === "user.ban"
      ? `Kullanıcı banlandı (${afterRow?.banned_until ?? "-"})`
      : action === "user.unban"
      ? "Kullanıcı ban kaldırıldı"
      : action === "user.premium.enable"
      ? "Premium açıldı"
      : action === "user.premium.disable"
      ? "Premium kapatıldı"
      : action === "user.soft_delete"
      ? "Soft delete uygulandı"
      : "Kullanıcı güncellendi";

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: id,
    action,
    summary,
    before: beforeRow ?? null,
    after: afterRow ?? null,
  });

  return json({ profile: afterRow }, 200);
}

/**
 * DELETE /api/admin/users/:id
 * Soft delete (deleted_at) + audit ✅
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data: beforeRow } = await sb
    .from("profiles")
    .select("id,deleted_at")
    .eq("id", id)
    .maybeSingle();

  const { data: afterRow, error } = await sb
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,deleted_at")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: id,
    action: "user.soft_delete",
    summary: "Soft delete uygulandı",
    before: beforeRow ?? null,
    after: afterRow ?? null,
  });

  return json({ ok: true, result: afterRow }, 200);
}