"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

/**
 * ✅ Değiştirmen gerekirse:
 * - Favoriler tablon: favorites (user_id, listing_id, created_at)
 * - İlanlar tablon: listings (id, title, price, city, district, images, cover_url, created_at, user_id...)
 */
const FAV_TABLE = "favorites";
const LISTING_TABLE = "listings";

// Tipler (listing alanlarını sende ne varsa ona göre genişletebilirsin)
type FavoriteRow = {
  id?: string | number;
  user_id: string;
  listing_id: string;
  created_at: string | null;
  listing?: ListingRow | null;
};

type ListingRow = {
  id: string;
  title?: string | null;
  price?: number | null;
  city?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  cover_url?: string | null; // varsa
  images?: string[] | null; // varsa
  created_at?: string | null;
  user_id?: string | null;
};

function timeAgoShort(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g`;
  if (hr > 0) return `${hr}s`;
  if (min > 0) return `${min}dk`;
  return "az önce";
}

function moneyTR(v?: number | null) {
  if (v == null) return "";
  try {
    return new Intl.NumberFormat("tr-TR").format(v);
  } catch {
    return String(v);
  }
}

function safeCover(listing?: ListingRow | null) {
  if (!listing) return "";
  if (listing.cover_url) return listing.cover_url;
  const imgs = listing.images ?? null;
  if (Array.isArray(imgs) && imgs.length > 0) return imgs[0] ?? "";
  return "";
}

export default function FavoritesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [items, setItems] = useState<FavoriteRow[]>([]);
  const [removing, setRemoving] = useState<Record<string, boolean>>({});

  const myIdRef = useRef<string | null>(null);

  const count = items.length;

  const emptyText = useMemo(() => {
    if (loading) return "";
    return "Henüz favorin yok. İlanlarda ❤️ ile favorilere ekleyebilirsin.";
  }, [loading]);

  async function requireAuthOrRedirect() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const uid = data.session?.user?.id ?? null;
    if (!uid) {
      router.replace(`/auth?next=${encodeURIComponent("/favorites")}`);
      return null;
    }
    setMyId(uid);
    myIdRef.current = uid;
    return uid;
  }

  // ✅ join başarısız olursa ikinci sorgu ile listings çek
  async function load() {
    setLoading(true);
    try {
      const uid = await requireAuthOrRedirect();
      if (!uid) return;

      // 1) Önce JOIN dene (FK varsa direkt çalışır)
      const joinSelect = `
        user_id,
        listing_id,
        created_at,
        listing:${LISTING_TABLE} (
          id,
          title,
          price,
          city,
          district,
          neighborhood,
          cover_url,
          images,
          created_at,
          user_id
        )
      `;

      const { data: joined, error: joinErr } = await supabase
        .from(FAV_TABLE)
        .select(joinSelect)
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      // JOIN çalıştıysa
      if (!joinErr) {
        const list = (joined ?? []) as any[];
        setItems(
          list.map((x) => ({
            user_id: x.user_id,
            listing_id: String(x.listing_id),
            created_at: x.created_at ?? null,
            listing: (x.listing ?? null) as ListingRow | null,
          }))
        );
        return;
      }

      // 2) JOIN yok / FK yok → fallback: önce favorites, sonra listings.in(...)
      const { data: favOnly, error: fe } = await supabase
        .from(FAV_TABLE)
        .select("user_id, listing_id, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (fe) throw fe;

      const favList = (favOnly ?? []) as any[];
      const ids = favList.map((x) => String(x.listing_id)).filter(Boolean);

      if (!ids.length) {
        setItems([]);
        return;
      }

      const { data: ls, error: le } = await supabase
        .from(LISTING_TABLE)
        .select("id,title,price,city,district,neighborhood,cover_url,images,created_at,user_id")
        .in("id", ids);

      if (le) throw le;

      const map = new Map<string, ListingRow>();
      (ls ?? []).forEach((l: any) => map.set(String(l.id), l as ListingRow));

      setItems(
        favList.map((f) => ({
          user_id: f.user_id,
          listing_id: String(f.listing_id),
          created_at: f.created_at ?? null,
          listing: map.get(String(f.listing_id)) ?? null,
        }))
      );
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Favoriler yüklenemedi",
        message: e?.message ?? "Bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(listingId: string) {
    const uid = myIdRef.current;
    if (!uid) return;

    try {
      setRemoving((p) => ({ ...p, [listingId]: true }));

      const { error } = await supabase
        .from(FAV_TABLE)
        .delete()
        .eq("user_id", uid)
        .eq("listing_id", listingId);

      if (error) throw error;

      setItems((prev) => prev.filter((x) => x.listing_id !== listingId));

      toast({
        variant: "success",
        title: "Kaldırıldı",
        message: "Favorilerden çıkarıldı.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Silinemedi",
        message: e?.message ?? "Bir hata oluştu.",
      });
    } finally {
      setRemoving((p) => ({ ...p, [listingId]: false }));
    }
  }

  // ✅ İlk yükleme + auth değişimi
  useEffect(() => {
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      const uid = session?.user?.id ?? null;
      myIdRef.current = uid;
      setMyId(uid);
      load();
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Realtime: favorites değişince yenile (stabil)
  useEffect(() => {
    if (!myId) return;

    const ch = supabase
      .channel("fav-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: FAV_TABLE }, (payload) => {
        const row: any = payload.new ?? payload.old ?? null;
        const uid = myIdRef.current;
        if (!uid) return;
        if (row?.user_id && row.user_id !== uid) return; // sadece benim değişimim
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Favoriler</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Beğendiğin ilanlar burada. ({count})
          </div>
        </div>

        <Link
          href="/live"
          className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
        >
          Pazar
        </Link>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => {
              const l = it.listing;
              const cover = safeCover(l);
              const title = (l?.title ?? "").trim() || "İlan";
              const sub = [l?.city, l?.district, l?.neighborhood].filter(Boolean).join(" • ");
              const busy = Boolean(removing[it.listing_id]);

              return (
                <div
                  key={it.listing_id}
                  className={[
                    "flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 transition",
                    "dark:border-white/10 dark:bg-white/5",
                  ].join(" ")}
                >
                  <Link
                    href={`/listing/${l?.id ?? it.listing_id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/70 dark:ring-white/10 dark:bg-black/25">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="cover" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/60 dark:text-white/60">
                          —
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">
                          {title}
                        </div>
                        <div className="shrink-0 text-xs text-black/50 dark:text-white/50">
                          {timeAgoShort(it.created_at)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-xs text-black/60 dark:text-white/60">
                          {sub || "—"}
                        </div>

                        {l?.price != null ? (
                          <div className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-900 dark:text-emerald-100">
                            {moneyTR(l.price)} ₺
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFavorite(it.listing_id)}
                    disabled={busy}
                    className={[
                      "shrink-0 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-extrabold text-black/70 hover:bg-white transition",
                      "dark:border-white/10 dark:bg-black/30 dark:text-white/75 dark:hover:bg-black/20",
                      busy ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    title="Favorilerden kaldır"
                  >
                    {busy ? "…" : "Kaldır"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/conversations"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition text-center"
        >
          Mesajlar
        </Link>
        <Link
          href="/my-listings"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition text-center"
        >
          İlanlarım
        </Link>
      </div>
    </div>
  );
}