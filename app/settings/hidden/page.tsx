"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

const LS_HIDE = "halapp_hide_listing_ids_v1";
const EVT_LOCAL_UPDATED = "halapp:local-filters-updated";

type HiddenListingInfo = {
  id: string;
  title: string | null;
  product_name: string | null;
  city: string | null;
  district: string | null;
  market_name: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black">{title}</div>
          {desc ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">
              {desc}
            </div>
          ) : null}
        </div>

        <Link
          href="/settings"
          className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
        >
          Geri
        </Link>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function readLSSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    const out = new Set<string>();
    if (Array.isArray(arr)) {
      for (const v of arr) {
        const s = String(v ?? "").trim();
        if (s) out.add(s);
      }
    }
    return out;
  } catch {
    return new Set();
  }
}

function writeLSSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

function safeText(v: any, fallback = "—") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

async function fetchHiddenListings(ids: string[]): Promise<HiddenListingInfo[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("listings")
    .select("id,title,product_name,city,district,market_name")
    .in("id", ids);

  if (error) {
    // veri gelmezse bile listede id gösterelim
    return ids.map((id) => ({ id, title: null, product_name: null, city: null, district: null, market_name: null }));
  }

  const rows = Array.isArray(data) ? data : [];
  const map = new Map<string, HiddenListingInfo>();
  for (const r of rows as any[]) {
    const id = String(r?.id ?? "").trim();
    if (!id) continue;
    map.set(id, {
      id,
      title: r?.title ?? null,
      product_name: r?.product_name ?? null,
      city: r?.city ?? null,
      district: r?.district ?? null,
      market_name: r?.market_name ?? null,
    });
  }

  // sıralamayı local id sırasıyla koru
  return ids.map((id) => map.get(id) ?? { id, title: null, product_name: null, city: null, district: null, market_name: null });
}

export default function HiddenListingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HiddenListingInfo[]>([]);
  const [ids, setIds] = useState<string[]>([]);

  async function refresh() {
    const set = readLSSet(LS_HIDE);
    const list = Array.from(set);
    setIds(list);
    if (!list.length) {
      setItems([]);
      return;
    }
    const info = await fetchHiddenListings(list);
    setItems(info);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // login kontrol (settings ekranı gibi)
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id ?? null;
        if (!uid) {
          router.replace(`/auth?next=${encodeURIComponent("/settings/hidden")}`);
          return;
        }
        if (!alive) return;
        await refresh();
      } finally {
        if (alive) setLoading(false);
      }
    })();

    function onStorage(e: StorageEvent) {
      if (e.key === LS_HIDE) refresh();
    }
    function onLocalUpdated() {
      refresh();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT_LOCAL_UPDATED, onLocalUpdated as any);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT_LOCAL_UPDATED, onLocalUpdated as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function unhideOne(listingId: string) {
    const set = readLSSet(LS_HIDE);
    set.delete(String(listingId));
    writeLSSet(LS_HIDE, set);
    window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
    toast({ variant: "success", title: "Geri alındı", message: "İlan tekrar görünecek.", durationMs: 1200 });
  }

  function clearAll() {
    writeLSSet(LS_HIDE, new Set());
    window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
    toast({ variant: "success", title: "Temizlendi", message: "Gizlenen ilanlar sıfırlandı.", durationMs: 1200 });
  }

  const count = ids.length;

  const body = useMemo(() => {
    if (loading) {
      return (
        <div className="rounded-3xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          Yükleniyor…
        </div>
      );
    }

    if (count === 0) {
      return (
        <div className="rounded-3xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          Gizlenen ilan yok ✅
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-black/55 dark:text-white/55">
            Toplam <b>{count}</b> ilan gizli
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
          >
            Tümünü geri al
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {ids.map((id) => {
            const info = items.find((x) => x.id === id) ?? null;
            const title = safeText(info?.product_name || info?.title, "İlan");
            const loc = [info?.city, info?.district].filter(Boolean).join(" / ") || "—";
            const market = info?.market_name?.trim() ? ` • ${info.market_name}` : "";

            return (
              <div
                key={id}
                className="rounded-3xl border border-black/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-black/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-black/90 dark:text-white/90">
                      {title}
                    </div>
                    <div className="mt-1 text-xs text-black/55 dark:text-white/55">
                      {loc}
                      {market}
                    </div>
                    <div className="mt-1 text-[11px] text-black/45 dark:text-white/45">
                      ID: <span className="font-mono">{id.slice(0, 8)}…</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/listing/${id}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                    >
                      Detay →
                    </Link>

                    <button
                      type="button"
                      onClick={() => unhideOne(id)}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-black hover:bg-emerald-400 transition"
                    >
                      Geri al
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-3xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
          Not: Gizleme bu cihazda tutulur (localStorage). Başka cihazda görünmez.
        </div>
      </>
    );
  }, [loading, count, ids, items]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card title="Gizlenen İlanlar" desc="Gizlediğin ilanları buradan geri alabilirsin.">
        {body}
      </Card>
    </div>
  );
}