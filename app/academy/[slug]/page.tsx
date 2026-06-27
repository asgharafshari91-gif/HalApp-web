import Link from "next/link";
import { notFound } from "next/navigation";

type Lesson = {
  title: string;
  desc: string;
};

type AcademyDetail = {
  slug: string;
  icon: string;
  title: string;
  subtitle: string;
  category: string;
  duration: string;
  level: string;
  lessons: Lesson[];
  steps: string[];
  faq: { q: string; a: string }[];
};

const academyDetails: AcademyDetail[] = [
  {
    slug: "ilan-olusturma",
    icon: "📦",
    title: "İlan Nasıl Oluşturulur?",
    subtitle:
      "Ürün, fiyat, miktar, şehir ve medya bilgileriyle profesyonel ilan oluşturmayı öğren.",
    category: "Satıcı Akademisi",
    duration: "2 dk",
    level: "Başlangıç",
    lessons: [
      { title: "Ürün seçimi", desc: "Doğru ürün adını ve kategoriyi seç." },
      { title: "Fiyat ve birim", desc: "Kg, kasa, ton veya adet birimini net yaz." },
      { title: "Medya ekleme", desc: "Net fotoğraf ve kısa video güveni artırır." },
      { title: "Konum bilgisi", desc: "Şehir, ilçe ve teslimat bilgisini doğru gir." },
      { title: "Yayına alma", desc: "Bilgileri kontrol edip ilanı yayınla." },
    ],
    steps: [
      "Pazar sayfasından İlan Oluştur alanına gir.",
      "Ürün adı, miktar, fiyat ve birim bilgilerini doldur.",
      "En az 1 net fotoğraf ekle.",
      "Açıklamaya kalite, teslimat ve stok bilgisini yaz.",
      "İlanı yayınla ve mesajları takip et.",
    ],
    faq: [
      {
        q: "İlanım neden görünmüyor?",
        a: "KYC, medya eksikliği, ilan süresi veya admin kontrolü nedeniyle görünmeyebilir.",
      },
      {
        q: "Video eklemek şart mı?",
        a: "Şart değil ama alıcı güvenini ciddi artırır.",
      },
    ],
  },
  {
    slug: "kyc-onay",
    icon: "🛡️",
    title: "KYC Nasıl Tamamlanır?",
    subtitle:
      "Kimlik, selfie ve firma bilgileriyle HalApp hesabını güvenli hale getir.",
    category: "Güvenli Hesap",
    duration: "2 dk",
    level: "Zorunlu",
    lessons: [
      { title: "Kimlik bilgisi", desc: "Kimlik ön/arka görsellerini net yükle." },
      { title: "Selfie kontrolü", desc: "Yüzün açık ve anlaşılır olsun." },
      { title: "Firma hesabı", desc: "Vergi ve firma bilgilerini eksiksiz gir." },
      { title: "Onay süreci", desc: "Başvuru destek/admin ekibi tarafından incelenir." },
    ],
    steps: [
      "Profil sayfasına gir.",
      "KYC / Hesap Onayı bölümünü aç.",
      "Kimlik ve selfie görsellerini yükle.",
      "Firma hesabıysan firma bilgilerini doldur.",
      "Başvuruyu gönder ve sonucu bekle.",
    ],
    faq: [
      {
        q: "KYC neden beklemede kalır?",
        a: "Görsel net değilse veya firma bilgileri eksikse inceleme uzayabilir.",
      },
      {
        q: "KYC olmadan mesaj atabilir miyim?",
        a: "Bazı işlemler için KYC zorunlu olabilir.",
      },
    ],
  },
  {
    slug: "premium-vitrin",
    icon: "⭐",
    title: "Premium ve Vitrin Kullanımı",
    subtitle: "İlanlarını öne çıkar, vitrine taşı ve daha fazla alıcıya ulaş.",
    category: "Premium Akademi",
    duration: "3 dk",
    level: "Gelir Artırma",
    lessons: [
      { title: "Premium nedir?", desc: "Hesabın ve ilanların daha görünür olur." },
      { title: "Vitrin Plus", desc: "İlan ana alanlarda daha güçlü gösterilir." },
      { title: "Boost sistemi", desc: "Belirli süreyle ilanını öne çıkarır." },
      { title: "İlan uzatma", desc: "Süresi dolan ilanı tekrar aktif tutar." },
      { title: "Performans takibi", desc: "Görüntülenme ve talep sinyallerini izle." },
    ],
    steps: [
      "Profil veya ilan detayından paketler alanına gir.",
      "Premium, Vitrin veya Boost paketini seç.",
      "Ödeme/dekont adımını tamamla.",
      "Onay sonrası ilan görünürlüğünü takip et.",
      "Gerekirse destek merkezinden ticket oluştur.",
    ],
    faq: [
      {
        q: "Paket aldım ama aktif olmadı?",
        a: "Ödeme onayı bekliyor olabilir. Destek Merkezi üzerinden Premium ticket açabilirsin.",
      },
      {
        q: "Vitrin ile Boost farkı ne?",
        a: "Vitrin daha kalıcı görünürlük, Boost ise süreli öne çıkarma sağlar.",
      },
    ],
  },
  {
    slug: "alici-talebi",
    icon: "🛒",
    title: "Alıcı Talebi Nasıl Açılır?",
    subtitle: "Aradığın ürün için talep oluştur, satıcılardan hızlı teklif al.",
    category: "Alıcı Akademisi",
    duration: "2 dk",
    level: "Başlangıç",
    lessons: [
      { title: "Ürün ihtiyacı", desc: "Aradığın ürünü net belirt." },
      { title: "Miktar bilgisi", desc: "Kg, ton, kasa veya adet olarak miktar yaz." },
      { title: "Lokasyon", desc: "Teslimat şehri ve ilçe bilgisini ekle." },
      { title: "Satıcı dönüşü", desc: "Uygun satıcılar talebini görüp iletişime geçer." },
    ],
    steps: [
      "Alıcı Talebi oluştur alanına gir.",
      "Ürün, miktar ve teslimat lokasyonunu yaz.",
      "Kalite, ambalaj ve teslimat notlarını ekle.",
      "Talebi yayınla.",
      "Gelen mesajları takip et.",
    ],
    faq: [
      {
        q: "Talebime kimler cevap verir?",
        a: "İlgili ürünü satan veya o bölgede işlem yapan satıcılar dönüş yapabilir.",
      },
      {
        q: "Fiyat yazmak zorunlu mu?",
        a: "Zorunlu olmayabilir ama bütçe belirtmek daha hızlı teklif aldırır.",
      },
    ],
  },
  {
    slug: "market-intelligence",
    icon: "📡",
    title: "Market Intelligence Nasıl Okunur?",
    subtitle: "Şehir, ürün, talep sinyali ve sıcak bölgeleri doğru yorumla.",
    category: "Veri Akademisi",
    duration: "4 dk",
    level: "Profesyonel",
    lessons: [
      { title: "Talep sinyali", desc: "Hangi şehirden hangi ürüne ilgi geldiğini gösterir." },
      { title: "Sıcak şehirler", desc: "Talebin yoğunlaştığı bölgeleri görürsün." },
      { title: "Ürün trendleri", desc: "Hangi ürünün yükseldiğini takip edersin." },
      { title: "Fırsat analizi", desc: "Satış ve lojistik kararlarını veriyle alırsın." },
    ],
    steps: [
      "Canlı Türkiye Haritası veya Market Intelligence alanına gir.",
      "Ürün ve şehir sinyallerini kontrol et.",
      "Tıklama ve talep artışlarını yorumla.",
      "Sıcak şehirlerde ilanını güçlendir.",
      "Premium veya vitrin ile görünürlüğünü artır.",
    ],
    faq: [
      {
        q: "Talep sinyali satış garantisi mi?",
        a: "Hayır, ama ürün ilgisini ve pazar hareketini gösteren güçlü bir veridir.",
      },
      {
        q: "Bu veri ne işe yarar?",
        a: "Hangi ürünü hangi şehirde daha agresif satabileceğini anlamana yardım eder.",
      },
    ],
  },
  {
    slug: "guvenli-ticaret",
    icon: "🤝",
    title: "Güvenli Ticaret İpuçları",
    subtitle: "Satıcı, alıcı, ödeme ve teslimat süreçlerinde güvenliği artır.",
    category: "Güvenli Ticaret",
    duration: "3 dk",
    level: "Önemli",
    lessons: [
      { title: "Satıcı kontrolü", desc: "Profil, KYC ve firma bilgilerini incele." },
      { title: "Alıcı kontrolü", desc: "Talep ve iletişim geçmişine dikkat et." },
      { title: "Ödeme güvenliği", desc: "Belgesiz ve şüpheli ödeme yöntemlerinden kaçın." },
      { title: "Şüpheli durum", desc: "Destek merkezinden bildirim oluştur." },
    ],
    steps: [
      "Karşı tarafın profilini kontrol et.",
      "KYC/onay durumuna bak.",
      "Ürün, fiyat ve teslimat şartlarını yazılı netleştir.",
      "Ödeme ve sevkiyat belgelerini sakla.",
      "Şüpheli durumda destek ticketı oluştur.",
    ],
    faq: [
      {
        q: "HalApp ödeme garantisi verir mi?",
        a: "HalApp taraflar arasında dijital pazar ve iletişim altyapısı sağlar. Ödeme şartlarını taraflar netleştirmelidir.",
      },
      {
        q: "Şüpheli kullanıcıyı nasıl bildiririm?",
        a: "Destek Merkezi üzerinden açıklama yazarak ticket oluşturabilirsin.",
      },
    ],
  },
];

