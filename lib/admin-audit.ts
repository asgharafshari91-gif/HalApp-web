// lib/admin-audit.ts
import "server-only";
import { adminServerClient } from "@/lib/admin";

type AuditInput = {
  action: string;
  summary?: string | null;
  target_user_id?: string | null;
  before?: any | null;
  after?: any | null;
  meta?: any | null;
};

function getIP(req: Request) {
  // Vercel/Proxy varsa
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip") ?? null;
}

export async function writeAudit(req: Request, input: AuditInput) {
  const sb = await adminServerClient();

  // actor = şu an login olan admin
  const { data: u } = await sb.auth.getUser();
  const actorId = u?.user?.id;
  if (!actorId) throw new Error("auth_required");

  const request_ip = getIP(req);
  const user_agent = req.headers.get("user-agent");

  const { error } = await sb.from("admin_audit_log").insert({
    actor_id: actorId,
    target_user_id: input.target_user_id ?? null,
    action: input.action,
    summary: input.summary ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    meta: input.meta ?? null,
    request_ip,
    user_agent,
  });

  if (error) throw error;
}