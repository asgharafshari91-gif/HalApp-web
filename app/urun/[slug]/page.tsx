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
  params: Promise<{
    slug?: string;
  }>;
};

const SITE_URL = "https://halapp.app";

const PRODUCT_MAP: Record<string, ProductInfo> = {
  elma: { name: "Elma", emoji: "🍎", type: "Meyve" },
  armut: { name: "Armut", emoji: "🍐", type: "Meyve" },
  portakal: { name: "Portakal", emoji: "🍊", type: "Meyve" },
  mandalina: { name: "Mandalina", emoji: "🍊", type: "Meyve" },
  greyfurt: { name: "Greyfurt", emoji: "🍊", type: "Meyve" },
  limon: { name: "Limon", emoji: "🍋", type: "Meyve" },
  muz: { name: "Muz", emoji: "🍌", type: "Meyve" },
  karpuz: { name: "Karpuz", emoji: "🍉", type: "Meyve" },
  kavun: { name: "Kavun", emoji: "🍈", type: "Meyve" },
  uzum: { name: "Üzüm", emoji: "🍇", type: "Meyve" },
  cilek: { name: "Çilek", emoji: "🍓", type: "Meyve" },
  ahududu: { name: "Ahududu", emoji: "🫐", type: "Meyve" },
  bogurtlen: { name: "Böğürtlen", emoji: "🫐", type: "Meyve" },
  blueberry: { name: "Blueberry", emoji: "🫐", type: "Meyve" },
  "yaban-mersini": { name: "Yaban Mersini", emoji: "🫐", type: "Meyve" },
  kiraz: { name: "Kiraz", emoji: "🍒", type: "Meyve" },
  visne: { name: "Vişne", emoji: "🍒", type: "Meyve" },
  seftali: { name: "Şeftali", emoji: "🍑", type: "Meyve" },
  kayisi: { name: "Kayısı", emoji: "🍑", type: "Meyve" },
  nektarin: { name: "Nektarin", emoji: "🍑", type: "Meyve" },
  erik: { name: "Erik", emoji: "🟣", type: "Meyve" },
  nar: { name: "Nar", emoji: "🔴", type: "Meyve" },
  ayva: { name: "Ayva", emoji: "🍐", type: "Meyve" },
  incir: { name: "İncir", emoji: "🟣", type: "Meyve" },
  kivi: { name: "Kivi", emoji: "🥝", type: "Meyve" },
  ananas: { name: "Ananas", emoji: "🍍", type: "Meyve" },
  mango: { name: "Mango", emoji: "🥭", type: "Meyve" },
  avokado: { name: "Avokado", emoji: "🥑", type: "Meyve" },
  "hindistan-cevizi": { name: "Hindistan Cevizi", emoji: "🥥", type: "Meyve" },
  hurma: { name: "Hurma", emoji: "🌴", type: "Meyve" },
  dut: { name: "Dut", emoji: "🫐", type: "Meyve" },
  "altin-cilek": { name: "Altın Çilek", emoji: "🍓", type: "Meyve" },

  domates: { name: "Domates", emoji: "🍅", type: "Sebze" },
  biber: { name: "Biber", emoji: "🌶️", type: "Sebze" },
  patlican: { name: "Patlıcan", emoji: "🍆", type: "Sebze" },
  salatalik: { name: "Salatalık", emoji: "🥒", type: "Sebze" },
  hiyar: { name: "Hıyar", emoji: "🥒", type: "Sebze" },
  kabak: { name: "Kabak", emoji: "🎃", type: "Sebze" },
  patates: { name: "Patates", emoji: "🥔", type: "Sebze" },
  sogan: { name: "Soğan", emoji: "🧅", type: "Sebze" },
  sarimsak: { name: "Sarımsak", emoji: "🧄", type: "Sebze" },
  havuc: { name: "Havuç", emoji: "🥕", type: "Sebze" },
  turp: { name: "Turp", emoji: "🥕", type: "Sebze" },
  pancar: { name: "Pancar", emoji: "🥕", type: "Sebze" },
  brokoli: { name: "Brokoli", emoji: "🥦", type: "Sebze" },
  karnabahar: { name: "Karnabahar", emoji: "🥦", type: "Sebze" },
  lahana: { name: "Lahana", emoji: "🥬", type: "Sebze" },
  marul: { name: "Marul", emoji: "🥬", type: "Sebze" },
  ispanak: { name: "Ispanak", emoji: "🥬", type: "Sebze" },
  pazi: { name: "Pazı", emoji: "🥬", type: "Sebze" },
  kereviz: { name: "Kereviz", emoji: "🥬", type: "Sebze" },
  pirasa: { name: "Pırasa", emoji: "🥬", type: "Sebze" },
  enginar: { name: "Enginar", emoji: "🌿", type: "Sebze" },
  bamya: { name: "Bamya", emoji: "🌿", type: "Sebze" },
  fasulye: { name: "Fasulye", emoji: "🫛", type: "Sebze" },
  bezelye: { name: "Bezelye", emoji: "🫛", type: "Sebze" },
  bakla: { name: "Bakla", emoji: "🫛", type: "Sebze" },
  misir: { name: "Mısır", emoji: "🌽", type: "Sebze" },
  mantar: { name: "Mantar", emoji: "🍄", type: "Sebze" },
  kuskonmaz: { name: "Kuşkonmaz", emoji: "🌱", type: "Sebze" },

  roka: { name: "Roka", emoji: "🌿", type: "Yeşillik" },
  nane: { name: "Nane", emoji: "🌿", type: "Yeşillik" },
  maydanoz: { name: "Maydanoz", emoji: "🌿", type: "Yeşillik" },
  dereotu: { name: "Dereotu", emoji: "🌿", type: "Yeşillik" },
  feslegen: { name: "Fesleğen", emoji: "🌿", type: "Yeşillik" },
  tere: { name: "Tere", emoji: "🌿", type: "Yeşillik" },

  ceviz: { name: "Ceviz", emoji: "🥜", type: "Kuru Yemiş" },
  badem: { name: "Badem", emoji: "🥜", type: "Kuru Yemiş" },
  findik: { name: "Fındık", emoji: "🥜", type: "Kuru Yemiş" },
  "antep-fistigi": { name: "Antep Fıstığı", emoji: "🥜", type: "Kuru Yemiş" },
};

