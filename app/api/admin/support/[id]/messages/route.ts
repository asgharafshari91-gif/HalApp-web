// app/api/admin/support/[id]/messages/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function normText(v: any): string | null {
  if (v == null) return null;

  const s = String(v).trim();
  return s ? s : null;
}

function previewOf(message: string) {
  return message.length > 200 ? message.slice(0, 200) : message;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminOrRedirect("/admin/support");

  if (!gate.ok) {
    return json(
      {
        error: gate.reason ?? "not_allowed",
      },
      403
    );
  }

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const { data, error } = await sb
    .from("support_messages")
    .select(
      `
      id,
      ticket_id,
      sender_id,
      sender_role,
      message,
      read_at,
      created_at
    `
    )
    .eq("ticket_id", id)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    return json(
      {
        error: error.message,
      },
      400
    );
  }

  const now = new Date().toISOString();

  await sb
    .from("support_messages")
    .update({
      read_at: now,
    })
    .eq("ticket_id", id)
    .eq("sender_role", "user")
    .is("read_at", null);

  await sb
    .from("support_tickets")
    .update({
      unread_admin_count: 0,
    })
    .eq("id", id);

  return json({
    items: data ?? [],
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminOrRedirect("/admin/support");

  if (!gate.ok) {
    return json(
      {
        error: gate.reason ?? "not_allowed",
      },
      403
    );
  }

  const { id } = await ctx.params;
  const sb = await adminServerClient();

  const body = await req.json().catch(() => ({}));
  const message = normText(body.message);

  if (!message) {
    return json(
      {
        error: "message_required",
      },
      400
    );
  }

  const { data: ticket, error: te } = await sb
    .from("support_tickets")
    .select("id,user_id,status")
    .eq("id", id)
    .maybeSingle();

  if (te) {
    return json(
      {
        error: te.message,
      },
      400
    );
  }

  if (!ticket) {
    return json(
      {
        error: "ticket_not_found",
      },
      404
    );
  }

  const { data, error } = await sb
    .from("support_messages")
    .insert({
      ticket_id: id,
      sender_id: gate.uid,
      sender_role: "admin",
      message,
    })
    .select(
      `
      id,
      ticket_id,
      sender_id,
      sender_role,
      message,
      read_at,
      created_at
    `
    )
    .maybeSingle();

  if (error) {
    return json(
      {
        error: error.message,
      },
      400
    );
  }

  if (!data) {
    return json(
      {
        error: "insert_failed",
      },
      400
    );
  }

  const now = new Date().toISOString();

  await sb
    .from("support_tickets")
    .update({
      updated_at: now,
      last_message_at: now,
      last_admin_reply_at: now,

      last_message_preview: previewOf(message),

      unread_user_count: 1,
      unread_admin_count: 0,

      status:
        String(ticket.status ?? "open").toLowerCase() === "closed"
          ? "open"
          : ticket.status,
    })
    .eq("id", id);

  await auditLog(req, sb, {
    actor_id: gate.uid,
    target_user_id: ticket.user_id ?? null,
    action: "support.message.admin.create",
    summary: `Admin destek mesajı gönderdi (#${id})`,
    before: null,
    after: data,
  });

  return json({
    ok: true,
    message: data,
  });
}