export async function generateStaticParams() {
  return academyDetails.map((x) => ({
    slug: x.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = academyDetails.find((x) => x.slug === slug);

  return {
    title: item ? `${item.title} | HalApp Akademi` : "HalApp Akademi",
    description: item?.subtitle ?? "HalApp Akademi kullanım rehberleri.",
  };
}

export default async function AcademyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = academyDetails.find((x) => x.slug === slug);

  if (!item) notFound();

  const supportHref = `/support?topic=${encodeURIComponent(
    item.slug
  )}#ticket-form`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-[46px] border border-black/10 bg-white/85 p-6 shadow-[0_35px_130px_rgba(0,0,0,.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[460px] w-[460px] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 left-10 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Link
              href="/academy"
              className="inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-black text-zinc-600 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
            >
              ← Akademiye Dön
            </Link>

            <div className="mt-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-200">
              {item.icon} {item.category}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
              {item.title}
            </h1>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60 sm:text-lg">
              {item.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#video"
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] transition hover:bg-emerald-400"
              >
                Eğitime Başla
              </Link>

              <Link
                href={supportHref}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-500 hover:text-black dark:text-emerald-200"
              >
                Destek Talebi Oluştur →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Süre" value={item.duration} />
              <MiniStat label="Ders" value={item.lessons.length} />
              <MiniStat label="Seviye" value={item.level} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div
            id="video"
            className="overflow-hidden rounded-[42px] border border-black/10 bg-black shadow-[0_30px_110px_rgba(0,0,0,.16)] dark:border-white/10"
          >
            <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-emerald-950 to-black p-8 text-center">
              <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/70 backdrop-blur-xl">
                HALAPP AKADEMİ VIDEO
              </div>

              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

              <div className="relative">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/10 text-6xl shadow-[0_30px_100px_rgba(34,197,94,.22)] backdrop-blur-xl">
                  {item.icon}
                </div>

                <div className="mt-6 text-3xl font-black text-white">
                  {item.title}
                </div>

                <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-white/55">
                  Kısa eğitim videosu hazırlanıyor. Bu alana YouTube, MP4 veya
                  HalApp içi video player bağlanacak.
                </p>

                <div className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black">
                  Yakında Video Aktif
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[38px] border border-black/10 bg-white/85 p-6 shadow-[0_24px_90px_rgba(0,0,0,.055)] dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                Eğitim İçeriği
              </h2>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
                {item.lessons.length} ders
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {item.lessons.map((lesson, index) => (
                <div
                  key={lesson.title}
                  className="group rounded-[26px] border border-black/10 bg-white/75 p-4 transition hover:-translate-y-0.5 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_14px_40px_rgba(34,197,94,.20)]">
                      {index + 1}
                    </div>

                    <div>
                      <h3 className="font-black text-zinc-950 dark:text-white">
                        {lesson.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                        {lesson.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[38px] border border-black/10 bg-white/85 p-6 shadow-[0_24px_90px_rgba(0,0,0,.055)] dark:border-white/10 dark:bg-white/[0.045]">
            <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
              Sık Sorulan Sorular
            </h2>

            <div className="mt-5 space-y-3">
              {item.faq.map((f) => (
                <div
                  key={f.q}
                  className="rounded-[26px] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <h3 className="font-black text-zinc-950 dark:text-white">
                    {f.q}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-[38px] border border-black/10 bg-white/85 p-6 shadow-[0_24px_90px_rgba(0,0,0,.055)] dark:border-white/10 dark:bg-white/[0.045]">
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                Adım Adım Uygula
              </h2>

              <div className="mt-5 space-y-3">
                {item.steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-2xl border border-black/10 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-black">
                      {index + 1}
                    </div>

                    <div className="text-sm font-semibold leading-6 text-zinc-700 dark:text-white/70">
                      {step}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/pazar"
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-center text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.20)] transition hover:bg-emerald-400"
                >
                  Uygulamaya Git →
                </Link>

                <Link
                  href={supportHref}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center text-sm font-black text-emerald-800 transition hover:bg-emerald-500 hover:text-black dark:text-emerald-200"
                >
                  Destek Talebi Oluştur →
                </Link>

                <Link
                  href="/chat"
                  className="rounded-2xl border border-black/10 bg-white/75 px-5 py-3 text-center text-sm font-black text-zinc-800 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                >
                  Canlı Sohbete Git →
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[38px] border border-emerald-500/20 bg-emerald-500/10 p-6">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="relative">
                <div className="text-4xl">🏆</div>
                <h3 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                  HalApp Başarı Merkezi
                </h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
                  Doğru ilan, güvenli hesap ve veri kullanımı ile daha fazla
                  alıcıya ulaşabilirsin.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-4 text-center shadow-[0_14px_50px_rgba(0,0,0,.04)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="text-xl font-black text-zinc-950 dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-xs font-black text-zinc-500">{label}</div>
    </div>
  );
}