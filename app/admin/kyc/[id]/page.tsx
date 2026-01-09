import { redirect } from "next/navigation";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import KycDetailClient from "@/app/admin/ui/kyc-detail-client";

export const dynamic = "force-dynamic";

function safeId(v: any) {
  return String(v ?? "").trim();
}

export default async function AdminKycDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) redirect(gate.redirectTo);

  const { id: rawId } = await params;
  const id = safeId(rawId);
  if (!id) redirect("/admin/kyc");

  const sb = await adminServerClient();

  const { data, error } = await sb.from("kyc_requests").select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🪪 KYC Detay</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">API Hatası: {error.message}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">🪪 KYC Detay</div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60">Kayıt bulunamadı.</div>
      </div>
    );
  }

  // profile merge
  let profile = null;
  if ((data as any).user_id) {
    const { data: p } = await sb
      .from("profiles")
      .select("id,full_name,company_name,phone,email")
      .eq("id", (data as any).user_id)
      .maybeSingle();
    profile = p ?? null;
  }

  const merged = { ...(data as any), profiles: profile };

  return <KycDetailClient initialKyc={merged as any} />;
}