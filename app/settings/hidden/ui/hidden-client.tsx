"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type HiddenRow = {
  id: number;
  user_id: string;
  listing_id: string;
  created_at: string;
};

type ListingMini = {
  id: string;
  title: string | null;
  price: number | null;
  city: string | null;
  district: string | null;
  image_url: string | null;
  created_at: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function timeAgoShort(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g`;
  if (hr > 0) return `${hr}s`;
  if (min > 0) return `${min}dk`;
  return "az önce";
}

export default function HiddenClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  // optional: ?next=/settings
  const next = useMemo(() => (sp.get("next") || "/settings").trim(), [sp]);

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const [hidden, setHidden] = useState<HiddenRow[]>([]);
  const [items, setItems] = useState<Record<string, ListingMini>>({});

  async function load() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;
      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/settings/hidden")}`);
        return;
      }
      setMyId(uid);

      // ✅ 1) hidden list
      // table name varsayımı: hidden_listings(user_id, listing_id, created_at)
      const { data: hs, error: he } = await supabase
        .from("hidden_listings")
        .select("id,user_id,listing_id,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (he) throw he;

      const hlist = (hs ?? []) as HiddenRow[];
      setHidden(hlist);

      const ids = Array.from(new Set(hlist.map((x) => String(x.listing_id)).filter(Boolean)));

      if (!ids.length) {
        setItems({});
        return;
      }

      // ✅ 2) listing mini
      // listings tablonun alanlarına göre select'i ayarla
      const { data: ls, error: le } = await supabase
        .from("listings")
        .select("id,title,price,city,district,image_url,created_at")
        .in("id", ids);

      if (le) throw le;

      const map: Record<string, ListingMini> = {};
      (ls ?? []).forEach((x: any) => (map[String(x.id)] = x as ListingMini));
      setItems(map);
    } catch (e: any) {
      toast({ variant: "error", title: "Yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  async function unhide(listingId: string) {
    const uid = myId;
    if (!uid) return;

    // optimistic
    const prevHidden = hidden;
    setHidden((p) => p.filter((x) => String(x.listing_id) !== String(listingId)));

    const { error } = await supabase
      .from("hidden_listings")
      .delete()
      .eq("user_id", uid)
      .eq("listing_id", listingId);

    if (error) {
      setHidden(prevHidden);
      toast({ variant: "error", title: "İşlem başarısız", message: error.message });
      return;
    }

    toast({ variant: "success", title: "Geri alındı", message: "İlan gizliden çıkarıldı." });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Gizlenen İlanlar</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Gizlediğin ilanlar burada. İstersen geri alabilirsin.
          </div>
        </div>

        <Link
          href={next || "/settings"}
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
        >
          ← Geri
        </Link>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : hidden.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Gizlenen ilan yok.</div>
        ) : (
          <div className="space-y-2">
            {hidden.map((h) => {
              const it = items[String(h.listing_id)];
              const title = (it?.title ?? "İlan").trim() || "İlan";
              const place = [it?.city, it?.district].filter(Boolean).join(" / ");
              const price = typeof it?.price === "number" ? `${it.price.toLocaleString("tr-TR")} ₺` : "";

              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <Link
                    href={it?.id ? `/listing/${it.id}` : "#"}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {it?.image_url ? (
                        <img src={it.image_url} alt="img" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-black/60 dark:text-white/60">
                          HA
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">
                          {title}
                        </div>
                        <div className="shrink-0 text-xs text-black/50 dark:text-white/50">
                          {timeAgoShort(h.created_at)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-xs text-black/60 dark:text-white/60">
                          {place || "—"}
                        </div>
                        {price ? (
                          <div className="shrink-0 text-xs font-black text-black/70 dark:text-white/75">
                            {price}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => unhide(String(h.listing_id))}
                    className={clsx(
                      "rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
                    )}
                  >
                    Geri Al
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs font-semibold text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Not: Bu sayfa Supabase tablosu <b>hidden_listings</b> ve <b>listings</b> mini alanlarını kullanır.
        Eğer sende tablo isimleri farklıysa yaz, 10 sn’de uyarlayayım.
      </div>
    </div>
  );
}