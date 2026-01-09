// app/api/admin/support/[id]/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normStatus(v: any): "open" | "closed" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "open" || s === "closed") return s;
  return null;
}

function normText(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/support");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data, error } = await sb
    .from("support_tickets")
    .select(
      `
      id,user_id,subject,message,body,contact,status,resolution,closed_at,closed_by,created_at,updated_at,
      profiles:profiles(id,full_name,company_name,phone,email)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "not_found" }, 404);

  return json({ ticket: data });
}

/**
 * PATCH /api/admin/support/:id
 * Body:
 *  - status?: "open"|"closed"
 *  - resolution?: string|null
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/support");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const body = await req.json().catch(() => ({}));

  const nextStatus = body.status !== undefined ? normStatus(body.status) : null;
  if (body.status !== undefined && !nextStatus) return json({ error: "invalid_status" }, 400);

  const nextResolution = body.resolution !== undefined ? normText(body.resolution) : undefined;

  const { data: beforeRow, error: be } = await sb.from("support_tickets").select("*").eq("id", id).maybeSingle();
  if (be) return json({ error: be.message }, 400);
  if (!beforeRow) return json({ error: "not_found" }, 404);

  const patch: Record<string, any> = {};
  const now = new Date().toISOString();

  if (nextResolution !== undefined) patch.resolution = nextResolution;

  if (nextStatus) {
    patch.status = nextStatus;
    if (nextStatus === "closed") {
      patch.closed_at = now;
      patch.closed_by = gate.uid;
    } else {
      patch.closed_at = null;
      patch.closed_by = null;
    }
  }

  if (Object.keys(patch).length === 0) return json({ error: "no_fields" }, 400);

  patch.updated_at = now;

  const { data: afterRow, error } = await sb
    .from("support_tickets")
    .update(patch)
    .eq("id", id)
    .select(
      "id,user_id,subject,message,body,contact,status,resolution,closed_at,closed_by,created_at,updated_at"
    )
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!afterRow) return json({ error: "update_failed" }, 400);

  const beforeStatus = String(beforeRow.status ?? "").toLowerCase();
  const afterStatus = String(afterRow.status ?? "").toLowerCase();

  let action = "support.update";
  if (beforeStatus !== afterStatus) action = afterStatus === "closed" ? "support.close" : "support.reopen";
  else if (nextResolution !== undefined) action = "support.resolution.update";

  const summary =
    action === "support.close"
      ? `Support kapatıldı (#${id})`
      : action === "support.reopen"
      ? `Support yeniden açıldı (#${id})`
      : action === "support.resolution.update"
      ? `Support çözüm güncellendi (#${id})`
      : `Support güncellendi (#${id})`;

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: afterRow.user_id ?? null,
    action,
    summary,
    before: beforeRow,
    after: afterRow,
  });

  return json({ ok: true, ticket: afterRow });
}