"use client";

const faqs = [
  {
    q: "Favoriler neden açılmıyor?",
    a: "Favoriler bölümü için giriş yapmış ve KYC doğrulamanı tamamlamış olman gerekir.",
  },
  {
    q: "Mesajlar neden açılmıyor?",
    a: "Mesajlaşma sistemi güvenlik nedeniyle giriş ve KYC doğrulaması gerektirir.",
  },
  {
    q: "KYC onayı ne kadar sürer?",
    a: "Belgelerin doğruluğuna bağlı olarak genellikle 24-48 saat içinde sonuçlanır.",
  },
  {
    q: "Premium paket ne işe yarar?",
    a: "Premium üyelik daha fazla görünürlük, vitrin avantajı ve öncelikli destek sağlar.",
  },
  {
    q: "QR giriş güvenli mi?",
    a: "Evet. QR kodlar tek kullanımlıktır ve kısa süre içinde otomatik olarak geçersiz olur.",
  },
  {
    q: "İlanım neden görünmüyor?",
    a: "İlan süresi dolmuş olabilir veya ilan bilgileri eksik olabilir. Profil ve ilan detaylarını kontrol et.",
  },
];

export default function FaqSection() {
  return (
    <section>
      <div className="mb-4">
        <div className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-200">
          SIK SORULAN SORULAR
        </div>

        <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
          Yardım Merkezi
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group rounded-[28px] border border-black/10 bg-white/75 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
          >
            <summary className="cursor-pointer list-none font-black text-zinc-900 dark:text-white">
              <div className="flex items-center justify-between gap-4">
                <span>{item.q}</span>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
                  Aç
                </span>
              </div>
            </summary>

            <div className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-white/60">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}