import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type SeoArticle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  city: string | null;
  product: string | null;
  cover_image: string | null;
  views: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function fmtDate(v?: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getArticle(slug: string) {
  const { data, error } = await supabase
    .from("seo_articles")
    .select(
      "id,slug,title,description,content,city,product,cover_image,views,created_at,updated_at"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as SeoArticle;
}

async function bumpArticleView(id: string, currentViews?: number | null) {
  await supabase
    .from("seo_articles")
    .update({ views: Number(currentViews ?? 0) + 1 })
    .eq("id", id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "HalApp Blog",
      description: "HalApp Market Intelligence analizleri.",
    };
  }

  return {
    title: `${article.title} | HalApp Blog`,
    description:
      article.description ??
      "Türkiye hal piyasası, ürün talepleri ve şehir bazlı pazar analizleri.",
    openGraph: {
      title: article.title,
      description: article.description ?? undefined,
      images: article.cover_image ? [article.cover_image] : undefined,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  await bumpArticleView(article.id, article.views);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        href="/blog"
        className="inline-flex rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-800 hover:bg-black/5 dark:border-white/10 dark:bg-white/[0.045] dark:text-white"
      >
        ← Bloga Dön
      </Link>

      <article className="mt-6 overflow-hidden rounded-[42px] border border-black/10 bg-white/90 shadow-[0_30px_120px_rgba(0,0,0,.08)] dark:border-white/10 dark:bg-white/[0.045]">
        <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-emerald-950 via-zinc-950 to-black">
          {article.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-7xl">📊</div>
          )}
        </div>

        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap gap-2">
            {article.city ? (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
                📍 {article.city}
              </span>
            ) : null}

            {article.product ? (
              <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-200">
                🧺 {article.product}
              </span>
            ) : null}

            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-black text-zinc-500 dark:bg-white/10">
              👁️ {(article.views ?? 0) + 1}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
            {article.title}
          </h1>

          {article.description ? (
            <p className="mt-4 text-lg font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
              {article.description}
            </p>
          ) : null}

          <div className="mt-5 text-sm font-black text-zinc-500">
            Yayın tarihi: {fmtDate(article.created_at)}
          </div>

          <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
            {(article.content || "")
              .split("\n")
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        </div>
      </article>
    </main>
  );
}