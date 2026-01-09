// app/api/admin/audit/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toInt(v: string | null, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export async function GET(req: Request) {
  const gate = await requireAdminOrRedirect("/admin/audit");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const action = (url.searchParams.get("action") ?? "").trim();
  const actor = (url.searchParams.get("actor") ?? "").trim();
  const target = (url.searchParams.get("target") ?? "").trim();

  const page = toInt(url.searchParams.get("page"), 1);
  const limitRaw = toInt(url.searchParams.get("limit"), 25);
  const limit = Math.min(100, Math.max(1, limitRaw));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sb = await adminServerClient();

  let qb = sb
    .from("admin_audit_log")
    .select("id,created_at,actor_id,target_user_id,action,summary,before,after,request_ip,user_agent", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (action) qb = qb.eq("action", action);
  if (actor) qb = qb.eq("actor_id", actor);
  if (target) qb = qb.eq("target_user_id", target);

  if (q) {
    const esc = q.replace(/,/g, " ");
    qb = qb.or(`action.ilike.%${esc}%,summary.ilike.%${esc}%`);
  }

  const { data, error, count } = await qb.range(from, to);
  if (error) return json({ error: error.message }, 400);

  return json({ items: data ?? [], total: count ?? 0, page, limit });
}