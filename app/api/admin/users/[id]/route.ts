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

const ALLOWED = [
  "full_name",
  "company_name",
  "avatar_url",
  "is_premium",
  "premium_until",
  "is_admin",
  "banned_until",
  "ban_reason",
  "verified",
  "deleted_at",
] as const;

function pickPatch(body: any) {
  const patch: Record<string, any> = {};
  for (const k of ALLOWED) if (k in body) patch[k] = body[k];
  return patch;
}

function isActiveBan(ts: any) {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function detectAction(before: any, after: any, patchKeys: string[]) {
  // BAN
  const bBan = isActiveBan(before?.banned_until);
  const aBan = isActiveBan(after?.banned_until);
  if (bBan !== aBan) return aBan ? "user.ban" : "user.unban";

  // PREMIUM
  const bPr = Boolean(before?.is_premium);
  const aPr = Boolean(after?.is_premium);
  if (bPr !== aPr) return aPr ? "user.premium.enable" : "user.premium.disable";

  // ADMIN ROLE
  if (patchKeys.includes("is_admin")) return "user.role.update";

  // VERIFIED
  if (patchKeys.includes("verified")) return "user.verify.update";

  // SOFT DELETE
  if (patchKeys.includes("deleted_at")) return "user.soft_delete";

  return "user.update";
}

function summaryFor(action: string, before: any, after: any, patchKeys: string[]) {
  if (action === "user.ban") return `Kullanıcı banlandı (until: ${after?.banned_until ?? "-"})`;
  if (action === "user.unban") return "Kullanıcı ban kaldırıldı";
  if (action === "user.premium.enable") return "Premium açıldı";
  if (action === "user.premium.disable") return "Premium kapatıldı";
  if (action === "user.role.update") return `Rol güncellendi (is_admin: ${Boolean(after?.is_admin)})`;
  if (action === "user.verify.update") return `Verified güncellendi (verified: ${Boolean(after?.verified)})`;
  if (action === "user.soft_delete") return "Soft delete (deleted_at set)";
  return `Updated: ${patchKeys.join(", ")}`;
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

  return json({ profile: data });
}

/**
 * PATCH /api/admin/users/:id
 * + audit
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const body = await req.json().catch(() => ({}));
  const patch = pickPatch(body);
  const keys = Object.keys(patch);

  if (keys.length === 0) return json({ error: "no_fields" }, 400);

  const { data: before, error: be } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  if (be) return json({ error: be.message }, 400);
  if (!before) return json({ error: "not_found" }, 404);

  const { data: after, error } = await sb.from("profiles").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) return json({ error: error.message }, 400);

  const action = detectAction(before, after, keys);
  const summary = summaryFor(action, before, after, keys);

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: id,
    action,
    summary,
    before,
    after,
  });

  return json({ profile: after });
}

/**
 * DELETE /api/admin/users/:id
 * soft delete + audit
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const gate = await guardAdmin("/admin/users");
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data: before } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();

  const { data: after, error } = await sb
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: id,
    action: "user.soft_delete",
    summary: "Soft delete (deleted_at set)",
    before: before ?? null,
    after: after ?? null,
  });

  return json({ ok: true, profile: after });
}