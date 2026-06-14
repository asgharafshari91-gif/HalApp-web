import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normText(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

async function sbServer() {
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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const sb = await sbServer();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user?.id) return json({ error: "not_authed" }, 401);

  const { data: ticket, error: te } = await sb
    .from("support_tickets")
    .select("id,user_id")
    .eq("id", id)
    .maybeSingle();

  if (te) return json({ error: te.message }, 400);
  if (!ticket || ticket.user_id !== user.id) {
    return json({ error: "not_found" }, 404);
  }

  const { data, error } = await sb
    .from("support_messages")
    .select("id,ticket_id,sender_id,sender_role,message,created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (error) return json({ error: error.message }, 400);

  return json({ items: data ?? [] });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const sb = await sbServer();

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user?.id) return json({ error: "not_authed" }, 401);

  const body = await req.json().catch(() => ({}));
  const message = normText(body.message);

  if (!message) return json({ error: "message_required" }, 400);

  const { data: ticket, error: te } = await sb
    .from("support_tickets")
    .select("id,user_id,status")
    .eq("id", id)
    .maybeSingle();

  if (te) return json({ error: te.message }, 400);
  if (!ticket || ticket.user_id !== user.id) {
    return json({ error: "not_found" }, 404);
  }

  if (String(ticket.status ?? "open").toLowerCase() === "closed") {
    return json({ error: "ticket_closed" }, 400);
  }

  const { data, error } = await sb
    .from("support_messages")
    .insert({
      ticket_id: id,
      sender_id: user.id,
      sender_role: "user",
      message,
    })
    .select("id,ticket_id,sender_id,sender_role,message,created_at")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);

  await sb
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  return json({ ok: true, message: data });
}