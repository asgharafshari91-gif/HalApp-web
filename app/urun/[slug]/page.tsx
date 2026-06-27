import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  title: string | null;
  description: string | null;
  product_name: string | null;
  product_type: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  price: number | null;
  price_per_unit: number | null;
  min_price: number | null;
  max_price: number | null;
  unit: string | null;
  quantity: number | null;
  min_quantity: number | null;
  media_urls: string[] | null;
  media_types: string[] | null;
  is_boosted: boolean | null;
  is_featured: boolean | null;
  vitrin_until: string | null;
  boost_until: string | null;
  verified_seller: boolean | null;
  cold_chain: boolean | null;
  transport_included: boolean | null;
  packaging_type: string | null;
  created_at: string | null;
  published_at: string | null;
};

type ProductInfo = {
  name: string;
  emoji: string;
  type: string;
};

type PageProps = {
  params: Promise<{ slug?: string }>;
};

const SITE_URL = "https://halapp.app";

const PRODUCT_MAP: Record<string, ProductInfo> = {
  elma: { name: "Elma", emoji: "🍎", type: "Meyve" },
  "elma-golden": { name: "Elma Golden", emoji: "🍎", type: "Meyve" },
  "elma-granny-smith": { name: "Elma Granny Smith", emoji: "🍎", type: "Meyve" },
  "elma-starking": { name: "Elma Starking", emoji: "🍎", type: "Meyve" },
  armut: { name: "Armut", emoji: "🍐", type: "Meyve" },
  ayva: { name: "Ayva", emoji: "🍐", type: "Meyve" },
  portakal: { name: "Portakal", emoji: "🍊", type: "Meyve" },
  "portakal-sikmalik": { name: "Portakal Sıkmalık", emoji: "🍊", type: "Meyve" },
  "portakal-valencia-pak": { name: "Portakal Valencia Pak", emoji: "🍊", type: "Meyve" },
  mandalina: { name: "Mandalina", emoji: "🍊", type: "Meyve" },
  mandarin: { name: "Mandarin", emoji: "🍊", type: "Meyve" },
  "mandarin-paket": { name: "Mandarin Paket", emoji: "🍊", type: "Meyve" },
  greyfurt: { name: "Greyfurt", emoji: "🍊", type: "Meyve" },
  limon: { name: "Limon", emoji: "🍋", type: "Meyve" },
  "lime-limon": { name: "Lime Limon", emoji: "🍋", type: "Meyve" },
  muz: { name: "Muz", emoji: "🍌", type: "Meyve" },
  "muz-yerli": { name: "Muz Yerli", emoji: "🍌", type: "Meyve" },
  "muz-ithal": { name: "Muz İthal", emoji: "🍌", type: "Meyve" },
  karpuz: { name: "Karpuz", emoji: "🍉", type: "Meyve" },
  kavun: { name: "Kavun", emoji: "🍈", type: "Meyve" },
  "kavun-kirkagac": { name: "Kavun Kırkağaç", emoji: "🍈", type: "Meyve" },
  uzum: { name: "Üzüm", emoji: "🍇", type: "Meyve" },
  "uzum-beyaz": { name: "Üzüm Beyaz", emoji: "🍇", type: "Meyve" },
  "uzum-siyah": { name: "Üzüm Siyah", emoji: "🍇", type: "Meyve" },
  cilek: { name: "Çilek", emoji: "🍓", type: "Meyve" },
  "altin-cilek": { name: "Altın Çilek", emoji: "🍓", type: "Meyve" },
  ahududu: { name: "Ahududu", emoji: "🫐", type: "Meyve" },
  bogurtlen: { name: "Böğürtlen", emoji: "🫐", type: "Meyve" },
  blueberry: { name: "Blue Berry", emoji: "🫐", type: "Meyve" },
  "yaban-mersini": { name: "Yaban Mersini", emoji: "🫐", type: "Meyve" },
  dut: { name: "Dut", emoji: "🫐", type: "Meyve" },
  kiraz: { name: "Kiraz", emoji: "🍒", type: "Meyve" },
  visne: { name: "Vişne", emoji: "🍒", type: "Meyve" },
  seftali: { name: "Şeftali", emoji: "🍑", type: "Meyve" },
  kayisi: { name: "Kayısı", emoji: "🍑", type: "Meyve" },
  nektarin: { name: "Nektarin", emoji: "🍑", type: "Meyve" },
  erik: { name: "Erik", emoji: "🟣", type: "Meyve" },
  nar: { name: "Nar", emoji: "🔴", type: "Meyve" },
  incir: { name: "İncir", emoji: "🟣", type: "Meyve" },
  kivi: { name: "Kivi", emoji: "🥝", type: "Meyve" },
  ananas: { name: "Ananas", emoji: "🍍", type: "Meyve" },
  mango: { name: "Mango", emoji: "🥭", type: "Meyve" },
  avokado: { name: "Avokado", emoji: "🥑", type: "Meyve" },
  "hindistan-cevizi": { name: "Hindistan Cevizi", emoji: "🥥", type: "Meyve" },
  hurma: { name: "Hurma", emoji: "🌴", type: "Meyve" },
  "amme-cennet-meyvesi": { name: "Amme Cennet Meyvesi", emoji: "🌴", type: "Meyve" },

  domates: { name: "Domates", emoji: "🍅", type: "Sebze" },
  "domates-ceri": { name: "Domates Ceri", emoji: "🍅", type: "Sebze" },
  "domates-pembe": { name: "Domates Pembe", emoji: "🍅", type: "Sebze" },
  "domates-kokteyl": { name: "Domates Kokteyl", emoji: "🍅", type: "Sebze" },
  biber: { name: "Biber", emoji: "🌶️", type: "Sebze" },
  "biber-carli": { name: "Biber Çarli", emoji: "🌶️", type: "Sebze" },
  "biber-kapya": { name: "Biber Kapya", emoji: "🌶️", type: "Sebze" },
  "biber-sivri": { name: "Biber Sivri", emoji: "🌶️", type: "Sebze" },
  "biber-ucburun": { name: "Biber Üçburun", emoji: "🌶️", type: "Sebze" },
  patlican: { name: "Patlıcan", emoji: "🍆", type: "Sebze" },
  "patlican-topak": { name: "Patlıcan Topak", emoji: "🍆", type: "Sebze" },
  salatalik: { name: "Salatalık", emoji: "🥒", type: "Sebze" },
  hiyar: { name: "Hıyar", emoji: "🥒", type: "Sebze" },
  kabak: { name: "Kabak", emoji: "🎃", type: "Sebze" },
  "kabak-bal": { name: "Kabak Bal", emoji: "🎃", type: "Sebze" },
  "kabak-sakiz": { name: "Kabak Sakız", emoji: "🎃", type: "Sebze" },
  patates: { name: "Patates", emoji: "🥔", type: "Sebze" },
  "patates-baby": { name: "Patates Baby", emoji: "🥔", type: "Sebze" },
  "patates-kumpirlik": { name: "Patates Kumpirlik", emoji: "🥔", type: "Sebze" },
  sogan: { name: "Soğan", emoji: "🧅", type: "Sebze" },
  "sogan-kuru": { name: "Soğan Kuru", emoji: "🧅", type: "Sebze" },
  "sogan-arpacik": { name: "Soğan Arpacık", emoji: "🧅", type: "Sebze" },
  "sogan-kirmizi": { name: "Soğan Kırmızı", emoji: "🧅", type: "Sebze" },
  "sogan-yesil-bag": { name: "Soğan Yeşil Bağ", emoji: "🧅", type: "Sebze" },
  sarimsak: { name: "Sarımsak", emoji: "🧄", type: "Sebze" },
  "sarimsak-taze": { name: "Sarımsak Taze", emoji: "🧄", type: "Sebze" },
  havuc: { name: "Havuç", emoji: "🥕", type: "Sebze" },
  turp: { name: "Turp", emoji: "🥕", type: "Sebze" },
  "turp-kirmizi": { name: "Turp Kırmızı", emoji: "🥕", type: "Sebze" },
  "turp-findik": { name: "Turp Fındık", emoji: "🥕", type: "Sebze" },
  pancar: { name: "Pancar", emoji: "🥕", type: "Sebze" },
  brokoli: { name: "Brokoli", emoji: "🥦", type: "Sebze" },
  karnabahar: { name: "Karnabahar", emoji: "🥦", type: "Sebze" },
  lahana: { name: "Lahana", emoji: "🥬", type: "Sebze" },
  "lahana-beyaz": { name: "Lahana Beyaz", emoji: "🥬", type: "Sebze" },
  "lahana-kirmizi": { name: "Lahana Kırmızı", emoji: "🥬", type: "Sebze" },
  marul: { name: "Marul", emoji: "🥬", type: "Sebze" },
  "marul-aysberk": { name: "Marul Aysberk", emoji: "🥬", type: "Sebze" },
  "marul-duz": { name: "Marul Düz", emoji: "🥬", type: "Sebze" },
  "marul-kivircik": { name: "Marul Kıvırcık", emoji: "🥬", type: "Sebze" },
  ispanak: { name: "Ispanak", emoji: "🥬", type: "Sebze" },
  pazi: { name: "Pazı", emoji: "🥬", type: "Sebze" },
  "pazi-bag": { name: "Pazı Bağ", emoji: "🥬", type: "Sebze" },
  kereviz: { name: "Kereviz", emoji: "🥬", type: "Sebze" },
  pirasa: { name: "Pırasa", emoji: "🥬", type: "Sebze" },
  "karadeniz-yapragi": { name: "Karadeniz Yaprağı", emoji: "🥬", type: "Sebze" },
  "kuzu-kulagi": { name: "Kuzu Kulağı", emoji: "🥬", type: "Sebze" },
  semizotu: { name: "Semizotu", emoji: "🥬", type: "Sebze" },
  "semizotu-bag": { name: "Semizotu Bağ", emoji: "🥬", type: "Sebze" },
  enginar: { name: "Enginar", emoji: "🌿", type: "Sebze" },
  bamya: { name: "Bamya", emoji: "🌿", type: "Sebze" },
  fasulye: { name: "Fasulye", emoji: "🫛", type: "Sebze" },
  bezelye: { name: "Bezelye", emoji: "🫛", type: "Sebze" },
  bakla: { name: "Bakla", emoji: "🫛", type: "Sebze" },
  misir: { name: "Mısır", emoji: "🌽", type: "Sebze" },
  mantar: { name: "Mantar", emoji: "🍄", type: "Sebze" },
  kuskonmaz: { name: "Kuşkonmaz", emoji: "🌱", type: "Sebze" },

  roka: { name: "Roka", emoji: "🌿", type: "Yeşillik" },
  "roka-bag": { name: "Roka Bağ", emoji: "🌿", type: "Yeşillik" },
  nane: { name: "Nane", emoji: "🌿", type: "Yeşillik" },
  maydanoz: { name: "Maydanoz", emoji: "🌿", type: "Yeşillik" },
  maydonoz: { name: "Maydonoz", emoji: "🌿", type: "Yeşillik" },
  dereotu: { name: "Dereotu", emoji: "🌿", type: "Yeşillik" },
  feslegen: { name: "Fesleğen", emoji: "🌿", type: "Yeşillik" },
  tere: { name: "Tere", emoji: "🌿", type: "Yeşillik" },
  "tere-bag": { name: "Tere Bağ", emoji: "🌿", type: "Yeşillik" },
  "tere-su": { name: "Tere Su", emoji: "🌿", type: "Yeşillik" },

  ceviz: { name: "Ceviz", emoji: "🥜", type: "Kuru Yemiş" },
  badem: { name: "Badem", emoji: "🥜", type: "Kuru Yemiş" },
  findik: { name: "Fındık", emoji: "🥜", type: "Kuru Yemiş" },
  "antep-fistigi": { name: "Antep Fıstığı", emoji: "🥜", type: "Kuru Yemiş" },
  zencefil: { name: "Zencefil", emoji: "🫚", type: "Sebze" },
};

