// app/api/auth/qr-complete/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
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

function browserFromUserAgent(ua?: string | null) {
  const s = String(ua ?? "").toLowerCase();

  if (s.includes("edg/")) return "Microsoft Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("firefox/")) return "Firefox";
  if (s.includes("chrome/") && !s.includes("edg/")) return "Google Chrome";
  if (s.includes("safari/") && s.includes("version/")) return "Safari";

  return "Web Tarayıcı";
}

function osFromUserAgent(ua?: string | null) {
  const s = String(ua ?? "").toLowerCase();

  if (s.includes("mac os x")) return "macOS";
  if (s.includes("windows")) return "Windows";
  if (s.includes("android")) return "Android";
  if (s.includes("iphone") || s.includes("ipad")) return "iOS";
  if (s.includes("linux")) return "Linux";

  return "Web";
}

function getIp(h: Headers) {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;

  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for") ||
    null
  );
}

async function sendPushNotification({
  userId,
  title,
  body,
  data,
}: {
  userId: string;
  title: string;
  body: string;
  data: Record<string, any>;
}) {
  try {
    const admin = serviceRoleClient();

    await admin.functions.invoke("send-user-notification", {
      body: {
        user_id: userId,
        title,
        body,
        type: "security",
        data,
      },
    });
  } catch (e) {
    console.error("QR PUSH NOTIFICATION ERROR:", e);
  }
}

export async function GET() {
  return json({
    ok: true,
    route: "qr-complete",
    methods: ["POST"],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = normToken(body.token);

    if (!token) return json({ error: "invalid_token" }, 400);

    const h = await headers();
    const ip = getIp(h);

    const admin = serviceRoleClient();

    const { data: sessionRow, error } = await admin
      .from("web_qr_login_sessions")
      .select(
        `
        id,
        token,
        status,
        user_id,
        expires_at,
        approved_at,
        used_at,
        device_label,
        user_agent,
        browser,
        os,
        access_token,
        refresh_token
      `
      )
      .eq("token", token)
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!sessionRow) return json({ error: "qr_session_not_found" }, 404);

    if (sessionRow.status === "used") {
      return json({
        ok: true,
        already_used: true,
        session_id: sessionRow.id,
      });
    }

    if (sessionRow.status !== "approved") {
      return json(
        { error: "qr_not_approved", status: sessionRow.status },
        400
      );
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
const sessionKey = crypto.randomUUID();
    const ua = String(sessionRow.user_agent ?? "");
    const browser = browserFromUserAgent(ua);
    const os = osFromUserAgent(ua);
    const deviceLabel = String(sessionRow.device_label ?? "Bilinmeyen cihaz");

    const pushTitle = "Yeni Web Oturumu Açıldı";
    const pushBody = `${deviceLabel} ile ${os} / ${browser} üzerinden HalApp Web oturumu açıldı.`;

    const notificationData = {
      kind: "web_login",
      session_id: sessionRow.id,
      device_label: deviceLabel,
      user_agent: ua,
      browser,
      os,
      ip_address: ip,
      approved_at: sessionRow.approved_at,
      used_at: now,
    };

    const { error: updateError } = await admin
      .from("web_qr_login_sessions")
      .update({
        status: "used",
        used_at: now,
        last_seen_at: now,
session_key: sessionKey, 
       browser,
        os,
        ip_address: ip,
        access_token: null,
        refresh_token: null,
      })
      .eq("token", token);
 if (updateError) {
      return json({ error: updateError.message }, 400);
    }
  const cookieStore = await cookies();

cookieStore.set("halapp_web_session_key", sessionKey, {
  path: "/",
  httpOnly: false,
  sameSite: "lax",
  secure: true,
  maxAge: 60 * 60 * 24 * 30,
}); 
    const { error: notifError } = await admin.from("notifications").insert({
      user_id: userId,
      type: "security",
      title: pushTitle,
      body: pushBody,
      is_read: false,
      data: notificationData,
      metadata: {
        source: "qr_login",
        route: "/api/auth/qr-complete",
      },
    });

    if (notifError) {
      console.error("QR NOTIFICATION INSERT ERROR:", notifError);
    }

    await sendPushNotification({
      userId,
      title: pushTitle,
      body: pushBody,
      data: notificationData,
    });
    return json({
      ok: true,
session_key: sessionKey,
      user_id: userId,
      session_id: sessionRow.id,
      device_label: deviceLabel,
      browser,
      os,
      ip_address: ip,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "server_error" }, 500);
  }
}