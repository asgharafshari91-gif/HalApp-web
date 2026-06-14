// app/api/support/[id]/rating/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
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

function normRating(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const r = Math.floor(n);
  if (r < 1 || r > 5) return null;
  return r;
}

function normText(v: any) {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, 1000) : null;
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

  if (!user?.id) {
    return json({ error: "not_authed" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const rating = normRating(body.rating);
  const ratingComment = normText(body.comment);

  if (!rating) {
    return json({ error: "invalid_rating" }, 400);
  }

  const { data: ticket, error: te } = await sb
    .from("support_tickets")
    .select("id,user_id,status,rating")
    .eq("id", id)
    .maybeSingle();

  if (te) return json({ error: te.message }, 400);

  if (!ticket || ticket.user_id !== user.id) {
    return json({ error: "not_found" }, 404);
  }

  if (String(ticket.status ?? "open").toLowerCase() !== "closed") {
    return json({ error: "ticket_not_closed" }, 400);
  }

  if (ticket.rating) {
    return json({ error: "already_rated" }, 400);
  }

  const { data, error } = await sb
    .from("support_tickets")
    .update({
      rating,
      rating_comment: ratingComment,
      rated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,rating,rating_comment,rated_at")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);

  return json({
    ok: true,
    ticket: data,
  });
}