function productFromSlug(slug?: string | null): ProductInfo {
  const safeSlug = String(slug || "").trim();

  if (!safeSlug) {
    return {
      name: "Ürün",
      emoji: "🧺",
      type: "Ürün",
    };
  }

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

  if (item.min_price != null) return `₺${fmtNum(item.min_price)} üzeri`;
  if (item.max_price != null) return `₺${fmtNum(item.max_price)} altı`;

  return "Fiyat sorunuz";
}

function locationText(item: Listing) {
  return [item.city, item.district, item.neighborhood]
    .filter(Boolean)
    .join(" / ");
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
    .ilike("product_name", `%${productName}%`)
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

  const title = `${product.name} İlanları | Toptan ${product.name} Al Sat`;
  const description = `${product.name} için güncel toptan ilanları inceleyin. ${product.name} üretici, tüccar, hal ve ihracat ilanları HalApp dijital toptancı halinde.`;

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
  ).slice(0, 8);

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
        url: `${SITE_URL}/listing/${item.id}`,
      },
    })),
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
            HalApp Ürün Pazarı
          </div>

          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight">
            {product.emoji} {product.name} İlanları
          </h1>

          <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
            Toptan {product.name} alım-satım ilanları, üretici ve tüccar
            ürünleri HalApp dijital toptancı halinde. Güncel {product.name}{" "}
            ilanlarını inceleyin, satıcılarla doğrudan iletişime geçin.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard label="Aktif İlan" value={fmtNum(listings.length)} />
            <StatCard label="Ürün Tipi" value={product.type} />
            <StatCard label="Şehir" value={fmtNum(cities.length)} />
            <StatCard label="Platform" value="HalApp" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/create-listing?product=${encodeURIComponent(product.name)}`}
              className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
            >
              {product.name} İlanı Ver →
            </Link>

            <Link
              href="/listing"
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
              Toptan {product.name} İlanları
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
                Bu ürün için ilk ilanı sen oluşturabilir ve Google aramalarında
                öne çıkabilirsin.
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

            <h3 className="mt-3 text-2xl font-black">{product.name} Pazarı</h3>

            <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
              {product.name} için HalApp üzerinde üretici, komisyoncu, hal
              esnafı, tüccar ve ihracatçı ilanları takip edilebilir.
            </p>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
              Popüler Şehirler
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {cities.length ? (
                cities.map((city) => (
                  <span
                    key={city}
                    className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300"
                  >
                    📍 {city}
                  </span>
                ))
              ) : (
                <span className="text-sm font-semibold text-zinc-500">
                  İlan geldikçe şehirler burada görünür.
                </span>
              )}
            </div>
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

          {item.verified_seller ? (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300">
              ✅ Onaylı Satıcı
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

          {item.cold_chain ? <span>❄️ Soğuk Zincir</span> : null}
          {item.transport_included ? <span>🚚 Nakliye</span> : null}
        </div>
      </div>
    </Link>
  );
}