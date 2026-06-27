import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://halapp.app";

export const metadata: Metadata = {
  title: "Meyve Sebze İlanları | Toptan Meyve Sebze Pazarı | HalApp",
  description:
    "Türkiye'nin dijital toptancı hali. Güncel meyve sebze ilanları, üreticiler, tüccarlar ve ihracatçılar HalApp'te.",
};

async function getListings() {
  const { data } = await supabase
    .from("listings")
    .select(
      "id,title,product_name,city,district,price,price_per_unit,unit,media_urls,published_at"
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(100);

  return data || [];
}

export default async function MeyveSebzePage() {
  const listings = await getListings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Meyve Sebze İlanları",
    url: `${SITE_URL}/meyve-sebze-ilanlari`,
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-[40px] border p-8">
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">
            🧺 DİJİTAL TOPTANCI HALİ
          </span>

          <h1 className="mt-5 text-5xl font-black">
            Meyve Sebze İlanları
          </h1>

          <p className="mt-4 text-lg text-zinc-600">
            Türkiye'nin dört bir yanından üretici, tüccar ve ihracatçıların
            yayınladığı güncel meyve sebze ilanları.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/create-listing"
              className="rounded-2xl bg-emerald-500 px-6 py-3 font-black text-white"
            >
              İlan Ver →
            </Link>

            <Link
              href="/pazar"
              className="rounded-2xl border px-6 py-3 font-black"
            >
              Pazarı Gör
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((item: any) => (
            <Link
              key={item.id}
              href={`/pazar/${item.id}`}
              className="overflow-hidden rounded-[30px] border bg-white shadow-sm hover:shadow-lg"
            >
              <div className="h-52 bg-zinc-100">
                {item.media_urls?.[0] ? (
                  <img
                    src={item.media_urls[0]}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">
                    🧺
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="line-clamp-2 text-xl font-black">
                  {item.title}
                </h2>

                <div className="mt-2 text-sm text-zinc-500">
                  📍 {item.city} {item.district ? `/ ${item.district}` : ""}
                </div>

                <div className="mt-4 text-3xl font-black text-emerald-600">
                  {item.price_per_unit
                    ? `₺${item.price_per_unit}/${item.unit || "kg"}`
                    : item.price
                    ? `₺${item.price}`
                    : "Fiyat Sorunuz"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}