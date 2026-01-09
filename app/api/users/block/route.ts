// app/api/users/block/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeId(v: any) {
  return String(v ?? "").trim();
}

const TABLE = "user_blocks"; // <-- sende farklıysa değiştir

export async function POST(req: NextRequest) {
  const sb = await supabaseRouteClient();

  // auth
  const { data: auth, error: aErr } = await sb.auth.getUser();
  if (aErr) return json({ error: aErr.message }, 401);
  const user = auth?.user;
  if (!user) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const blocked_id = safeId(body?.user_id);

  if (!blocked_id) return json({ error: "missing_user_id" }, 400);
  if (blocked_id === user.id) return json({ error: "cannot_block_self" }, 400);

  // hedef user var mı?
  const { data: target, error: e0 } = await sb
    .from("profiles")
    .select("id")
    .eq("id", blocked_id)
    .maybeSingle();

  if (e0) return json({ error: e0.message }, 400);
  if (!target) return json({ error: "user_not_found" }, 404);

  // zaten engelli mi?
  const { data: ex, error: e1 } = await sb
    .from(TABLE)
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", blocked_id)
    .maybeSingle();

  if (e1) return json({ error: e1.message }, 400);

  if (ex) {
    // zaten engelli -> idempotent
    return json({ ok: true, blocked: true }, 200);
  }

  const { error: e2 } = await sb.from(TABLE).insert({
    blocker_id: user.id,
    blocked_id,
  });

  if (e2) return json({ error: e2.message }, 400);

  return json({ ok: true, blocked: true }, 200);
}