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
      <div className="text-lg font-black text-rose-700 dark:text-rose-200">{title}</div>
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
        message="Geçersiz KYC ID formatı. Lütfen KYC listesinden geçerli bir kayıt aç."
      />
    );
  }

  const sb = await adminServerClient();

  const { data: kyc, error: kycError } = await sb
    .from("kyc_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (kycError) {
    return <ErrorBox title="🪪 KYC Detay" message={`KYC sorgu hatası: ${kycError.message}`} />;
  }

  if (!kyc) {
    return <EmptyBox />;
  }

  let profile = null;

  if ((kyc as any).user_id) {
    const { data: profileData, error: profileError } = await sb
      .from("profiles")
      .select(
        [
          "id",
          "full_name",
          "company_name",
          "phone",
          "email",
          "avatar_url",
          "city",
          "district",
          "role",
          "kyc_status",
          "is_premium",
          "verified",
          "is_admin",
          "banned_until",
          "created_at",
          "last_seen_at",
        ].join(",")
      )
      .eq("id", (kyc as any).user_id)
      .maybeSingle();

    if (profileError) {
      return (
        <ErrorBox
          title="🪪 KYC Detay"
          message={`Profil eşleştirme hatası: ${profileError.message}`}
        />
      );
    }

    profile = profileData ?? null;
  }

  const merged = {
    ...(kyc as any),
    profiles: profile,
  };

  return <KycDetailClient initialKyc={merged as any} />;
}