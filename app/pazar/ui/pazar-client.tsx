"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SellerMini = { id: string; name: string; avatar_url?: string | null };

type Listing = {
  id: string;
  title: string;
  description: string | null;
  product_name: string | null;
  product_type: string | null;
  post_type: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  market_name: string | null;
  price: number | null;
  price_per_unit: number | null;
  unit: string | null;
  quantity: number | null;
  min_quantity: number | null;
  is_boosted: boolean;
  created_at: string | null;
  seller_id: string | null;

  cover_url: string | null;
  seller: SellerMini | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmtMoney(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("tr-TR").format(n);
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} dk önce`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(diff / 86400000);
  return `${Math.max(1, days)} gün önce`;
}

function initials(name?: string | null) {
  const s = String(name ?? "").trim();
  if (!s) return "S";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "S";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

const PRODUCTS = [
  "Ahududu","Altınçilek","Amme(Cennet Meyvesi)","Ananas","Armut","Avokado","Ayva","Biber","Biber Çarli","Biber Kapya","Biber Sivri","Biber Üçburun",
  "Blue Berry","Böğürtlen","Brokoli","Çilek","Dereotu","Domates","Domates (Ceri)","Domates (Pembe)","Domates Kokteyl",
  "Elma (Golden)","Elma (Grann Smith)","Elma (Starking)","Fasulye","Fesleğen","Frenk Üzümü","Greyfurt","Havuç","Hıyar","Hindistan Cevizi",
  "Ispanak","Kabak (Bal)","Kabak (Sakız)","Karadeniz Yaprağı","Karnabahar","Kavun(Kırkağaç)","Kereviz","Kivi","Kuzu Kulağı",
  "Lahana (Beyaz)","Lahana (Kırmızı)","Lime Limon","Limon","Mandarin(Paket)","Mango","Mantar","Marul (Aysberk)","Marul (Düz)","Marul (Kıvırcık)",
  "Maydonoz","Muz (Yerli)","Muz İthal","Nane","Nar","Pancar","Patates","Patates (Baby)","Patates (Kumpirlik)","Patlıcan","Patlıcan (Topak)",
  "Pazı Bağ","Pırasa","Portakal (Sıkmalık)","Portakal (Valencia Pak)","Roka Bağ","Sarımsak (Taze)","Semizotu Bağ","Soğan (Arpacık)","Soğan (Kırmız)",
  "Soğan (Yeşil) Bağ","Soğan Kuru","Tere Bağ","Tere Su","Turp (Kırmızı)","Turp(Fındık)","Üzüm (Beyaz)","Üzüm (Siyah)","Zencefil",
];

type Locations = Record<string, Record<string, string[]>>;

export default function PazarClient() {
  const [q, setQ] = useState("");
  const [product, setProduct] = useState("all");
  const [city, setCity] = useState("all");
  const [district, setDistrict] = useState("all");
  const [liveOnly, setLiveOnly] = useState(false);

  const [priceEnabled, setPriceEnabled] = useState(false);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(5000);

  const [sort, setSort] = useState<"new" | "cheap" | "expensive">("new");

  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [busyFav, setBusyFav] = useState<string | null>(null);

  const [loc, setLoc] = useState<Locations | null>(null);

  const cityList = useMemo(() => (loc ? Object.keys(loc).sort((a, b) => a.localeCompare(b, "tr")) : []), [loc]);
  const districtList = useMemo(() => {
    if (!loc) return [];
    if (city === "all") return [];
    return Object.keys(loc[city] ?? {}).sort((a, b) => a.localeCompare(b, "tr"));
  }, [loc, city]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/locations.json", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        setLoc(j as Locations);
      } catch {}
    })();
  }, []);

  async function load(nextPage = 1) {
    try {
      setLoading(true);
      setErr(null);

      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      qs.set("product", product);
      qs.set("city", city);
      qs.set("district", district);
      qs.set("sort", sort);
      qs.set("live", liveOnly ? "1" : "0");

      qs.set("price", priceEnabled ? "1" : "0");
      qs.set("min", String(min));
      qs.set("max", String(max));

      qs.set("page", String(nextPage));
      qs.set("limit", String(limit));

      const r = await fetch(`/api/pazar?${qs.toString()}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "pazar_error");

      setItems(j.items ?? []);
      setTotal(Number(j.total ?? 0));
      setPage(nextPage);

      const rf = await fetch(`/api/pazar/favorites`, { cache: "no-store" });
      const jf = await rf.json().catch(() => ({}));
      const ids: string[] = jf?.ids ?? [];
      setFavIds(new Set(ids));
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleFav(listingId: string) {
    try {
      setBusyFav(listingId);
      const r = await fetch(`/api/pazar/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return;

      setFavIds((prev) => {
        const next = new Set(prev);
        if (j.favorited) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    } finally {
      setBusyFav(null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-black">🧩 Pazar Filtresi</div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setQ("");
                setProduct("all");
                setCity("all");
                setDistrict("all");
                setLiveOnly(false);
                setPriceEnabled(false);
                setMin(0);
                setMax(5000);
                setSort("new");
                load(1);
              }}
              className="rounded-2xl bg-black/5 px-4 py-2 text-xs font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Temizle
            </button>

            <button
              type="button"
              onClick={() => load(1)}
              className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400"
            >
              Uygula
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün, mağaza, şehir…"
            className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          />

          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          >
            <option value="all">Ürün (Tümü)</option>
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setDistrict("all");
            }}
            className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
          >
            <option value="all">İl (Tümü)</option>
            {cityList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={city === "all"}
            className={clsx(
              "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30",
              city === "all" ? "opacity-60" : ""
            )}
          >
            <option value="all">{city === "all" ? "Önce il seç" : "İlçe (Tümü)"}</option>
            {districtList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-black/70 dark:text-white/70">
            <input type="checkbox" checked={liveOnly} onChange={(e) => setLiveOnly(e.target.checked)} />
            Sadece öne çıkanlar (boosted)
          </label>

          <label className="flex items-center justify-between gap-2 text-sm font-semibold text-black/70 dark:text-white/70">
            <span>Fiyat filtresi</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-black/50 dark:text-white/50">{priceEnabled ? "Açık" : "Kapalı"}</span>
              <input type="checkbox" checked={priceEnabled} onChange={(e) => setPriceEnabled(e.target.checked)} />
            </span>
          </label>

          <div className="flex items-center justify-end gap-2">
            <span className="text-xs font-black text-black/50 dark:text-white/50">Sıralama</span>
            <div className="flex rounded-2xl bg-black/5 p-1 dark:bg-white/5">
              {(["new", "cheap", "expensive"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setSort(k)}
                  className={clsx(
                    "rounded-2xl px-4 py-2 text-xs font-black",
                    sort === k ? "bg-black/80 text-white dark:bg-white/20" : "text-black/70 dark:text-white/70"
                  )}
                >
                  {k === "new" ? "Yeni" : k === "cheap" ? "Ucuz" : "Pahalı"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={clsx(
            "mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]",
            !priceEnabled ? "opacity-60" : ""
          )}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-black">Fiyat Aralığı</div>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
              {min} – {max} ₺
            </div>
          </div>

          <div className="mt-3 relative h-10">
            <div className="absolute inset-y-1 left-0 right-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/15" />
            <div
              className="absolute inset-y-1 rounded-full bg-emerald-500"
              style={{
                left: `${(min / 5000) * 100}%`,
                width: `${Math.max(0, ((max - min) / 5000) * 100)}%`,
              }}
            />

            <input
              type="range"
              min={0}
              max={5000}
              value={min}
              disabled={!priceEnabled}
              onChange={(e) => setMin(Math.min(Number(e.target.value), max))}
              className="absolute left-0 right-0 top-0 h-10 w-full appearance-none bg-transparent"
            />
            <input
              type="range"
              min={0}
              max={5000}
              value={max}
              disabled={!priceEnabled}
              onChange={(e) => setMax(Math.max(Number(e.target.value), min))}
              className="absolute left-0 right-0 top-0 h-10 w-full appearance-none bg-transparent"
            />
          </div>

          <div className="mt-1 flex justify-between text-xs text-black/50 dark:text-white/50">
            <span>0</span>
            <span>5000</span>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black">
            Sonuç: {total} <span className="text-black/50 dark:text-white/50">(Sayfa {page}/{pages})</span>
          </div>
          <button
            type="button"
            onClick={() => load(page)}
            className="rounded-2xl bg-black/5 px-4 py-2 text-xs font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Yenile
          </button>
        </div>

        {err ? (
          <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            API Hatası: {err}
          </div>
        ) : null}
      </div>

      {/* Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
            Yükleniyor…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
            Kayıt bulunamadı.
          </div>
        ) : (
          items.map((x) => {
            const isFav = favIds.has(x.id);
            const busy = busyFav === x.id;
            const priceShown = x.price ?? x.price_per_unit;
            const location = [x.city, x.district, x.neighborhood].filter(Boolean).join(" / ");
            const detailHref = `/pazar/${encodeURIComponent(String(x.id))}`;

            return (
              <div
                key={x.id}
                className="relative overflow-hidden rounded-[22px] border border-black/10 bg-white/80 p-4 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
              >
                {/* ✅ Kartın tamamı tıklanabilir: iOS/SPA sorunlarını bitirir */}
                <Link
                  href={detailHref}
                  className="absolute inset-0 z-10"
                  aria-label={`${x.title} ilan detayı`}
                />

                <div className="relative z-20 flex gap-3">
                  {/* photo */}
                  <div className="shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-black/10 dark:bg-white/10">
                      {x.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={x.cover_url} alt={x.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/40 dark:text-white/40">
                          Foto
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-base font-black">{x.title}</div>
                        <div className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">
                          {x.product_name || x.product_type || "Ürün"} {x.market_name ? `• ${x.market_name}` : ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.preventDefault(); // ✅ overlay Link'i kes
                          e.stopPropagation();
                          toggleFav(x.id);
                        }}
                        className={clsx(
                          "rounded-2xl px-3 py-2 text-sm font-black transition",
                          isFav
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-200"
                            : "bg-black/5 text-black/70 dark:bg-white/5 dark:text-white/70",
                          busy ? "opacity-60 cursor-not-allowed" : "hover:bg-black/10 dark:hover:bg-white/10"
                        )}
                        title="Favori"
                      >
                        {isFav ? "❤️" : "🤍"}
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black">
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-800 dark:text-emerald-200">
                        {x.post_type?.toUpperCase() || "İLAN"}
                      </span>
                      <span className="rounded-full bg-black/5 px-3 py-1 text-black/70 dark:bg-white/5 dark:text-white/70">
                        ⏱ {timeAgo(x.created_at)}
                      </span>
                      {x.is_boosted ? (
                        <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-yellow-800 dark:text-yellow-200">
                          🏅 Gold
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 text-lg font-black text-emerald-700 dark:text-emerald-300">
                      {fmtMoney(priceShown)} ₺{" "}
                      <span className="text-sm text-black/50 dark:text-white/50">{x.unit ? ` / ${x.unit}` : ""}</span>
                    </div>

                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">📍 {location || "—"}</div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {x.seller?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={x.seller.avatar_url}
                            alt="seller"
                            className="h-7 w-7 rounded-full object-cover bg-black/10 dark:bg-white/10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-black text-emerald-800 dark:text-emerald-200">
                            {initials(x.seller?.name)}
                          </div>
                        )}
                        <div className="truncate text-xs font-black text-black/70 dark:text-white/70">
                          {x.seller?.name || "Satıcı"}
                        </div>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black text-emerald-800 dark:text-emerald-200">
                          Güvenli
                        </span>
                      </div>

                      {/* ✅ sadece görsel buton – tıklanınca zaten detay açılacak */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // overlay zaten detaya götürüyor; burası sadece premium "CTA"
                          window.location.href = detailHref;
                        }}
                        className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400"
                      >
                        Detay →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-[22px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-sm text-black/60 dark:text-white/60">
          Sayfa {page}/{pages} • toplam {total}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => load(Math.max(1, page - 1))}
            className={clsx(
              "rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
              page <= 1 || loading ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            ←
          </button>

          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => load(Math.min(pages, page + 1))}
            className={clsx(
              "rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
              page >= pages || loading ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}