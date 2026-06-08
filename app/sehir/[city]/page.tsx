import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://halapp.app";

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
  media_urls: string[] | null;
  is_boosted: boolean | null;
  is_featured: boolean | null;
  vitrin_until: string | null;
  boost_until: string | null;
  verified_seller: boolean | null;
  cold_chain: boolean | null;
  transport_included: boolean | null;
  published_at: string | null;
};

type PageProps = {
  params: {
    city: string;
  };
};

const CITY_NAMES: Record<string, string> = {
  adana: "Adana",
  adiyaman: "Adıyaman",
  afyonkarahisar: "Afyonkarahisar",
  agri: "Ağrı",
  amasya: "Amasya",
  ankara: "Ankara",
  antalya: "Antalya",
  artvin: "Artvin",
  aydin: "Aydın",
  balikesir: "Balıkesir",
  bilecik: "Bilecik",
  bingol: "Bingöl",
  bitlis: "Bitlis",
  bolu: "Bolu",
  burdur: "Burdur",
  bursa: "Bursa",
  canakkale: "Çanakkale",
  cankiri: "Çankırı",
  corum: "Çorum",
  denizli: "Denizli",
  diyarbakir: "Diyarbakır",
  edirne: "Edirne",
  elazig: "Elazığ",
  erzincan: "Erzincan",
  erzurum: "Erzurum",
  eskisehir: "Eskişehir",
  gaziantep: "Gaziantep",
  giresun: "Giresun",
  gumushane: "Gümüşhane",
  hakkari: "Hakkari",
  hatay: "Hatay",
  isparta: "Isparta",
  mersin: "Mersin",
  istanbul: "İstanbul",
  izmir: "İzmir",
  kars: "Kars",
  kastamonu: "Kastamonu",
  kayseri: "Kayseri",
  kirklareli: "Kırklareli",
  kirsehir: "Kırşehir",
  kocaeli: "Kocaeli",
  konya: "Konya",
  kutahya: "Kütahya",
  malatya: "Malatya",
  manisa: "Manisa",
  kahramanmaras: "Kahramanmaraş",
  mardin: "Mardin",
  mugla: "Muğla",
  mus: "Muş",
  nevsehir: "Nevşehir",
  nigde: "Niğde",
  ordu: "Ordu",
  rize: "Rize",
  sakarya: "Sakarya",
  samsun: "Samsun",
  siirt: "Siirt",
  sinop: "Sinop",
  sivas: "Sivas",
  tekirdag: "Tekirdağ",
  tokat: "Tokat",
  trabzon: "Trabzon",
  tunceli: "Tunceli",
  sanliurfa: "Şanlıurfa",
  usak: "Uşak",
  van: "Van",
  yozgat: "Yozgat",
  zonguldak: "Zonguldak",
  aksaray: "Aksaray",
  bayburt: "Bayburt",
  karaman: "Karaman",
  kirikkale: "Kırıkkale",
  batman: "Batman",
  sirnak: "Şırnak",
  bartin: "Bartın",
  ardahan: "Ardahan",
  igdir: "Iğdır",
  yalova: "Yalova",
  karabuk: "Karabük",
  kilis: "Kilis",
  osmaniye: "Osmaniye",
  duzce: "Düzce",
};

function titleCaseSlug(slug: string) {
  return (
    CITY_NAMES[slug] ||
    slug
      .split("-")
      .map((x) => x.charAt(0).toLocaleUpperCase("tr-TR") + x.slice(1))
      .join(" ")
  );
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

  if (item.min_price != null && item.max_price != null) {
    return `₺${fmtNum(item.min_price)} - ₺${fmtNum(item.max_price)}`;
  }

  return "Fiyat sorunuz";
}

function productSlug(name?: string | null) {
  return String(name || "")
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

async function getCityListings(cityName: string) {
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
        "media_urls",
        "is_boosted",
        "is_featured",
        "vitrin_until",
        "boost_until",
        "verified_seller",
        "cold_chain",
        "transport_included",
        "published_at",
      ].join(",")
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .ilike("city", `%${cityName}%`)
    .order("is_featured", { ascending: false })
    .order("is_boosted", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("city listings error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as Listing[]) : [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const cityName = titleCaseSlug(params.city);

  const title = `${cityName} Hal İlanları | ${cityName} Meyve Sebze Pazarı`;
  const description = `${cityName} hal ilanları, toptan meyve sebze ürünleri, üretici ve tüccar ilanları HalApp dijital toptancı halinde.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/sehir/${params.city}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/sehir/${params.city}`,
      siteName: "HalApp",
      locale: "tr_TR",
      type: "website",
    },
  };
}

