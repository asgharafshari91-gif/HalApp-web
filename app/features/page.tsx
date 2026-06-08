"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const productSignals = [
  {
    emoji: "🍅",
    product: "Domates",
    city: "Antalya",
    signal: "Yüksek Talep",
    href: "/signals?product=domates",
  },
  {
    emoji: "🍎",
    product: "Elma",
    city: "Isparta",
    signal: "Stok Artıyor",
    href: "/signals?product=elma",
  },
  {
    emoji: "🍊",
    product: "Narenciye",
    city: "Mersin",
    signal: "İhracat Sinyali",
    href: "/signals?product=narenciye",
  },
  {
    emoji: "🍉",
    product: "Karpuz",
    city: "Adana",
    signal: "Sezon Fırsatı",
    href: "/signals?product=karpuz",
  },
];

const intelligenceServices = [
  {
    no: "01",
    title: "Canlı Piyasa İstihbaratı",
    desc: "Ürün, şehir, ilan, talep ve fiyat hareketlerini tek merkezden okuyarak tüccara canlı piyasa görüşü sağlar.",
    points: ["Ürün hareketi", "Şehir yoğunluğu", "Talep sinyali"],
  },
  {
    no: "02",
    title: "Arz & Talep Radar Sistemi",
    desc: "Hangi üründe arz artıyor, hangi bölgede talep güçleniyor, piyasa hangi yöne gidiyor daha net görünür.",
    points: ["Arz artışı", "Talep düşüşü", "Fırsat bölgeleri"],
  },
  {
    no: "03",
    title: "Şehir Bazlı Ticaret Haritası",
    desc: "Türkiye haritası üzerinden ürün ve ilan yoğunluğu takip edilir. Tüccar hangi şehirde hareket olduğunu görür.",
    points: ["81 il takibi", "Bölgesel yoğunluk", "Canlı harita"],
  },
  {
    no: "04",
    title: "Fiyat Sinyal Analizi",
    desc: "Ürünlerde düşük, yüksek ve ortalama fiyat algısı oluşur. Tüccar alım-satım kararını daha bilinçli verir.",
    points: ["Fiyat bandı", "Bölge farkı", "Piyasa yönü"],
  },
  {
    no: "05",
    title: "Rekabet Yoğunluğu",
    desc: "Aynı üründe kaç ilan var, hangi bölgede rekabet güçlü, hangi şehirde fırsat boşluğu var analiz edilir.",
    points: ["Rakip ilanlar", "Yoğun bölgeler", "Boş pazarlar"],
  },
  {
    no: "06",
    title: "Ticaret Fırsat Skoru",
    desc: "Ürün, şehir, talep, fiyat ve ilan yoğunluğuna göre tüccara fırsat puanı mantığıyla yol gösterir.",
    points: ["Fırsat puanı", "Risk sinyali", "Karar desteği"],
  },
  {
    no: "07",
    title: "Akıllı Ürün Takibi",
    desc: "Tüccar ilgilendiği ürünü takip eder; yeni ilan, fiyat değişimi ve bölgesel hareketlerde uyarı alır.",
    points: ["Ürün alarmı", "Yeni ilan", "Fiyat hareketi"],
  },
  {
    no: "08",
    title: "İhracat Uygunluk Sinyali",
    desc: "Miktar, bölge, ürün tipi ve hareket bilgisiyle ihracatçı için potansiyel ürün fırsatları görünür olur.",
    points: ["Miktar takibi", "Bölge seçimi", "İhracat fırsatı"],
  },
  {
    no: "09",
    title: "Güvenilir Satıcı Profili",
    desc: "Firma bilgisi, onay durumu, ilan geçmişi ve iletişim düzeniyle daha güvenli ticaret ortamı oluşturur.",
    points: ["Onaylı profil", "Firma bilgisi", "Güven katmanı"],
  },
  {
    no: "10",
    title: "Canlı Mesajlaşma ve Bağlantı",
    desc: "Alıcı ve satıcı ilan üzerinden hızlı görüşür. Pazarlık, numune, sevkiyat ve fiyat konuşması tek yerde yürür.",
    points: ["Direkt iletişim", "Hızlı pazarlık", "Kayıtlı akış"],
  },
  {
    no: "11",
    title: "Premium Görünürlük Motoru",
    desc: "İlanlar öne çıkarma, vitrin ve süre uzatma sistemleriyle daha güçlü görünürlük kazanır.",
    points: ["Vitrin", "Boost", "İlan uzatma"],
  },
  {
    no: "12",
    title: "Tüccar Karar Merkezi",
    desc: "HalApp; ilan, harita, fiyat, talep, mesaj ve kullanıcı verisini birleştirerek ticaret karar merkezine dönüşür.",
    points: ["Tek panel", "Canlı veri", "Ticaret zekâsı"],
  },
];

