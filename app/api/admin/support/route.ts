// app/api/admin/support/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toInt(v: string | null, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function normStatus(v: string) {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "open" || s === "closed") return s;
  if (s === "all" || s === "") return "";
  return null;
}

/**
 * GET /api/admin/support
 * Query:
 *  - q: subject/message/body/contact/user_id içinde arar
 *  - status: open|closed|all
 *  - page: 1..
 *  - limit: default 25 max 100
 */
export async function GET(req: Request) {
  const gate = await requireAdminOrRedirect("/admin/support");
  if (!gate.ok) return json({ error: gate.reason ?? "not_allowed" }, 403);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const statusRaw = url.searchParams.get("status") ?? "open";
  const status = normStatus(statusRaw);
  if (status === null) return json({ error: "invalid_status" }, 400);

  const page = toInt(url.searchParams.get("page"), 1);
  const limit = Math.min(100, Math.max(1, toInt(url.searchParams.get("limit"), 25)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sb = await adminServerClient();

  let qb = sb
    .from("support_tickets")
    .select(
      `
      id,user_id,status,subject,message,body,contact,resolution,closed_at,closed_by,created_at,updated_at,
      profiles:profiles(id,full_name,company_name,phone,email)
    `,
      { count: "exact" }
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
.order("created_at", { ascending: false })

  if (status) qb = qb.eq("status", status);

  if (q) {
    const esc = q.replace(/,/g, " ");
    qb = qb.or(
      [
        `subject.ilike.%${esc}%`,
        `message.ilike.%${esc}%`,
        `body.ilike.%${esc}%`,
        `contact.ilike.%${esc}%`,
        `user_id::text.ilike.%${esc}%`,
      ].join(",")
    );
  }

  const { data, error, count } = await qb.range(from, to);
  if (error) return json({ error: error.message }, 400);

  return json({
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}