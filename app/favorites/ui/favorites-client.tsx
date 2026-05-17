"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lightbox, SquareMedia } from "@/app/my-listings/ui/listing-card";

type MediaType = "image" | "video";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(v: any) {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR");
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("tr-TR");
}

function isVideoType(t: any): t is "video" {
  return String(t) === "video";
}

function fmtPrice(x: any) {
  const unit = x?.unit ? String(x.unit) : null;

  const ppu = x?.price_per_unit;
  const price = x?.price;
  const minP = x?.min_price;
  const maxP = x?.max_price;

  const hasPPU = ppu != null && Number.isFinite(Number(ppu));
  const hasPrice = price != null && Number.isFinite(Number(price));
  const hasMin = minP != null && Number.isFinite(Number(minP));
  const hasMax = maxP != null && Number.isFinite(Number(maxP));

  if (hasPPU) return { main: fmtNum(ppu), sub: unit ? `/ ${unit}` : "" };
  if (hasPrice) return { main: fmtNum(price), sub: "Toplam" };
  if (hasMin && hasMax) return { main: `${fmtNum(minP)} - ${fmtNum(maxP)}`, sub: "Aralık" };
  if (hasMin) return { main: fmtNum(minP), sub: "Min" };
  if (hasMax) return { main: fmtNum(maxP), sub: "Max" };
  return { main: "—", sub: "" };
}

function getMedia(listing: any): { urls: string[]; types: MediaType[] } {
  const urls: string[] = Array.isArray(listing?.media_urls) ? listing.media_urls : [];
  const typesRaw: any[] = Array.isArray(listing?.media_types) ? listing.media_types : [];
  const types: MediaType[] = typesRaw.map((t) => (isVideoType(t) ? "video" : "image"));
  const len = Math.min(urls.length, types.length);
  return { urls: urls.slice(0, len), types: types.slice(0, len) };
}

// listing_media fallback
async function fetchListingMediaFor(listingIds: string[]) {
  const map = new Map<string, { urls: string[]; types: MediaType[] }>();
  if (!listingIds.length) return map;

  const { data, error } = await supabase
    .from("listing_media")
    .select("listing_id,url,type,sort_order")
    .in("listing_id", listingIds)
    .order("sort_order", { ascending: true });

  if (error || !data) return map;

  for (const r of data as any[]) {
    const id = String(r.listing_id);
    const url = String(r.url);
    const type: MediaType = String(r.type) === "video" ? "video" : "image";
    const cur = map.get(id) ?? { urls: [], types: [] };
    cur.urls.push(url);
    cur.types.push(type);
    map.set(id, cur);
  }
  return map;
}

/**
 * ✅ listing_favorites tablosu:
 * id, user_id, listing_id, created_at
 */
async function fetchFavoriteListingIds(userId: string) {
  const { data, error } = await supabase
    .from("listing_favorites")
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((r: any) => r.listing_id)
    .filter(Boolean)
    .map(String);
}

/** ✅ Satıcı profilleri (profiles tablosu varsayımı)
 * Beklenen kolonlar:
 * - id (uuid) -> user id
 * - full_name (text) veya name/username
 * - avatar_url (text)
 *
 * Eğer sende kolon isimleri farklıysa: aşağıdaki select’te düzelt.
 */
type SellerProfile = { id: string; full_name: string | null; avatar_url: string | null };

async function fetchSellerProfiles(sellerIds: string[]) {
  const map = new Map<string, SellerProfile>();
  if (!sellerIds.length) return map;

  const uniq = Array.from(new Set(sellerIds)).filter(Boolean);

  // 1) profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", uniq);

  if (!error && data) {
    for (const p of data as any[]) {
      map.set(String(p.id), {
        id: String(p.id),
        full_name: p.full_name ?? null,
        avatar_url: p.avatar_url ?? null,
      });
    }
  }

  return map;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const letter = (name?.trim()?.[0] ?? "U").toUpperCase();
  return (
    <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-700 dark:text-zinc-200">
          {letter}
        </div>
      )}
    </div>
  );
}

