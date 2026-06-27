import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://halapp.app";

export const metadata: Metadata = {
  title: "Üreticiden Satılık Meyve ve Sebze İlanları | HalApp",
  description:
    "Üreticiden satılık toptan meyve ve sebze ilanları. Çiftçi, üretici, hal esnafı ve tüccar ilanlarını HalApp üzerinden inceleyin.",
  alternates: { canonical: `${SITE_URL}/ureticiden-satilik` },
  openGraph: {
    title: "Üreticiden Satılık Meyve ve Sebze İlanları | HalApp",
    description:
      "Üreticiden satılık toptan meyve ve sebze ilanları HalApp dijital toptancı halinde.",
    url: `${SITE_URL}/ureticiden-satilik`,
    siteName: "HalApp",
    locale: "tr_TR",
    type: "website",
  },
};

type Listing = {
  id: string;
  title: string | null;
  description: string | null;
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
  if (item.price_per_unit != null) {
    return `₺${fmtNum(item.price_per_unit)}${item.unit ? ` / ${item.unit}` : ""}`;
  }
  if (item.price != null) return `₺${fmtNum(item.price)}`;
  if (item.min_price != null && item.max_price != null) return `₺${fmtNum(item.min_price)} - ₺${fmtNum(item.max_price)}`;
  if (item.min_price != null) return `₺${fmtNum(item.min_price)} üzeri`;
  if (item.max_price != null) return `₺${fmtNum(item.max_price)} altı`;
  return "Fiyat sorunuz";
}

async function getListings() {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id,title,description,product_name,city,district,price,price_per_unit,min_price,max_price,unit,quantity,media_urls,is_boosted,is_featured,vitrin_until,boost_until,verified_seller,cold_chain,transport_included,packaging_type,published_at"
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("is_boosted", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("ureticiden sitemap page error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as Listing[]) : [];
}

export default async function UreticidenSatilikPage() {
  const listings = await getListings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Üreticiden Satılık Meyve ve Sebze İlanları",
    description: "Üreticiden satılık toptan meyve ve sebze ilanları.",
    url: `${SITE_URL}/ureticiden-satilik`,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white px-4 py-8 text-zinc-950 dark:from-black dark:via-emerald-950/10 dark:to-black dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="mx-auto max-w-7xl">
        <Hero
          badge="ÜRETİCİDEN SATILIK"
          title="Üreticiden Satılık Meyve ve Sebze İlanları"
          description="Çiftçi, üretici, hal esnafı ve tüccarların yayınladığı güncel toptan meyve sebze ilanlarını inceleyin. HalApp ile üreticiden doğrudan ticaret fırsatlarını yakalayın."
          cta="Üretici İlanı Ver →"
          href="/create-listing"
          count={listings.length}
        />

        <ContentIntro
          title="Üreticiden Doğrudan Alım Satım"
          text="HalApp, üretici ile alıcıyı dijital toptancı halinde buluşturur. Ürün, şehir, fiyat, miktar ve teslimat bilgilerini tek ekranda görerek satıcıyla doğrudan iletişime geçebilirsin."
        />

        <ListingGrid listings={listings} emptyTitle="Henüz üreticiden satılık ilan bulunamadı." />
      </section>
    </main>
  );
}

function Hero({ badge, title, description, cta, href, count }: any) {
  return (
    <div className="relative overflow-hidden rounded-[42px] border border-emerald-500/20 bg-white/85 p-8 shadow-[0_30px_120px_rgba(0,0,0,.08)] dark:bg-zinc-950/80">
      <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="relative z-10">
        <div className="inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
          {badge}
        </div>
        <h1 className="mt-5 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-4 max-w-4xl text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">{description}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Aktif İlan" value={fmtNum(count)} />
          <StatCard label="Platform" value="HalApp" />
          <StatCard label="Ticaret Tipi" value="Toptan" />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={href} className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white hover:bg-emerald-600">
            {cta}
          </Link>
          <Link href="/pazar" className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
            Pazara Git
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContentIntro({ title, text }: { title: string; text: string }) {
  return (
    <section className="mt-8 rounded-[32px] border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
      <h2 className="text-3xl font-black">{title}</h2>
      <p className="mt-3 max-w-4xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60">{text}</p>
    </section>
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

function ListingGrid({ listings, emptyTitle }: { listings: Listing[]; emptyTitle: string }) {
  if (!listings.length) {
    return (
      <div className="mt-8 rounded-[32px] border border-zinc-200 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-950">
        <div className="text-6xl">🧺</div>
        <h3 className="mt-4 text-2xl font-black">{emptyTitle}</h3>
        <Link href="/create-listing" className="mt-6 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-white">
          İlk İlanı Oluştur →
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((item) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </section>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const img = item.media_urls?.[0];
  const loc = [item.city, item.district].filter(Boolean).join(" / ");

  return (
    <Link href={`/pazar/${item.id}`} className="group overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950">
      <div className="h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {img ? (
          <img src={img} alt={item.title || "HalApp ilanı"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🧺</div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {item.is_featured || item.vitrin_until ? <Badge>👑 Vitrin</Badge> : null}
          {item.is_boosted || item.boost_until ? <Badge>🚀 Boost</Badge> : null}
          {item.verified_seller ? <Badge>✅ Onaylı</Badge> : null}
        </div>
        <h3 className="mt-4 line-clamp-2 text-xl font-black">{item.title || "Toptan Ürün İlanı"}</h3>
        <div className="mt-2 text-sm font-semibold text-zinc-500">📍 {loc || "Türkiye"}</div>
        <div className="mt-4 text-3xl font-black text-emerald-600">{priceText(item)}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-zinc-500">
          {item.quantity ? <span>📦 {fmtNum(item.quantity)} {item.unit || ""}</span> : null}
          {item.cold_chain ? <span>❄️ Soğuk Zincir</span> : null}
          {item.transport_included ? <span>🚚 Nakliye</span> : null}
          {item.packaging_type ? <span>📦 {item.packaging_type}</span> : null}
        </div>
      </div>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">{children}</span>;
}