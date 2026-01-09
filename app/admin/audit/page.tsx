// app/admin/audit/page.tsx
import { redirect } from "next/navigation";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import AuditClient from "../ui/audit-client";

export const dynamic = "force-dynamic";

type SP = Promise<{
  q?: string;
  action?: string;
  actor?: string;
  target?: string;
  page?: string;
  limit?: string;
}>;

function toInt(v: string | undefined, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: SP }) {
  const g = await requireAdminOrRedirect("/admin/audit");
  if (!g.ok) redirect(g.redirectTo);

  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const action = (sp.action ?? "").trim();
  const actor = (sp.actor ?? "").trim();
  const target = (sp.target ?? "").trim();

  const page = toInt(sp.page, 1);
  const limit = Math.min(100, Math.max(1, toInt(sp.limit, 25)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sb = await adminServerClient();

  let qb = sb
    .from("admin_audit_log")
    .select(
      "id,created_at,actor_id,target_user_id,action,summary,before,after,request_ip,user_agent",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (action) qb = qb.eq("action", action);
  if (actor) qb = qb.eq("actor_id", actor);
  if (target) qb = qb.eq("target_user_id", target);

  if (q) {
    const esc = q.replace(/,/g, " ");
    qb = qb.or(`action.ilike.%${esc}%,summary.ilike.%${esc}%`);
  }

  const { data, error, count } = await qb.range(from, to);

  if (error) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 text-sm font-black dark:border-white/10 dark:bg-white/[0.04]">
        Audit sorgu hata: {error.message}
      </div>
    );
  }

  return (
    <AuditClient
      initialItems={(data ?? []) as any}
      total={count ?? 0}
      page={page}
      limit={limit}
    />
  );
}