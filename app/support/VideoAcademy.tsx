export default function VideoAcademy() {
  const videos = [
    {
      title: "İlk İlan Nasıl Verilir?",
      time: "2 dk",
    },
    {
      title: "KYC Nasıl Tamamlanır?",
      time: "1 dk",
    },
    {
      title: "QR Giriş Kullanımı",
      time: "1 dk",
    },
    {
      title: "Premium Paketler",
      time: "3 dk",
    },
  ];

  return (
    <section id="academy">
      <div className="mb-4">
        <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-700 dark:text-violet-200">
          HALAPP AKADEMİ
        </div>

        <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
          Eğitim Videoları
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {videos.map((video) => (
          <div
            key={video.title}
            className="group rounded-[28px] border border-black/10 bg-white/75 p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-3xl">
              ▶️
            </div>

            <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
              {video.title}
            </h3>

            <div className="mt-2 text-sm font-bold text-zinc-500">
              Süre: {video.time}
            </div>

            <button className="mt-5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400">
              İzle
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}