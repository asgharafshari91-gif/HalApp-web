"use client";

import { useMe } from "@/lib/me";

export default function AccountHealth() {
  const me = useMe();

  const profile: any = me.profile ?? {};

  const checks = [
    {
      label: "Telefon Doğrulama",
      ok: !!profile.phone,
    },
    {
      label: "KYC Onayı",
      ok: profile.kyc_status === "approved",
    },
    {
      label: "Profil Fotoğrafı",
      ok: !!profile.avatar_url,
    },
    {
      label: "Firma Bilgileri",
      ok: !!profile.company_name,
    },
    {
      label: "Premium Üyelik",
      ok: !!profile.is_premium,
    },
  ];

  const score = Math.round(
    (checks.filter((x) => x.ok).length / checks.length) * 100
  );

  return (
    <section>
      <div className="mb-4">
        <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
          HESAP SAĞLIĞI
        </div>

        <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
          Hesap Durumu
        </h2>
      </div>

      <div className="rounded-[34px] border border-black/10 bg-white/75 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-44 w-44 items-center justify-center rounded-full border-8 border-emerald-500/20 text-center">
            <div>
              <div className="text-5xl font-black text-emerald-600">
                {score}
              </div>
              <div className="text-xs font-black text-zinc-500">
                / 100
              </div>
            </div>
          </div>

          <div className="flex-1 grid gap-3 sm:grid-cols-2">
            {checks.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-zinc-900 dark:text-white">
                    {item.label}
                  </span>

                  <span>
                    {item.ok ? "🟢" : "🟡"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}