export default function FavoritesClient() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [sellerMap, setSellerMap] = useState<Map<string, SellerProfile>>(new Map());

  // Lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbTitle, setLbTitle] = useState("");
  const [lbUrls, setLbUrls] = useState<string[]>([]);
  const [lbTypes, setLbTypes] = useState<MediaType[]>([]);
  const [lbPosters, setLbPosters] = useState<Array<string | null>>([]);
  const [lbStart, setLbStart] = useState(0);

  async function load() {
    setLoading(true);
    setErr(null);
    setToast(null);

    try {
      const {
        data: { user },
        error: uerr,
      } = await supabase.auth.getUser();

      if (uerr) throw uerr;
      if (!user?.id) throw new Error("Giriş yapılmamış. Lütfen giriş yap.");

      // 1) favori listing id’leri
      const favIds = await fetchFavoriteListingIds(user.id);

      if (!favIds.length) {
        setItems([]);
        setSellerMap(new Map());
        return;
      }

      // 2) listings
      const { data: listings, error: lerr } = await supabase
        .from("listings")
        .select(
          [
            "id",
            "title",
            "description",
            "product_name",
            "product_type",
            "city",
            "district",
            "neighborhood",
            "market_name",
            "unit",
            "price_per_unit",
            "price",
            "min_price",
            "max_price",
            "is_active",
            "is_boosted",
            "expires_at",
            "created_at",
            "seller_id",
            "media_urls",
            "media_types",
            "deleted_at",
          ].join(",")
        )
        .in("id", favIds)
        .is("deleted_at", null);

      if (lerr) throw lerr;

      // 3) listing_media fallback
      const mediaMap = await fetchListingMediaFor(favIds);

      // 4) favori sırasına göre sırala
      const byId = new Map((listings ?? []).map((x: any) => [String(x.id), x]));
      const ordered = favIds
        .map((id) => byId.get(String(id)))
        .filter(Boolean)
        .map((x: any) => {
          const cur = getMedia(x);
          if ((!cur.urls || cur.urls.length === 0) && mediaMap.has(String(x.id))) {
            const m = mediaMap.get(String(x.id))!;
            return { ...x, media_urls: m.urls, media_types: m.types };
          }
          return x;
        });

      setItems(ordered);

      // 5) seller profiles
      const sellerIds = ordered.map((x: any) => String(x.seller_id)).filter(Boolean);
      const smap = await fetchSellerProfiles(sellerIds);
      setSellerMap(smap);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Favoriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((x) => {
      const hay =
        `${x.title ?? ""} ${x.description ?? ""} ${x.product_name ?? ""} ${x.product_type ?? ""} ` +
        `${x.city ?? ""} ${x.district ?? ""} ${x.market_name ?? ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [items, q]);

  async function removeFavorite(listingId: string) {
    setBusyId(listingId);
    setToast(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Giriş yapılmamış.");

      const { error } = await supabase
        .from("listing_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (error) throw error;

      setItems((prev) => prev.filter((x) => String(x.id) !== String(listingId)));
      setToast({ type: "ok", msg: "Favorilerden çıkarıldı." });
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ? String(e.message) : "Silme hatası" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Lightbox
        open={lbOpen}
        title={lbTitle}
        urls={lbUrls}
        types={lbTypes}
        posters={lbPosters}
        startIndex={lbStart}
        onClose={() => setLbOpen(false)}
      />

      {/* HERO */}
      <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-gradient-to-tr from-rose-400/20 to-fuchsia-400/10 blur-3xl" />
          <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-400/18 to-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/18 to-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Favorilerim</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Pazar’da favorilediğin ilanlar • kare medya • premium düzen
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ara: başlık, ürün, şehir..."
                className="w-[min(560px,92vw)] rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100 dark:focus:border-white/25"
              />
              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black text-zinc-900 backdrop-blur dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100">
                {filtered.length} ilan
              </div>
            </div>
          </div>

          {toast ? (
            <div
              className={cn(
                "mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold",
                toast.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
              )}
            >
              {toast.msg}
            </div>
          ) : null}

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </div>
          ) : null}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-[28px] border border-black/10 bg-white p-6 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
            Favoriler yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-black/10 bg-white p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
            Henüz favori ilan yok.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((x) => {
              const busy = busyId === x.id;
              const { urls, types } = getMedia(x);
              const priceView = fmtPrice(x);

              const statusCls = x.is_active
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200";

              const sellerId = String(x.seller_id ?? "");
              const seller = sellerId ? sellerMap.get(sellerId) : undefined;
              const sellerName =
                seller?.full_name?.trim() ||
                (sellerId ? `Kullanıcı • ${sellerId.slice(0, 6)}…` : "Kullanıcı");

              return (
                <div
                  key={x.id}
                  className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
                >
                  <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[320px_1fr_240px] md:items-start">
                    {/* MEDIA */}
                    <div className="md:sticky md:top-5">
                      <SquareMedia
                        title={x.title ?? "İlan"}
                        urls={urls}
                        types={types}
                        onOpen={(startIndex, posters) => {
                          setLbTitle(x.title ?? "İlan");
                          setLbUrls(urls);
                          setLbTypes(types);
                          setLbPosters(posters);
                          setLbStart(startIndex);
                          setLbOpen(true);
                        }}
                      />
                      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
                        İpucu: görsele <span className="font-black">double click</span> → fullscreen
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-lg font-black text-zinc-900 dark:text-zinc-100">{x.title}</div>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-black", statusCls)}>
                          {x.is_active ? "Yayında" : "Kapalı"}
                        </span>
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                          {urls.length} medya
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/35">
                          <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">Fiyat</div>
                          <div className="mt-1 flex items-end gap-2">
                            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">{priceView.main}</div>
                            {priceView.sub ? (
                              <div className="pb-[2px] text-sm font-black text-zinc-500 dark:text-zinc-400">
                                {priceView.sub}
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Ürün:{" "}
                            <span className="font-black text-zinc-900 dark:text-zinc-100">
                              {x.product_name ?? x.product_type ?? "—"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/35">
                          <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">Konum</div>
                          <div className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-100">
                            {[x.city, x.district, x.neighborhood].filter(Boolean).join(" / ") || "—"}
                          </div>
                          {x.market_name ? (
                            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                              Hal/Pazar:{" "}
                              <span className="font-black text-zinc-900 dark:text-zinc-100">{x.market_name}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/35">
                        <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">Açıklama</div>
                        {x.description ? (
                          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{x.description}</div>
                        ) : (
                          <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">Açıklama yok</div>
                        )}
                        <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-500">
                          Oluşturma: {fmtDateTime(x.created_at)} • Bitiş: {x.expires_at ?? "—"}
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="md:sticky md:top-5">
                      <div className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/35">
                        <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">İşlemler</div>

                        <div className="mt-3 grid gap-2">
                          <button
                            disabled={busy}
                            onClick={() => removeFavorite(String(x.id))}
                            className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-900 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/30"
                          >
                            {busy ? "İşleniyor..." : "❤️ Favoriden Çıkar"}
                          </button>

                          <a
                            href={`/pazar/${String(x.id)}`}
                            className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-black text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
                          >
                            Detaya Git
                          </a>

                          <button
                            onClick={() => load()}
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
                          >
                            Yenile
                          </button>
                        </div>

                        {/* ✅ ID KUTUSU YERİNE SATIŞCI */}
                        <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                          <div className="flex items-center gap-3">
                            <Avatar url={seller?.avatar_url ?? null} name={sellerName} />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black text-zinc-900 dark:text-zinc-100">
                                {sellerName}
                              </div>
                              <div className="mt-0.5 truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                                Satıcı • {[x.city, x.district].filter(Boolean).join(" / ") || "—"}
                              </div>
                            </div>
                          </div>

                          {/* istersen altta küçük id gösterelim (premium küçük) */}
                          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
                            ID: <span className="font-mono">{String(x.id).slice(0, 8)}…</span>
                          </div>
                        </div>

                        
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}