import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const metadata = {
  title: "HalApp Blog | Tarım, Hal ve Pazar Analizleri",
  description:
    "Türkiye hal piyasası, ürün talepleri, şehir raporları ve Market Intelligence analizleri.",
};

type SeoArticle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  city: string | null;
  product: string | null;
  cover_image: string | null;
  views: number | null;
  created_at: string | null;
};

function fmtDate(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getArticles() {
  const { data, error } = await supabase
    .from("seo_articles")
    .select("id,slug,title,description,city,product,cover_image,views,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("seo_articles error:", error.message);
    return [];
  }

  return (data ?? []) as SeoArticle[];
}

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-[42px] border border-black/10 bg-white/85 p-6 shadow-[0_30px_120px_rgba(0,0,0,.08)] dark:border-white/10 dark:bg-white/[0.045] sm:p-10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-200">
            HALAPP MARKET INTELLIGENCE
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
            HalApp Blog
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60 sm:text-lg">
            Türkiye hal piyasası, şehir bazlı ürün talepleri, fiyat hareketleri
            ve canlı pazar analizleri.
          </p>
        </div>
      </section>

      <section className="mt-8">
        {articles.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-black/10 bg-white/80 p-10 text-center dark:border-white/10 dark:bg-white/[0.045]">
            <div className="text-5xl">📰</div>
            <h2 className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
              Henüz makale yok
            </h2>
            <p className="mt-2 text-sm font-semibold text-zinc-500">
              seo_articles tablosuna içerik eklenince burada görünecek.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="group overflow-hidden rounded-[32px] border border-black/10 bg-white/85 shadow-[0_20px_80px_rgba(0,0,0,.055)] transition hover:-translate-y-1 hover:shadow-[0_30px_100px_rgba(0,0,0,.09)] dark:border-white/10 dark:bg-white/[0.045]"
              >
                <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-emerald-950 via-zinc-950 to-black">
                  {a.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.cover_image}
                      alt={a.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">📊</div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {a.city ? (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
                        📍 {a.city}
                      </span>
                    ) : null}

                    {a.product ? (
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black text-orange-700 dark:text-orange-200">
                        🧺 {a.product}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-4 line-clamp-2 text-xl font-black text-zinc-950 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                    {a.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                    {a.description || "HalApp Market Intelligence analizi."}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs font-black text-zinc-500">
                    <span>{fmtDate(a.created_at)}</span>
                    <span>👁️ {a.views ?? 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}