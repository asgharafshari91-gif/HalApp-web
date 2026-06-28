import { NextResponse } from "next/server";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

function escLike(s: string) {
  return String(s ?? "").replace(/[%_,]/g, " ").trim();
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(req: Request) {
  const gate = await requireAdminOrRedirect("/admin");
  if (!gate.ok) {
    return NextResponse.json({ error: "not_authorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const sb = await adminServerClient();
  const like = escLike(q);

  const items: any[] = [];

  const usersQuery = sb
    .from("profiles")
    .select("id,full_name,company_name,email,phone")
    .or(
      isUuid(q)
        ? `id.eq.${q},full_name.ilike.%${like}%,company_name.ilike.%${like}%,email.ilike.%${like}%,phone.ilike.%${like}%`
        : `full_name.ilike.%${like}%,company_name.ilike.%${like}%,email.ilike.%${like}%,phone.ilike.%${like}%`
    )
    .limit(8);

  const kycQuery = sb
    .from("kyc_requests")
    .select("id,user_id,status,created_at")
    .or(isUuid(q) ? `id.eq.${q},user_id.eq.${q}` : `status.ilike.%${like}%`)
    .limit(8);

  const supportQuery = sb
    .from("support_tickets")
    .select("id,user_id,subject,status,created_at")
    .or(
      isUuid(q)
        ? `id.eq.${q},user_id.eq.${q}`
        : `subject.ilike.%${like}%,message.ilike.%${like}%,body.ilike.%${like}%`
    )
    .limit(8);

  const [usersRes, kycRes, supportRes] = await Promise.allSettled([
    usersQuery,
    kycQuery,
    supportQuery,
  ]);

  if (usersRes.status === "fulfilled" && !usersRes.value.error) {
    for (const u of usersRes.value.data ?? []) {
      items.push({
        id: u.id,
        type: "user",
        title: u.company_name || u.full_name || "Kullanıcı",
        subtitle: [u.email, u.phone, u.id].filter(Boolean).join(" • "),
      });
    }
  }

  if (kycRes.status === "fulfilled" && !kycRes.value.error) {
    for (const k of kycRes.value.data ?? []) {
      items.push({
        id: k.id,
        type: "kyc",
        title: `KYC ${String(k.status ?? "pending").toUpperCase()}`,
        subtitle: `user: ${k.user_id ?? "—"}`,
      });
    }
  }

  if (supportRes.status === "fulfilled" && !supportRes.value.error) {
    for (const t of supportRes.value.data ?? []) {
      items.push({
        id: t.id,
        type: "ticket",
        title: t.subject || "Destek Talebi",
        subtitle: `status: ${t.status ?? "open"} • user: ${t.user_id ?? "—"}`,
      });
    }
  }

  return NextResponse.json({ items: items.slice(0, 20) });
}