const intelligenceLayers = [
  "Ürün verisi",
  "Şehir verisi",
  "Talep verisi",
  "İlan yoğunluğu",
  "Fiyat sinyali",
  "Kullanıcı hareketi",
  "Mesajlaşma ilgisi",
  "Favori davranışı",
  "Premium görünürlük",
  "Pazar fırsatı",
];

const traderBenefits = [
  {
    title: "Nereden ürün almalıyım?",
    text: "HalApp şehir ve ürün hareketlerini göstererek tüccarın doğru bölgeyi daha hızlı bulmasına yardım eder.",
  },
  {
    title: "Hangi ürün hareketli?",
    text: "Canlı ilan ve talep yoğunluğu ile piyasada hangi ürünün öne çıktığı daha net görünür.",
  },
  {
    title: "Fiyat düşer mi yükselir mi?",
    text: "Bölgesel yoğunluk, arz artışı ve talep zayıflığı gibi sinyaller karar sürecini güçlendirir.",
  },
  {
    title: "Nerede fırsat var?",
    text: "Az rekabet, yüksek talep veya yeni ilan hareketi olan bölgeler tüccar için fırsat alanı oluşturur.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4faf6] text-zinc-950 dark:bg-black dark:text-white">
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,.32),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(34,197,94,.2),transparent_30%),linear-gradient(180deg,rgba(255,255,255,.7),transparent)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,.22),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(34,197,94,.14),transparent_30%)]" />

        <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 md:pt-12 md:pb-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_.85fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-white/70 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm backdrop-blur-xl dark:bg-white/5 dark:text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                HalApp Market Intelligence
              </div>

              <h1 className="relative max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-8xl">
                <span className="absolute -left-6 top-6 -z-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-[70px]" />

                <span className="block text-zinc-950 drop-shadow-sm dark:text-white">
                  Toptan meyve
                </span>

                <span className="block text-zinc-950 drop-shadow-sm dark:text-white">
                  sebze ticaretinde
                </span>

                <span className="block bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(16,185,129,.25)]">
                  piyasa istihbaratı
                </span>

                <span className="block text-zinc-950 dark:text-white">
                  artık cebinde.
                </span>
              </h1>

              <p className="mt-7 max-w-3xl border-l-4 border-emerald-500/50 pl-5 text-lg font-medium leading-8 text-zinc-600 dark:text-zinc-300">
                HalApp yalnızca ilan gösteren bir platform değildir. Ürün, şehir,
                talep, arz, fiyat, rekabet ve kullanıcı hareketlerini okuyarak tüccara
                karar desteği sunan yeni nesil dijital hal zekâsıdır.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/pazar"
                  className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-xl shadow-emerald-500/25 transition hover:-translate-y-1 hover:bg-emerald-400"
                >
                  Canlı Pazarı İncele
                </Link>

                <Link
                  href="/map"
                  className="rounded-2xl border border-black/10 bg-white/70 px-6 py-3 text-sm font-black backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Türkiye Haritasını Aç
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="group relative block rounded-[40px] border border-black/10 bg-white/75 p-5 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl transition duration-300 hover:-translate-y-2 hover:shadow-emerald-500/25 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-[32px] bg-zinc-950 p-6 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-emerald-300">
                        LIVE INTELLIGENCE
                      </div>
                      <div className="mt-1 text-2xl font-black">
                        Piyasa Kontrol Paneli
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
                      Aktif
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {productSignals.map((item, index) => (
                      <motion.div
                        key={item.product}
                        initial={{ opacity: 0, y: 38 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.45,
                          delay: 0.28 + index * 0.12,
                        }}
                      >
                        <Link
                          href={item.href}
                          className="group/card block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-3xl transition group-hover/card:scale-110">
                                {item.emoji}
                              </div>

                              <div>
                                <div className="font-black text-white">
                                  {item.product}
                                </div>
                                <div className="mt-1 text-xs text-white/55">
                                  {item.city}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                                {item.signal}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 text-xs font-bold text-white/40 transition group-hover/card:text-emerald-300">
                            Detaylı piyasa analizini görüntüle →
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      ["81", "İl"],
                      ["24/7", "Canlı"],
                      ["AI", "Zekâ"],
                    ].map(([a, b]) => (
                      <div
                        key={a}
                        className="rounded-2xl bg-white/[0.06] p-4 text-center"
                      >
                        <div className="text-2xl font-black text-emerald-300">
                          {a}
                        </div>
                        <div className="mt-1 text-xs text-white/50">{b}</div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/signals"
                    className="mt-5 block rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-xs font-black text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    Tüm piyasa istihbarat merkezini aç →
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {intelligenceLayers.map((x, index) => (
              <motion.div
                key={x}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-black shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="mr-2 text-emerald-500">●</span>
                {x}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-10 max-w-4xl">
          <div className="mb-4 text-sm font-black uppercase tracking-[.22em] text-emerald-600">
            Intelligence Services
          </div>

          <h2 className="text-3xl font-black tracking-tight md:text-6xl">
            Tüccara veri değil, ticaret avantajı sunar.
          </h2>

          <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            HalApp’ın her hizmeti piyasayı daha erken görmek, doğru ürüne daha hızlı
            ulaşmak ve ticaret kararını daha güçlü vermek için tasarlanır.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {intelligenceServices.map((x, index) => (
            <motion.div
              key={x.no}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.42, delay: (index % 3) * 0.08 }}
              className="group relative overflow-hidden rounded-[34px] border border-black/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[60px] bg-emerald-500/10 transition group-hover:bg-emerald-500/20" />

              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-4xl font-black text-emerald-600/80">
                    {x.no}
                  </span>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    Intelligence
                  </span>
                </div>

                <h3 className="text-xl font-black">{x.title}</h3>

                <p className="mt-4 min-h-[112px] leading-7 text-zinc-600 dark:text-zinc-300">
                  {x.desc}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {x.points.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-white/10 dark:text-white/70"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <div className="mt-6 h-1 w-16 rounded-full bg-emerald-500 transition-all duration-300 group-hover:w-32" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-[44px] bg-zinc-950 p-6 text-white shadow-2xl md:p-12">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-300">
                Tüccar için karar desteği
              </div>

              <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                HalApp, piyasayı izleyen değil; piyasayı yorumlayan sistemdir.
              </h2>

              <p className="mt-5 leading-8 text-white/65">
                Klasik ilan platformlarında sadece ürün görürsün. HalApp’ta ürünün
                arkasındaki piyasa hareketini, şehir yoğunluğunu, talep sinyalini ve
                ticaret fırsatını görürsün.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {traderBenefits.map((x, index) => (
                <motion.div
                  key={x.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 transition hover:-translate-y-1 hover:bg-emerald-500/10"
                >
                  <h3 className="text-lg font-black text-emerald-300">
                    {x.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {x.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              no: "01",
              title: "Piyasayı görür",
              text: "Ürün ve şehir bazlı hareketleri takip ederek tüccarın piyasayı tek ekrandan anlamasını sağlar.",
            },
            {
              no: "02",
              title: "Fırsatı yakalar",
              text: "Talep artışı, ürün yoğunluğu ve bölgesel boşluklar ticaret fırsatına dönüşür.",
            },
            {
              no: "03",
              title: "Kararı hızlandırır",
              text: "Tüccar daha az tahminle, daha çok veriyle alım-satım kararını verir.",
            },
          ].map((x, index) => (
            <motion.div
              key={x.no}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
              className="rounded-[36px] border border-black/10 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="text-5xl font-black text-emerald-600">
                {x.no}
              </div>
              <h3 className="mt-5 text-2xl font-black">{x.title}</h3>
              <p className="mt-4 leading-8 text-zinc-600 dark:text-zinc-300">
                {x.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 pb-24">
        <div className="relative overflow-hidden rounded-[48px] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center shadow-2xl shadow-emerald-500/10 dark:bg-emerald-500/[0.08] md:p-14">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-black tracking-tight md:text-6xl">
              HalApp, dijital hal değil; piyasa zekâsıdır.
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              Tüccar için en değerli şey sadece ürün bulmak değildir. Piyasayı erken
              görmek, doğru bölgeyi seçmek, talebi okumak ve fırsatı kaçırmamaktır.
              HalApp bunun için kuruldu.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/pazar"
                className="rounded-2xl bg-emerald-500 px-7 py-4 text-sm font-black text-black transition hover:-translate-y-1 hover:bg-emerald-400"
              >
                Canlı Pazara Git
              </Link>

              <Link
                href="/signals"
                className="rounded-2xl border border-black/10 bg-white/70 px-7 py-4 text-sm font-black transition hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                Intelligence Merkezi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}