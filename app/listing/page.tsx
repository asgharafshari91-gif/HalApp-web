import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tüm İlanlar | HalApp",
  description:
    "HalApp üzerindeki güncel meyve, sebze ve tarım ilanlarını inceleyin.",
};

type ListingRow = {
  id: string;
  title: string | null;
  product_name: string | null;
  city: string | null;
  district: string | null;
  price: number | null;
  price_per_unit: number | null;
  unit: string | null;
  created_at: string | null;
  is_featured: boolean | null;
  is_boosted: boolean | null;
};

function fmtPrice(item: ListingRow) {
  const price = item.price_per_unit ?? item.price;

  if (price == null) return "Fiyat Sorunuz";

  return `${Number(price).toLocaleString("tr-TR")} ₺${
    item.unit ? ` / ${item.unit}` : ""
  }`;
}

async function getListings() {
  const { data, error } = await supabase
    .from("listings")
    .select(
      [
        "id",
        "title",
        "product_name",
        "city",
        "district",
        "price",
        "price_per_unit",
        "unit",
        "created_at",
        "is_featured",
        "is_boosted",
      ].join(",")
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("listing page error:", error.message);
    return [];
  }

  return Array.isArray(data) ? (data as unknown as ListingRow[]) : [];
}

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          HalApp İlan Pazarı
        </div>

        <h1 className="mt-4 text-4xl font-black">
          Tüm İlanlar
        </h1>

        <p className="mt-2 text-zinc-500">
          HalApp üzerindeki güncel meyve, sebze ve tarım ilanlarını inceleyin.
        </p>
      </div>

      {listings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              className="group rounded-3xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="mb-3 flex items-center gap-2">
                {item.is_featured ? (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
                    VİTRİN
                  </span>
                ) : null}

                {item.is_boosted ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    ÖNE ÇIKAN
                  </span>
                ) : null}
              </div>

              <h2 className="line-clamp-2 text-lg font-black">
                {item.title || item.product_name || "İlan"}
              </h2>

              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <div>📦 {item.product_name || "-"}</div>

                <div>
                  📍 {item.city || "Türkiye"}
                  {item.district ? ` / ${item.district}` : ""}
                </div>

                <div>💰 {fmtPrice(item)}</div>
              </div>

              <div className="mt-4 text-xs text-zinc-400">
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("tr-TR")
                  : ""}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-white/10">
          <h3 className="text-xl font-black">
            Henüz ilan bulunamadı
          </h3>

          <p className="mt-2 text-zinc-500">
            Aktif ilan bulunamadı.
          </p>
        </div>
      )}
    </main>
  );
}