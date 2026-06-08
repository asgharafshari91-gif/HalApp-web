import TurkeyHeatMap from "@/components/map/TurkeyHeatMap";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-white">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
            Canlı Türkiye Haritası
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Türkiye geneli canlı pazar hareketi
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Şehir bazlı ilan yoğunluğu, pazar hareketi ve canlı ticaret sinyallerini takip edin.
          </p>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-zinc-50 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <TurkeyHeatMap />
        </div>
      </section>
    </main>
  );
}