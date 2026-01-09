"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type FavRow = {
  id: number;
  user_id: string;
  listing_id: string;
  created_at: string;
};

type ListingMini = {
  id: string;
  title: string | null;
  price: number | null;
  currency: string | null;
  cover_url: string | null;
  city: string | null;
  district: string | null;
  created_at: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function bust(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return "";
  const hasQ = u.includes("?");
  return `${u}${hasQ ? "&" : "?"}t=${Date.now()}`;
}

// basit: /favorites?tab=all|listings (ileride büyütürsün)
function safeTab(v: string | null) {
  if (!v) return "all";
  if (!["all", "listings"].includes(v)) return "all";
  return v as "all" | "listings";
}

export default function FavoritesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  const tab = useMemo(() => safeTab(sp.get("tab")), [sp]);

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const [favRows, setFavRows] = useState<FavRow[]>([]);
  const [listings, setListings] = useState<Record<string, ListingMini>>({});

  async function load() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;

      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/favorites")}`);
        return;
      }
      setMyId(uid);

      // ✅ favorites tablonu isimlendirmene göre değiştir:
      // Eğer senin tablonda isim farklıysa burayı söyle düzeltirim.
      const { data: f, error: fe } = await supabase
        .from("favorites")
        .select("id,user_id,listing_id,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (fe) throw fe;

      const favs = (f ?? []) as FavRow[];
      setFavRows(favs);

      const ids = Array.from(new Set(favs.map((x) => String(x.listing_id)).filter(Boolean)));

      if (!ids.length) {
        setListings({});
        return;
      }

      // ✅ listings tablon senin projede farklı isimdeyse düzelt:
      const { data: ls, error: le } = await supabase
        .from("listings")
        .select("id,title,price,currency,cover_url,city,district,created_at")
        .in("id", ids);

      if (le) throw le;

      const map: Record<string, ListingMini> = {};
      (ls ?? []).forEach((x: any) => (map[String(x.id)] = x as ListingMini));
      setListings(map);
    } catch (e: any) {
      toast({ variant: "error", title: "Favoriler yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  async function removeFav(listingId: string) {
    const uid = myId;
    if (!uid) return;

    // optimistic
    const prev = favRows;
    setFavRows((p) => p.filter((x) => String(x.listing_id) !== String(listingId)));

    const { error } = await supabase.from("favorites").delete().eq("user_id", uid).eq("listing_id", listingId);

    if (error) {
      setFavRows(prev);
      toast({ variant: "error", title: "Silinemedi", message: error.message });
      return;
    }

    toast({ variant: "success", title: "Kaldırıldı", message: "Favorilerden çıkarıldı." });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => {
    return favRows
      .map((f) => {
        const l = listings[String(f.listing_id)];
        return { f, l };
      })
      .filter((x) => (tab === "all" ? true : !!x.l));
  }, [favRows, listings, tab]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Favoriler</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">Beğendiğin ilanlar burada.</div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/favorites?tab=all"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              tab === "all"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Tümü
          </Link>

          <Link
            href="/favorites?tab=listings"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              tab === "listings"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            İlanlar
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
          >
            ← Geri
          </Link>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Favori yok.</div>
        ) : (
          <div className="space-y-2">
            {items.map(({ f, l }) => {
              const title = l?.title?.trim() || "İlan";
              const loc = [l?.city, l?.district].filter(Boolean).join(" / ");
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <Link
                    href={l ? `/listing/${l.id}` : "#"}
                    className={clsx("flex min-w-0 flex-1 items-center gap-3", !l && "pointer-events-none opacity-70")}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                      {l?.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bust(l.cover_url)} alt="Cover" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/60 dark:text-white/60">
                          ❤️
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">{title}</div>
                      <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">
                        {loc || "—"}
                        {l?.price != null ? (
                          <>
                            {" "}
                            • <b className="text-black/75 dark:text-white/75">{l.price}</b>{" "}
                            <span className="opacity-80">{l.currency ?? "TL"}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFav(String(f.listing_id))}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
                  >
                    Kaldır
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-black/45 dark:text-white/45">
        Not: Eğer tabloların adı <b>favorites</b> / <b>listings</b> değilse söyle, 2 satırda düzeltirim.
      </div>
    </div>
  );
}