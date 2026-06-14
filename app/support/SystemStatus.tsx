export default function SystemStatus() {
  const services = [
    "İlan Sistemi",
    "Mesajlaşma",
    "Bildirimler",
    "QR Giriş",
    "KYC Servisi",
    "Market Intelligence",
  ];

  return (
    <section>
      <div className="mb-4">
        <div className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-200">
          SİSTEM DURUMU
        </div>

        <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
          Servis Sağlığı
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <div
            key={service}
            className="rounded-[28px] border border-black/10 bg-white/75 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-zinc-900 dark:text-white">
                {service}
              </span>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
                🟢 Aktif
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}