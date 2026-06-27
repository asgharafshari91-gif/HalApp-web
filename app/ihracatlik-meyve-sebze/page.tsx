import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://halapp.app";

export const metadata: Metadata = {
  title: "İhracatlık Meyve Sebze İlanları | HalApp",
  description:
    "İhracata uygun meyve ve sebze ilanları. Soğuk zincir, paketleme, ihracat kalitesi ve toptan ürün fırsatlarını HalApp üzerinden keşfedin.",
  alternates: {
    canonical: `${SITE_URL}/ihracatlik-meyve-sebze`,
  },
  openGraph: {
    title: "İhracatlık Meyve Sebze İlanları | HalApp",
    description:
      "İhracata uygun meyve sebze ilanları, soğuk zincirli ürünler ve paketlemeye hazır partiler HalApp'te.",
    url: `${SITE_URL}/ihracatlik-meyve-sebze`,
    siteName: "HalApp",
    locale: "tr_TR",
    type: "website",
  },
};

type Listing = {
  id: string;
  title: string | null;
  product_name: string | null;
  city: string | null;
  district: string | null;
  price: number | null;
  price_per_unit: number | null;
  unit: string | null;
  media_urls: string[] | null;
  cold_chain: boolean | null;
  packaging_type: string | null;
  published_at: string | null;
};

type SeoArticle = {
  title: string | null;
  description: string | null;
  content: string | null;
};

function fmtNum(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR");
}

function priceText(item: Listing) {
  if (item.price_per_unit != null) {
    return `₺${fmtNum(item.price_per_unit)} / ${item.unit || "kg"}`;
  }

  if (item.price != null) return `₺${fmtNum(item.price)}`;

  return "Fiyat Sorunuz";
}

async function getListings() {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id,title,product_name,city,district,price,price_per_unit,unit,media_urls,cold_chain,packaging_type,published_at"
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("ihracatlik listings error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as Listing[]) : [];
}

async function getSeoArticle() {
  const { data, error } = await supabase
    .from("seo_articles")
    .select("title,description,content")
    .eq("slug", "ihracatlik-meyve-sebze")
    .maybeSingle();

  if (error) {
    console.error("ihracatlik seo article error:", error.message);
    return null;
  }

  return data as SeoArticle | null;
}

export default async function IhracatlikPage() {
  const [listings, article] = await Promise.all([
    getListings(),
    getSeoArticle(),
  ]);

  const coldChainCount = listings.filter((x) => x.cold_chain).length;
  const packagedCount = listings.filter((x) => x.packaging_type).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "İhracatlık Meyve Sebze İlanları",
    description:
      "İhracata uygun meyve sebze ilanları, soğuk zincirli ürünler ve paketlemeye hazır partiler.",
    url: `${SITE_URL}/ihracatlik-meyve-sebze`,
    mainEntity: listings.slice(0, 12).map((item) => ({
      "@type": "Product",
      name: item.title || item.product_name || "İhracatlık Ürün",
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white px-4 py-8 text-zinc-950 dark:from-black dark:via-blue-950/10 dark:to-black dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[42px] border border-blue-500/20 bg-white/85 p-8 shadow-[0_30px_120px_rgba(0,0,0,.08)] dark:bg-zinc-950/80">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-700 dark:text-blue-300">
              🌍 İhracatlık Ürünler
            </span>

            <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl">
              İhracatlık Meyve Sebze İlanları
            </h1>

            <p className="mt-4 max-w-4xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
              İhracat kalitesindeki meyve ve sebzeler, soğuk zincirli ürünler,
              paketlemeye hazır partiler ve toptan ticaret fırsatları HalApp
              dijital toptancı halinde.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <StatCard label="Aktif İlan" value={fmtNum(listings.length)} />
              <StatCard label="Soğuk Zincir" value={fmtNum(coldChainCount)} />
              <StatCard label="Paketli Ürün" value={fmtNum(packagedCount)} />
              <StatCard label="Platform" value="HalApp" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create-listing"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                İhracatlık İlan Ver →
              </Link>

              <Link
                href="/signals"
                className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                Talep Sinyalleri
              </Link>

              <Link
                href="/pazar"
                className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-6 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-500/20 dark:text-blue-300"
              >
                Pazarı Gör
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-5">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Güncel İlanlar
            </div>

            <h2 className="mt-2 text-3xl font-black">
              İhracata Uygun Son Ürünler
            </h2>
          </div>

          {listings.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-zinc-200 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-950">
              <div className="text-6xl">🌍</div>

              <h3 className="mt-4 text-2xl font-black">
                Henüz ihracatlık ürün ilanı yok
              </h3>

              <p className="mt-2 text-sm font-semibold text-zinc-500">
                İlk ihracatlık ürün ilanını oluşturarak Google aramalarında öne
                çıkabilirsin.
              </p>

              <Link
                href="/create-listing"
                className="mt-6 inline-flex rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white"
              >
                İlan Oluştur →
              </Link>
            </div>
          )}
        </section>

        {article ? (
          <section className="mt-12 rounded-[32px] border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-3xl font-black">
              {article.title || "İhracatlık Meyve Sebze Pazarı"}
            </h2>

            {article.description ? (
              <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/60">
                {article.description}
              </p>
            ) : null}

            <article className="mt-8 max-w-none space-y-4 text-sm font-semibold leading-8 text-zinc-700 dark:text-white/70">
              {String(article.content || "")
                .split("\n")
                .filter((line) => line.trim())
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </article>
          </section>
        ) : null}
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
  const loc = [item.city, item.district].filter(Boolean).join(" / ");

  return (
    <Link
      href={`/pazar/${item.id}`}
      className="group overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {img ? (
          <img
            src={img}
            alt={item.title || "İhracatlık ürün ilanı"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            🌍
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-xl font-black">
          {item.title || `${item.product_name || "İhracatlık Ürün"} İlanı`}
        </h3>

        <div className="mt-2 text-sm font-semibold text-zinc-500">
          📍 {loc || "Türkiye"}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {item.cold_chain ? (
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-700 dark:text-cyan-300">
              ❄️ Soğuk Zincir
            </span>
          ) : null}

          {item.packaging_type ? (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
              📦 {item.packaging_type}
            </span>
          ) : null}
        </div>

        <div className="mt-4 text-3xl font-black text-emerald-600">
          {priceText(item)}
        </div>
      </div>
    </Link>
  );
}