function productFromSlug(slug?: string | null): ProductInfo {
  const safeSlug = String(slug || "").trim();

  if (!safeSlug) return { name: "Ürün", emoji: "🧺", type: "Ürün" };

  return (
    PRODUCT_MAP[safeSlug] ?? {
      name: safeSlug
        .split("-")
        .filter(Boolean)
        .map((x) => x.charAt(0).toLocaleUpperCase("tr-TR") + x.slice(1))
        .join(" "),
      emoji: "🧺",
      type: "Ürün",
    }
  );
}

function citySlug(city: string) {
  return city
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll(" ", "-")
    .trim();
}

function fmtNum(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR");
}

function priceText(item: Listing) {
  if (item.price_per_unit != null) {
    return `₺${fmtNum(item.price_per_unit)}${item.unit ? ` / ${item.unit}` : ""}`;
  }
  if (item.price != null) return `₺${fmtNum(item.price)}`;
  if (item.min_price != null && item.max_price != null) return `₺${fmtNum(item.min_price)} - ₺${fmtNum(item.max_price)}`;
  if (item.min_price != null) return `₺${fmtNum(item.min_price)} üzeri`;
  if (item.max_price != null) return `₺${fmtNum(item.max_price)} altı`;
  return "Fiyat sorunuz";
}

