// app/api/auth/qr-complete/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serviceRoleClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normToken(v: any) {
  const s = String(v ?? "").trim();
  return /^[a-f0-9]{64}$/i.test(s) ? s : null;
}

async function webClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          for (const item of items) {
            cookieStore.set(item.name, item.value, item.options);
          }
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = normToken(body.token);

    if (!token) return json({ error: "invalid_token" }, 400);

    const admin = serviceRoleClient();

    const { data: sessionRow, error } = await admin
      .from("web_qr_login_sessions")
      .select(
        "id,token,status,user_id,expires_at,approved_at,used_at,access_token,refresh_token"
      )
      .eq("token", token)
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!sessionRow) return json({ error: "qr_session_not_found" }, 404);

    if (sessionRow.status === "used") {
      return json({ ok: true, already_used: true });
    }

    if (sessionRow.status !== "approved") {
      return json({ error: "qr_not_approved", status: sessionRow.status }, 400);
    }

    if (!sessionRow.user_id) return json({ error: "missing_user_id" }, 400);
    if (sessionRow.used_at) return json({ error: "qr_already_used" }, 400);

    const expiresAt = sessionRow.expires_at
      ? new Date(sessionRow.expires_at).getTime()
      : 0;

    if (!expiresAt || expiresAt < Date.now()) {
      await admin
        .from("web_qr_login_sessions")
        .update({ status: "expired" })
        .eq("token", token);

      return json({ error: "qr_expired" }, 400);
    }

    const accessToken = String(sessionRow.access_token ?? "");
    const refreshToken = String(sessionRow.refresh_token ?? "");

    if (!accessToken || !refreshToken) {
      return json({ error: "missing_session_tokens" }, 400);
    }

    const sb = await webClient();

    const { data: authData, error: sessionError } = await sb.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      return json({ error: sessionError.message }, 400);
    }

    const userId = authData.session?.user?.id;

    if (!userId) return json({ error: "web_session_failed" }, 400);

    if (userId !== sessionRow.user_id) {
      return json({ error: "user_mismatch" }, 400);
    }

    const now = new Date().toISOString();

    await admin
      .from("web_qr_login_sessions")
      .update({
        status: "used",
        used_at: now,
        access_token: null,
        refresh_token: null,
      })
      .eq("token", token);

    return json({ ok: true, user_id: userId });
  } catch (e: any) {
    return json({ error: e?.message ?? "server_error" }, 500);
  }
}