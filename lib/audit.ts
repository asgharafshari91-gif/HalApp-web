// lib/audit.ts
import "server-only";

export type AuditPayload = {
  actor_id: string;
  target_user_id: string | null; // senin mevcut kodların bunu kullanıyor, aynen bırakıyoruz
  action: string;
  summary?: string | null;
  before?: any | null;
  after?: any | null;
};

function firstIp(xff: string | null) {
  if (!xff) return null;
  // "client, proxy1, proxy2" -> client
  const first = xff.split(",")[0]?.trim();
  return first || null;
}

export function getRequestIp(req: Request) {
  const h = req.headers;
  return firstIp(h.get("x-forwarded-for")) || h.get("x-real-ip") || null;
}

function safeStr(v: any, max = 500) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function safeAction(v: any) {
  const s = safeStr(v, 120);
  return s || "unknown";
}

/**
 * ✅ Admin audit log insert helper
 * - req: Request (ip/user-agent almak için)
 * - sb: server supabase client
 * - payload: audit alanları
 *
 * Not: audit insert hata verirse ana işlemi patlatmaz (safe).
 */
export async function auditLog(req: Request, sb: any, payload: AuditPayload) {
  try {
    if (!sb?.from) return;

    // actor_id/action zorunlu (boş gelirse audit'i atla)
    const actor_id = safeStr(payload.actor_id, 80);
    const action = safeAction(payload.action);
    if (!actor_id) return;

    const ip = getRequestIp(req);
    const ua = safeStr(req.headers.get("user-agent"), 500);

    const row = {
      actor_id,
      target_user_id: payload.target_user_id ?? null,
      action,
      summary: safeStr(payload.summary, 500),
      before: payload.before ?? null,
      after: payload.after ?? null,
      request_ip: ip,
      user_agent: ua,
    };

    // insert hata verirse ana işi bozma
    const { error } = await sb.from("admin_audit_log").insert(row);
    if (error) {
      // console.error("auditLog insert failed:", error.message);
    }
  } catch {
    // noop
  }
}