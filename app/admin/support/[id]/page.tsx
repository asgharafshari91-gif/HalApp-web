// app/admin/support/[id]/page.tsx
import { redirect } from "next/navigation";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";
import SupportDetailClient from "./ui/support-detail-client";

export const dynamic = "force-dynamic";

const ticketSelect = `
  id,
  user_id,
  subject,
  message,
  body,
  contact,
  status,
  resolution,
  category,
  priority,
  internal_note,
  assigned_admin_id,
  closed_at,
  closed_by,
  created_at,
  updated_at,
  last_message_at,
  last_admin_reply_at,
  last_user_reply_at,
  last_message_preview,
  unread_admin_count,
  unread_user_count,
  rating,
  rating_comment,
  rated_at,
  ticket_no,
  profiles:profiles(
    id,
    full_name,
    company_name,
    phone,
    email,
    avatar_url,
    city,
    district,
    neighborhood,
    role,
    registration_type,
    kyc_status,
    is_premium,
    premium_until,
    membership_status,
    membership_expires_at
  )
`;

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gate = await requireAdminOrRedirect("/admin/support");

  if (!gate.ok) {
    redirect(gate.redirectTo);
  }

  const { id } = await params;
  const sb = await adminServerClient();

  const { data: ticket, error } = await sb
    .from("support_tickets")
    .select(ticketSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🎫 Support Ticket</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          Supabase Hatası: {error.message}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🎫 Support Ticket</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          Ticket bulunamadı.
        </div>
      </div>
    );
  }

  return <SupportDetailClient initialTicket={ticket} />;
}