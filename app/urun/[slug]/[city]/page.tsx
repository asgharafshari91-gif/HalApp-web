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

type ProductInfo = {
  name: string;
  emoji: string;
  type: string;
};

type PageProps = {
  params: {
    slug: string;
    city: string;
  };
};

const PRODUCT_MAP: Record<string, ProductInfo> = {
  elma: { name: "Elma", emoji: "🍎", type: "Meyve" },
  armut: { name: "Armut", emoji: "🍐", type: "Meyve" },
  portakal: { name: "Portakal", emoji: "🍊", type: "Meyve" },
  mandalina: { name: "Mandalina", emoji: "🍊", type: "Meyve" },
  limon: { name: "Limon", emoji: "🍋", type: "Meyve" },
  muz: { name: "Muz", emoji: "🍌", type: "Meyve" },
  karpuz: { name: "Karpuz", emoji: "🍉", type: "Meyve" },
  kavun: { name: "Kavun", emoji: "🍈", type: "Meyve" },
  uzum: { name: "Üzüm", emoji: "🍇", type: "Meyve" },
  cilek: { name: "Çilek", emoji: "🍓", type: "Meyve" },
  kiraz: { name: "Kiraz", emoji: "🍒", type: "Meyve" },
  seftali: { name: "Şeftali", emoji: "🍑", type: "Meyve" },
  kayisi: { name: "Kayısı", emoji: "🍑", type: "Meyve" },
  erik: { name: "Erik", emoji: "🟣", type: "Meyve" },
  nar: { name: "Nar", emoji: "🔴", type: "Meyve" },
  incir: { name: "İncir", emoji: "🟣", type: "Meyve" },
  kivi: { name: "Kivi", emoji: "🥝", type: "Meyve" },
  ananas: { name: "Ananas", emoji: "🍍", type: "Meyve" },
  mango: { name: "Mango", emoji: "🥭", type: "Meyve" },
  avokado: { name: "Avokado", emoji: "🥑", type: "Meyve" },

  domates: { name: "Domates", emoji: "🍅", type: "Sebze" },
  biber: { name: "Biber", emoji: "🌶️", type: "Sebze" },
  patlican: { name: "Patlıcan", emoji: "🍆", type: "Sebze" },
  salatalik: { name: "Salatalık", emoji: "🥒", type: "Sebze" },
  kabak: { name: "Kabak", emoji: "🎃", type: "Sebze" },
  patates: { name: "Patates", emoji: "🥔", type: "Sebze" },
  sogan: { name: "Soğan", emoji: "🧅", type: "Sebze" },
  sarimsak: { name: "Sarımsak", emoji: "🧄", type: "Sebze" },
  havuc: { name: "Havuç", emoji: "🥕", type: "Sebze" },
  brokoli: { name: "Brokoli", emoji: "🥦", type: "Sebze" },
  lahana: { name: "Lahana", emoji: "🥬", type: "Sebze" },
  marul: { name: "Marul", emoji: "🥬", type: "Sebze" },
  ispanak: { name: "Ispanak", emoji: "🥬", type: "Sebze" },
  mantar: { name: "Mantar", emoji: "🍄", type: "Sebze" },
  kuskonmaz: { name: "Kuşkonmaz", emoji: "🌱", type: "Sebze" },
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

function productFromSlug(slug: string): ProductInfo {
  return (
    PRODUCT_MAP[slug] ?? {
      name: slug
        .split("-")
        .map((x) => x.charAt(0).toLocaleUpperCase("tr-TR") + x.slice(1))
        .join(" "),
      emoji: "🧺",
      type: "Ürün",
    }
  );
}

function cityFromSlug(slug: string) {
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

async function getProductCityListings(productName: string, cityName: string) {
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
    .ilike("product_name", `%${productName}%`)
    .ilike("city", `%${cityName}%`)
    .order("is_featured", { ascending: false })
    .order("is_boosted", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("product city listings error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as Listing[]) : [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = productFromSlug(params.slug);
  const cityName = cityFromSlug(params.city);

  const title = `${cityName} ${product.name} İlanları | Toptan ${product.name}`;
  const description = `${cityName} ${product.name} ilanları, toptan ${product.name} alım-satım, üretici ve tüccar ilanları HalApp dijital toptancı halinde.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/urun/${params.slug}/${params.city}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/urun/${params.slug}/${params.city}`,
      siteName: "HalApp",
      locale: "tr_TR",
      type: "website",
    },
  };
}

export default async function ProductCitySeoPage({ params }: PageProps) {
  const product = productFromSlug(params.slug);
  const cityName = cityFromSlug(params.city);
  const listings = await getProductCityListings(product.name, cityName);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cityName} ${product.name} İlanları`,
    description: `${cityName} bölgesinde toptan ${product.name} ilanları.`,
    url: `${SITE_URL}/urun/${params.slug}/${params.city}`,
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
            Ürün + Şehir Pazarı
          </div>

          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight">
            {product.emoji} {cityName} {product.name} İlanları
          </h1>

          <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
            {cityName} bölgesinde toptan {product.name} ilanları, üretici ve
            tüccar ürünleri HalApp dijital toptancı halinde. Güncel ilanları
            inceleyin, satıcılarla doğrudan iletişime geçin.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard label="Aktif İlan" value={fmtNum(listings.length)} />
            <StatCard label="Ürün" value={product.name} />
            <StatCard label="Şehir" value={cityName} />
            <StatCard label="Platform" value="HalApp" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/create-listing?product=${encodeURIComponent(
                product.name
              )}&city=${encodeURIComponent(cityName)}`}
              className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
            >
              {cityName} {product.name} İlanı Ver →
            </Link>

            <Link
              href={`/urun/${params.slug}`}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              Tüm {product.name} İlanları
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8">
        {listings.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <ListingCard key={item.id} item={item} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-950">
            <div className="text-6xl">{product.emoji}</div>

            <h3 className="mt-4 text-2xl font-black">
              Henüz {cityName} {product.name} ilanı yok
            </h3>

            <p className="mt-2 text-sm font-semibold text-zinc-500">
              Bu şehir ve ürün için ilk ilanı sen oluşturabilir, Google
              aramalarında öne çıkabilirsin.
            </p>

            <Link
              href={`/create-listing?product=${encodeURIComponent(
                product.name
              )}&city=${encodeURIComponent(cityName)}`}
              className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white"
            >
              İlan Oluştur →
            </Link>
          </div>
        )}
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

function ListingCard({
  item,
  product,
}: {
  item: Listing;
  product: ProductInfo;
}) {
  const img = item.media_urls?.[0];

  return (
    <Link
      href={`/listing/${item.id}`}
      className="group overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {img ? (
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
        </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-black">
          {item.title || `${product.name} İlanı`}
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