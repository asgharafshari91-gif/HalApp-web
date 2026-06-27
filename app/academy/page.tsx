import Link from "next/link";

type AcademyItem = {
  slug: string;
  icon: string;
  title: string;
  desc: string;
  category: string;
  level: string;
  duration: string;
  lessons: number;
  color: string;
};

const academyItems: AcademyItem[] = [
  {
    slug: "ilan-olusturma",
    icon: "📦",
    title: "İlan Nasıl Oluşturulur?",
    desc: "Ürün, fiyat, miktar, şehir, fotoğraf ve video ile profesyonel ilan hazırlama.",
    category: "Satıcı Akademisi",
    level: "Başlangıç",
    duration: "2 dk",
    lessons: 5,
    color: "emerald",
  },
  {
    slug: "kyc-onay",
    icon: "🛡️",
    title: "KYC Nasıl Tamamlanır?",
    desc: "Kimlik, selfie ve firma bilgileriyle hesabını güvenli şekilde doğrula.",
    category: "Güvenli Hesap",
    level: "Zorunlu",
    duration: "2 dk",
    lessons: 4,
    color: "cyan",
  },
  {
    slug: "premium-vitrin",
    icon: "⭐",
    title: "Premium ve Vitrin Kullanımı",
    desc: "İlanlarını öne çıkar, vitrine taşı ve daha fazla alıcıya ulaş.",
    category: "Premium Akademi",
    level: "Gelir Artırma",
    duration: "3 dk",
    lessons: 6,
    color: "amber",
  },
  {
    slug: "alici-talebi",
    icon: "🛒",
    title: "Alıcı Talebi Nasıl Açılır?",
    desc: "Aradığın ürün için talep oluştur, satıcılardan hızlı teklif al.",
    category: "Alıcı Akademisi",
    level: "Başlangıç",
    duration: "2 dk",
    lessons: 4,
    color: "blue",
  },
  {
    slug: "market-intelligence",
    icon: "📡",
    title: "Market Intelligence Nasıl Okunur?",
    desc: "Şehir, ürün, talep sinyali ve sıcak bölgeleri doğru yorumla.",
    category: "Veri Akademisi",
    level: "Profesyonel",
    duration: "4 dk",
    lessons: 7,
    color: "violet",
  },
  {
    slug: "guvenli-ticaret",
    icon: "🤝",
    title: "Güvenli Ticaret İpuçları",
    desc: "Satıcı, alıcı, ödeme ve teslimat süreçlerinde güvenliği artır.",
    category: "Güvenli Ticaret",
    level: "Önemli",
    duration: "3 dk",
    lessons: 5,
    color: "rose",
  },
];

export const metadata = {
  title: "HalApp Akademi | Dijital Hal Kullanım Rehberi",
  description:
    "HalApp Akademi ile ilan oluşturma, KYC, premium, vitrin, alıcı talebi, market intelligence ve güvenli ticaret adımlarını öğrenin.",
};

export default function AcademyPage() {
  const totalLessons = academyItems.reduce((sum, x) => sum + x.lessons, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-[44px] border border-black/10 bg-white/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-200">
              🎓 HALAPP AKADEMİ
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
              Tarım ticaretini dijitalleştirmenin en hızlı yolu.
            </h1>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60 sm:text-lg">
              HalApp Akademi; satıcıların daha iyi ilan oluşturmasını,
              alıcıların doğru talep açmasını ve firmaların Market Intelligence
              verilerini doğru okumasını sağlar.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#egitimler"
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] transition hover:bg-emerald-400"
              >
                Eğitimlere Başla
              </Link>

              <Link
                href="/support"
                className="rounded-2xl border border-black/10 bg-white/70 px-6 py-3 text-sm font-black text-zinc-800 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              >
                Destek Merkezi
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Eğitim" value={academyItems.length} />
              <MiniStat label="Ders" value={totalLessons} />
              <MiniStat label="Seviye" value="Pro" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon="🚀"
          title="Hızlı başlangıç"
          desc="Yeni kullanıcılar için temel işlemler birkaç dakikada öğrenilir."
        />
        <FeatureCard
          icon="📈"
          title="Daha çok görünürlük"
          desc="Satıcılar ilan, vitrin ve premium sistemini doğru kullanır."
        />
        <FeatureCard
          icon="🛡️"
          title="Güvenli ticaret"
          desc="KYC, ödeme ve iletişim adımları daha kontrollü ilerler."
        />
      </section>

      <section id="egitimler" className="mt-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Eğitim Kütüphanesi
            </div>
            <h2 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">
              HalApp kullanım bölümleri
            </h2>
          </div>

          <div className="rounded-full bg-black/5 px-4 py-2 text-xs font-black text-zinc-500 dark:bg-white/10 dark:text-white/60">
            {academyItems.length} aktif bölüm
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {academyItems.map((item) => (
            <Link
              key={item.slug}
              href={`/academy/${item.slug}`}
              className="group relative overflow-hidden rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.055)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.07]"
            >
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-4xl">
                    {item.icon}
                  </div>

                  <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-black text-zinc-500 dark:bg-white/10 dark:text-white/60">
                    {item.duration}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
                    {item.category}
                  </span>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-black text-zinc-500 dark:bg-white/10 dark:text-white/60">
                    {item.level}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-16 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                  {item.desc}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <div className="text-xs font-black text-zinc-500">
                    {item.lessons} kısa ders
                  </div>

                  <div className="text-sm font-black text-emerald-700 transition group-hover:translate-x-1 dark:text-emerald-300">
                    Eğitimi Başlat →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-4 text-center shadow-[0_14px_50px_rgba(0,0,0,.04)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="text-2xl font-black text-zinc-950 dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-xs font-black text-zinc-500">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.055)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
        {desc}
      </p>
    </div>
  );
}