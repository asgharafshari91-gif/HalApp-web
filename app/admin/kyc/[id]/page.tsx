// app/admin/kyc/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import KycDetailClient from "@/app/admin/ui/kyc-detail-client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function safeId(v: any) {
  return String(v ?? "").trim();
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function ErrorBox({
  title,
  message,
  backHref = "/admin/kyc",
}: {
  title: string;
  message: string;
  backHref?: string;
}) {
  return (
    <div className="rounded-[26px] border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm">
      <div className="text-lg font-black text-rose-700 dark:text-rose-200">
        {title}
      </div>

      <div className="mt-2 text-sm font-semibold text-rose-700/80 dark:text-rose-200/80">
        {message}
      </div>

      <Link
        href={backHref}
        className="mt-5 inline-flex rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white hover:bg-rose-500"
      >
        ← KYC Listesine Dön
      </Link>
    </div>
  );
}

function EmptyBox() {
  return (
    <div className="rounded-[26px] border border-black/10 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-lg font-black">🪪 KYC Detay</div>

      <div className="mt-2 text-sm font-semibold text-black/60 dark:text-white/60">
        Kayıt bulunamadı.
      </div>

      <Link
        href="/admin/kyc"
        className="mt-5 inline-flex rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
      >
        ← Listeye dön
      </Link>
    </div>
  );
}

export default async function AdminKycDetailPage({ params }: { params: Params }) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) redirect(gate.redirectTo);

  const { id: rawId } = await params;
  const id = safeId(rawId);

  if (!id) redirect("/admin/kyc");

  if (!isUuid(id)) {
    return (
      <ErrorBox
        title="🪪 KYC Detay"
        message="Geçersiz kullanıcı/KYC ID formatı. Lütfen KYC listesinden geçerli bir kayıt aç."
      />
    );
  }

  const sb = await adminServerClient();

  const { data: profile, error } = await sb
    .from("profiles")
    .select(
      `
      id,
      full_name,
      company_name,
      phone,
      email,
      account_type,
      user_role,
      role,
      avatar_url,
      city,
      district,
      is_premium,
      verified,
      is_admin,
      banned_until,
      created_at,
      last_seen_at,
      kyc_status,
      kyc_submitted_at,
      kyc_approved_at,
      kyc_rejected_at,
      kyc_last_updated,
      kyc_reviewed_by,
      kyc_comment,
      kyc_note,
      kyc_id_front_url,
      kyc_id_back_url,
      kyc_selfie_url,
      id_card_front_url,
      id_card_back_url,
      selfie_url,
      kyc_trade_registry_url,
      kyc_tax_plate_url,
      kyc_activity_cert_url,
      kyc_signature_circ_url
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <ErrorBox
        title="🪪 KYC Detay"
        message={`KYC sorgu hatası: ${error.message}`}
      />
    );
  }

  if (!profile) {
    return <EmptyBox />;
  }

  const merged = {
    id: profile.id,
    user_id: profile.id,

    account_type: profile.account_type ?? "individual",
    status: profile.kyc_status ?? "none",
    kyc_status: profile.kyc_status ?? "none",
    verified: profile.verified ?? false,

    submitted_at: profile.kyc_submitted_at ?? null,
    created_at: profile.created_at ?? null,
    reviewed_at: profile.kyc_approved_at ?? profile.kyc_rejected_at ?? null,
    reviewed_by: profile.kyc_reviewed_by ?? null,
    reject_reason: profile.kyc_comment ?? null,

    id_front_path: profile.kyc_id_front_url ?? profile.id_card_front_url ?? null,
    id_back_path: profile.kyc_id_back_url ?? profile.id_card_back_url ?? null,
    selfie_path: profile.kyc_selfie_url ?? profile.selfie_url ?? null,

    trade_registry_path: profile.kyc_trade_registry_url ?? null,
    tax_plate_path: profile.kyc_tax_plate_url ?? null,
    activity_cert_path: profile.kyc_activity_cert_url ?? null,
    signature_circ_path: profile.kyc_signature_circ_url ?? null,

    kyc_comment: profile.kyc_comment ?? null,
    kyc_note: profile.kyc_note ?? null,

    profiles: {
      id: profile.id,
      full_name: profile.full_name,
      company_name: profile.company_name,
      phone: profile.phone,
      email: profile.email,
      avatar_url: profile.avatar_url,
      city: profile.city,
      district: profile.district,
      role: profile.user_role ?? profile.role,
      kyc_status: profile.kyc_status,
      is_premium: profile.is_premium,
      verified: profile.verified,
      is_admin: profile.is_admin,
      banned_until: profile.banned_until,
      created_at: profile.created_at,
      last_seen_at: profile.last_seen_at,
    },
  };

  return <KycDetailClient initialKyc={merged as any} />;
}