function locationText(item: Listing) {
  return [item.city, item.district, item.neighborhood].filter(Boolean).join(" / ");
}

function avgPrice(listings: Listing[]) {
  const prices = listings
    .map((x) => x.price_per_unit ?? x.price ?? null)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  if (!prices.length) return "—";

  const total = prices.reduce((a, b) => a + b, 0);
  return `₺${fmtNum(Math.round(total / prices.length))}`;
}
async function getListings(productName: string) {
  const { data, error } = await supabase
    .from("listings")
    .select(
      [
        "id",
        "title",
        "description",
        "product_name",
        "product_type",
        "city",
        "district",
        "neighborhood",
        "price",
        "price_per_unit",
        "min_price",
        "max_price",
        "unit",
        "quantity",
        "min_quantity",
        "media_urls",
        "media_types",
        "is_boosted",
        "is_featured",
        "vitrin_until",
        "boost_until",
        "verified_seller",
        "cold_chain",
        "transport_included",
        "packaging_type",
        "created_at",
        "published_at",
      ].join(",")
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(`product_name.ilike.%${productName}%,product_type.ilike.%${productName}%,title.ilike.%${productName}%`)
    .order("is_featured", { ascending: false })
    .order("is_boosted", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("urun listings error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as Listing[]) : [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";
  const product = productFromSlug(slug);

  const title = `${product.name} İlanları | Toptan ${product.name} Al Sat | HalApp`;
  const description = `${product.name} için güncel toptan ilanları, üretici, tüccar, hal ve ihracat ürünleri. ${product.name} fiyatları ve şehir bazlı pazar hareketleri HalApp'ta.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/urun/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/urun/${slug}`,
      siteName: "HalApp",
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductSeoPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";
  const product = productFromSlug(slug);
  const listings = await getListings(product.name);

  const cities = Array.from(
    new Set(
      listings
        .map((item) => item.city)
        .filter((city): city is string => Boolean(city))
    )
  ).slice(0, 10);

  const totalQuantity = listings.reduce((sum, item) => {
    const q = Number(item.quantity ?? 0);
    return Number.isFinite(q) ? sum + q : sum;
  }, 0);

  const boostedCount = listings.filter(
    (x) => x.is_boosted || x.boost_until
  ).length;

  const featuredCount = listings.filter(
    (x) => x.is_featured || x.vitrin_until
  ).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${product.name} İlanları`,
    description: `Toptan ${product.name} ilanları, üretici ve tüccar ürünleri.`,
    url: `${SITE_URL}/urun/${slug}`,
    mainEntity: listings.slice(0, 12).map((item) => ({
      "@type": "Product",
      name: item.title || `${product.name} İlanı`,
      description: item.description || `${product.name} toptan ürün ilanı`,
      image: item.media_urls?.[0] || undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: "TRY",
        price: item.price_per_unit || item.price || undefined,
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/pazar/${item.id}`,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pazar",
        item: `${SITE_URL}/pazar`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/urun/${slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white px-4 py-8 text-zinc-950 dark:from-black dark:via-emerald-950/10 dark:to-black dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[42px] border border-emerald-500/20 bg-white/85 p-8 shadow-[0_30px_120px_rgba(0,0,0,.08)] dark:bg-zinc-950/80">
          <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-140px] left-[-100px] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              HALAPP MARKET INTELLIGENCE
            </div>

            <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl">
              {product.emoji} Toptan {product.name} İlanları
            </h1>

            <p className="mt-4 max-w-4xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
              Güncel {product.name} ilanları, üretici ve tüccar ürünleri,
              şehir bazlı pazar hareketleri ve aktif ticaret fırsatları HalApp
              dijital toptancı halinde.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-5">
              <StatCard label="Aktif İlan" value={fmtNum(listings.length)} />
              <StatCard label="Ortalama Fiyat" value={avgPrice(listings)} />
              <StatCard label="Şehir" value={fmtNum(cities.length)} />
              <StatCard label="Vitrin" value={fmtNum(featuredCount)} />
              <StatCard label="Boost" value={fmtNum(boostedCount)} />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/create-listing?product=${encodeURIComponent(product.name)}`}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                {product.name} İlanı Ver →
              </Link>

              <Link
                href="/pazar"
                className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                Tüm Pazarı Gör
              </Link>

              <Link
                href="/market-intelligence"
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                Market Intelligence →
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                Güncel İlanlar
              </div>

              <h2 className="mt-2 text-3xl font-black">
                Toptan {product.name} Pazarındaki Son İlanlar
              </h2>
            </div>

            {listings.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {listings.map((item) => (
                  <ListingCard key={item.id} item={item} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-950">
                <div className="text-6xl">{product.emoji}</div>

                <h3 className="mt-4 text-2xl font-black">
                  Henüz {product.name} ilanı yok
                </h3>

                <p className="mt-2 text-sm font-semibold text-zinc-500">
                  Bu ürün için ilk ilanı sen oluşturabilir ve Google
                  aramalarında öne çıkabilirsin.
                </p>

                <Link
                  href={`/create-listing?product=${encodeURIComponent(product.name)}`}
                  className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white"
                >
                  {product.name} İlanı Oluştur →
                </Link>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
                SEO Pazar Bilgisi
              </div>

              <h3 className="mt-3 text-2xl font-black">
                {product.name} Pazarı
              </h3>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
                {product.name} için HalApp üzerinde üretici, komisyoncu,
                hal esnafı, tüccar ve ihracatçı ilanları takip edilebilir.
                Şehir bazlı ilanlar ve fiyat aralıkları pazar hareketini daha
                net görmeni sağlar.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <MiniInfo label="Toplam Miktar" value={fmtNum(totalQuantity)} />
                <MiniInfo label="Ürün Tipi" value={product.type} />
              </div>
            </div>

            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                Popüler Şehirler
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {cities.length ? (
                  cities.map((city) => (
                    <Link
                      key={city}
                      href={`/urun/${slug}/${citySlug(city)}`}
                      className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                    >
                      📍 {city} {product.name}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-zinc-500">
                    İlan geldikçe şehirler burada görünür.
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
                İlgili Sayfalar
              </div>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/blog"
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-black hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  📰 HalApp Blog
                </Link>

                <Link
                  href="/signals"
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-black hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  📡 Canlı Sinyaller
                </Link>

                <Link
                  href="/pazar"
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-black hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  🧺 Pazar
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-black uppercase tracking-wide text-zinc-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
}

function ListingCard({
  item,
  product,
}: {
  item: Listing;
  product: ProductInfo;
}) {
  const img = item.media_urls?.[0];
  const loc = locationText(item);

  return (
    <Link
      href={`/pazar/${item.id}`}
      className="group overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={item.title || `${product.name} ilanı`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {product.emoji}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {item.is_featured || item.vitrin_until ? (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
              👑 Vitrin
            </span>
          ) : null}

          {item.is_boosted || item.boost_until ? (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
              🚀 Boost
            </span>
          ) : null}

          {item.verified_seller ? (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300">
              ✅ Onaylı Satıcı
            </span>
          ) : null}

          {item.cold_chain ? (
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-700 dark:text-cyan-300">
              ❄️ Soğuk Zincir
            </span>
          ) : null}
        </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-black">
          {item.title || `${product.emoji} ${product.name} İlanı`}
        </h3>

        <div className="mt-2 text-sm font-semibold text-zinc-500">
          📍 {loc || "Türkiye"}
        </div>

        <div className="mt-4 text-3xl font-black text-emerald-600">
          {priceText(item)}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-zinc-500">
          {item.quantity ? (
            <span>
              📦 {fmtNum(item.quantity)} {item.unit || ""}
            </span>
          ) : null}

          {item.transport_included ? <span>🚚 Nakliye</span> : null}

          {item.packaging_type ? <span>📦 {item.packaging_type}</span> : null}
        </div>
      </div>
    </Link>
  );
}