export default async function CitySeoPage({ params }: PageProps) {
  const cityName = titleCaseSlug(params.city);
  const listings = await getCityListings(cityName);

  const products = Array.from(
    new Set(
      listings
        .map((x) => x.product_name || x.product_type)
        .filter((x): x is string => Boolean(x))
    )
  ).slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cityName} Hal İlanları`,
    description: `${cityName} meyve sebze ve tarım ürünleri ilanları.`,
    url: `${SITE_URL}/sehir/${params.city}`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white text-zinc-950 dark:from-black dark:via-emerald-950/10 dark:to-black dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden rounded-[40px] border border-emerald-500/20 bg-white/80 p-8 shadow-sm dark:bg-zinc-950/80">
        <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
            HalApp Şehir Pazarı
          </div>

          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight">
            📍 {cityName} Hal İlanları
          </h1>

          <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
            {cityName} bölgesindeki toptan meyve sebze ilanlarını, üretici ve
            tüccar ürünlerini HalApp üzerinden takip edin. Güncel ilanlara
            ulaşın, satıcılarla doğrudan iletişime geçin.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard label="Aktif İlan" value={fmtNum(listings.length)} />
            <StatCard label="Popüler Ürün" value={products[0] || "Ürün"} />
            <StatCard label="Şehir" value={cityName} />
            <StatCard label="Platform" value="HalApp" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/create-listing?city=${encodeURIComponent(cityName)}`}
              className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
            >
              {cityName} İlanı Ver →
            </Link>

            <Link
              href="/listings"
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              Tüm İlanları Gör
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
              Güncel İlanlar
            </div>

            <h2 className="mt-2 text-3xl font-black">
              {cityName} Toptan Meyve Sebze İlanları
            </h2>
          </div>

          {listings.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {listings.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyCity cityName={cityName} />
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
              Popüler Ürünler
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {products.length ? (
                products.map((product) => (
                  <Link
                    key={product}
                    href={`/urun/${productSlug(product)}/${params.city}`}
                    className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300"
                  >
                    {product}
                  </Link>
                ))
              ) : (
                <span className="text-sm font-semibold text-zinc-500">
                  İlan geldikçe ürünler burada görünür.
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
              Satıcı mısın?
            </div>

            <h3 className="mt-3 text-2xl font-black">
              {cityName} pazarında öne çık
            </h3>

            <p className="mt-3 text-sm font-semibold text-zinc-600 dark:text-white/60">
              İlanını vitrine çıkararak {cityName} bölgesindeki alıcılara daha
              hızlı ulaşabilirsin.
            </p>

            <Link
              href="/create-listing"
              className="mt-5 inline-flex rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-zinc-950"
            >
              İlan Ver →
            </Link>
          </div>
        </aside>
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

function ListingCard({ item }: { item: Listing }) {
  const img = item.media_urls?.[0];
  const product = item.product_name || item.product_type || "Ürün";

  return (
    <Link
      href={`/listing/${item.id}`}
      className="group overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {img ? (
          <img
            src={img}
            alt={item.title || `${product} ilanı`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            🧺
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
        </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-black">
          {item.title || `${product} İlanı`}
        </h3>

        <div className="mt-2 text-sm font-semibold text-zinc-500">
          📍 {[item.city, item.district].filter(Boolean).join(" / ") ||
            "Türkiye"}
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

          {item.cold_chain ? <span>❄️ Soğuk Zincir</span> : null}
          {item.transport_included ? <span>🚚 Nakliye</span> : null}
        </div>
      </div>
    </Link>
  );
}

function EmptyCity({ cityName }: { cityName: string }) {
  return (
    <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-950">
      <div className="text-6xl">📍</div>

      <h3 className="mt-4 text-2xl font-black">
        Henüz {cityName} ilanı yok
      </h3>

      <p className="mt-2 text-sm font-semibold text-zinc-500">
        Bu şehirde ilk ilanı sen oluşturabilir ve Google aramalarında öne
        çıkabilirsin.
      </p>

      <Link
        href={`/create-listing?city=${encodeURIComponent(cityName)}`}
        className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white"
      >
        {cityName} İlanı Oluştur →
      </Link>
    </div>
  );
}