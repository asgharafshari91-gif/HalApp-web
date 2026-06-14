export default function SupportHero() {
  return (
    <section className="relative overflow-hidden rounded-[40px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-zinc-950 to-black p-8 text-white shadow-[0_40px_120px_rgba(0,0,0,.25)] sm:p-12">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200">
          HALAPP KONTROL MERKEZİ
        </div>

        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          Destek, Eğitim ve Sistem Yönetimi
        </h1>

        <p className="mt-5 max-w-3xl text-lg text-white/70">
          Hesabını yönet, sistem durumunu takip et, destek talepleri oluştur,
          eğitim videolarına ulaş ve ticaretini kesintisiz sürdür.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#support-request"
            className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black text-black hover:bg-emerald-300"
          >
            Destek Talebi Oluştur
          </a>

          <a
            href="#academy"
            className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black"
          >
            Akademiye Git
          </a>
        </div>
      </div>
    </section>
  );
}