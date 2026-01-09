import { NextResponse } from "next/server";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeStatus(v: any): "open" | "closed" {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "open") return "open";
  return "closed";
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/support");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const status = normalizeStatus(body.status ?? "closed");
  const resolution = body.resolution == null ? null : String(body.resolution).trim() || null;

  const sb = await adminServerClient();

  const { data: beforeRow, error: bErr } = await sb
    .from("support_tickets")
    .select("id,user_id,status,subject,message,body,contact,resolution,closed_at,closed_by,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (bErr) return json({ error: bErr.message }, 400);
  if (!beforeRow) return json({ error: "not_found" }, 404);

  const now = new Date().toISOString();

  const patch =
    status === "closed"
      ? {
          status: "closed",
          closed_at: now,
          closed_by: gate.uid,
          resolution: resolution ?? beforeRow.resolution ?? null,
          updated_at: now,
        }
      : {
          status: "open",
          closed_at: null,
          closed_by: null,
          resolution: null,
          updated_at: now,
        };

  const { data: afterRow, error: uErr } = await sb
    .from("support_tickets")
    .update(patch)
    .eq("id", id)
    .select("id,user_id,status,subject,message,body,contact,resolution,closed_at,closed_by,created_at,updated_at")
    .maybeSingle();

  if (uErr) return json({ error: uErr.message }, 400);
  if (!afterRow) return json({ error: "update_failed" }, 400);

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: afterRow.user_id ?? null,
    action: status === "closed" ? "support.close" : "support.reopen",
    summary:
      status === "closed"
        ? `Support kapatıldı: ${id}${resolution ? ` • ${resolution}` : ""}`
        : `Support yeniden açıldı: ${id}`,
    before: beforeRow,
    after: afterRow,
  });

  return json({ ok: true, ticket: afterRow }, 200);
}