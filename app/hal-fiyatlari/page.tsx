import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://halapp.app";

export const metadata: Metadata = {
  title: "Türkiye Güncel Hal Fiyatları | Meyve Sebze Fiyatları | HalApp",
  description:
    "Türkiye güncel hal fiyatları, toptan meyve sebze fiyatları ve şehir bazlı pazar ilanları HalApp dijital toptancı halinde.",
  alternates: { canonical: `${SITE_URL}/hal-fiyatlari` },
  openGraph: {
    title: "Türkiye Güncel Hal Fiyatları | HalApp",
    description: "Güncel toptan meyve sebze fiyatlarını ve ilanları HalApp üzerinden takip edin.",
    url: `${SITE_URL}/hal-fiyatlari`,
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
  packaging_type: string | null;
  published_at: string | null;
};

function fmtNum(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR");
}

function priceText(item: Listing) {
  if (item.price_per_unit != null) return `₺${fmtNum(item.price_per_unit)}${item.unit ? ` / ${item.unit}` : ""}`;
  if (item.price != null) return `₺${fmtNum(item.price)}`;
  if (item.min_price != null && item.max_price != null) return `₺${fmtNum(item.min_price)} - ₺${fmtNum(item.max_price)}`;
  if (item.min_price != null) return `₺${fmtNum(item.min_price)} üzeri`;
  if (item.max_price != null) return `₺${fmtNum(item.max_price)} altı`;
  return "Fiyat sorunuz";
}

function avgPrice(listings: Listing[]) {
  const prices = listings
    .map((x) => x.price_per_unit ?? x.price ?? null)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  if (!prices.length) return "—";
  return `₺${fmtNum(Math.round(prices.reduce((a, b) => a + b, 0) / prices.length))}`;
}

async function getListings() {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id,title,product_name,city,district,price,price_per_unit,min_price,max_price,unit,quantity,media_urls,is_boosted,is_featured,vitrin_until,boost_until,verified_seller,cold_chain,transport_included,packaging_type,published_at"
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("hal fiyatlari page error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as Listing[]) : [];
}

export default async function HalFiyatlariPage() {
  const listings = await getListings();

  const products = Array.from(
    new Set(listings.map((x) => x.product_name).filter((x): x is string => Boolean(x)))
  ).slice(0, 14);

  const cities = Array.from(
    new Set(listings.map((x) => x.city).filter((x): x is string => Boolean(x)))
  ).slice(0, 14);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Türkiye Güncel Hal Fiyatları",
    description: "Güncel toptan meyve sebze fiyatları ve hal ilanları.",
    url: `${SITE_URL}/hal-fiyatlari`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white px-4 py-8 text-zinc-950 dark:from-black dark:via-emerald-950/10 dark:to-black dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[42px] border border-emerald-500/20 bg-white/85 p-8 shadow-[0_30px_120px_rgba(0,0,0,.08)] dark:bg-zinc-950/80">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              GÜNCEL HAL FİYATLARI
            </div>
            <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl">
              Türkiye Güncel Hal Fiyatları
            </h1>
            <p className="mt-4 max-w-4xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
              Toptan meyve sebze fiyatlarını, şehir bazlı ilanları ve aktif pazar hareketlerini HalApp üzerinden takip edin.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <StatCard label="Aktif İlan" value={fmtNum(listings.length)} />
              <StatCard label="Ortalama Fiyat" value={avgPrice(listings)} />
              <StatCard label="Ürün" value={fmtNum(products.length)} />
              <StatCard label="Şehir" value={fmtNum(cities.length)} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pazar" className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white hover:bg-emerald-600">
                Güncel İlanları Gör →
              </Link>
              <Link href="/signals" className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                Canlı Sinyaller
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="text-3xl font-black">Son Fiyatlı İlanlar</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {listings.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <InfoBox title="Popüler Ürünler" items={products.map((x) => `🧺 ${x}`)} />
            <InfoBox title="Aktif Şehirler" items={cities.map((x) => `📍 ${x}`)} />
          </aside>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length ? items.map((x) => (
          <span key={x} className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
            {x}
          </span>
        )) : <span className="text-sm font-semibold text-zinc-500">Veri geldikçe burada görünür.</span>}
      </div>
    </div>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const img = item.media_urls?.[0];
  const loc = [item.city, item.district].filter(Boolean).join(" / ");

  return (
    <Link href={`/pazar/${item.id}`} className="group overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950">
      <div className="h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {img ? <img src={img} alt={item.title || "Hal fiyatı"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-6xl">📊</div>}
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 text-xl font-black">{item.title || `${item.product_name || "Ürün"} İlanı`}</h3>
        <div className="mt-2 text-sm font-semibold text-zinc-500">📍 {loc || "Türkiye"}</div>
        <div className="mt-4 text-3xl font-black text-emerald-600">{priceText(item)}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-zinc-500">
          {item.quantity ? <span>📦 {fmtNum(item.quantity)} {item.unit || ""}</span> : null}
          {item.is_boosted || item.boost_until ? <span>🚀 Boost</span> : null}
          {item.is_featured || item.vitrin_until ? <span>👑 Vitrin</span> : null}
        </div>
      </div>
    </Link>
  );
}