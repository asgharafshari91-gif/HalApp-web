"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import type { Listing } from "@/lib/types";
import { safeText, formatUnitPrice } from "@/lib/format";

const HIDDEN_TABLE = "hidden_listings";
const EVT_LOCAL_UPDATED = "halapp:local-filters-updated";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function timeAgo(iso?: string | null) {
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
  return "az";
}

function pillTR(postType?: string | null) {
  const v = (postType ?? "").toLowerCase().trim();
  if (!v) return "İlan";
  if (v.includes("buy") || v.includes("talep")) return "Talep";
  if (v.includes("sell") || v.includes("ürün") || v.includes("urun") || v.includes("product")) return "Ürün";
  return "İlan";
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      {children}
    </span>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-black tracking-tight">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

type HiddenRow = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};

function ListingMiniCard({
  item,
  hiddenAt,
  onUnhide,
}: {
  item: Listing;
  hiddenAt?: string | null;
  onUnhide: (listingId: string) => void;
}) {
  const id = String((item as any).id);
  const title = safeText((item as any).product_name || (item as any).title, "İlan");
  const typeLabel = pillTR((item as any).post_type);
  const created = timeAgo((item as any).created_at ?? null);
  const hiddenAgo = timeAgo(hiddenAt ?? null);

  const locLine =
    [String((item as any).city ?? ""), String((item as any).district ?? "")]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" / ") || "—";

  const priceLine = formatUnitPrice(
    (item as any).price_per_unit ?? (item as any).price,
    (item as any).unit
  );

  const boosted = Boolean((item as any).is_boosted);

  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-[26px] border border-black/10 bg-white/80 p-4",
        "shadow-[0_14px_40px_rgba(0,0,0,0.06)] transition",
        "hover:-translate-y-[1px] hover:shadow-[0_18px_55px_rgba(0,0,0,0.10)]",
        "dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -inset-10 bg-[radial-gradient(circle_at_25%_15%,rgba(34,197,94,.12),transparent_55%)]" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{typeLabel}</Chip>
          {created ? <Chip>İlan: {created}</Chip> : null}
          {hiddenAgo ? <Chip>Gizleme: {hiddenAgo}</Chip> : null}
          {boosted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
              ✨ Boost
            </span>
          ) : null}
        </div>

        <button
          onClick={() => onUnhide(id)}
          className={clsx(
            "rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/70 hover:bg-black/10 transition",
            "dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
          )}
        >
          Geri al
        </button>
      </div>

      <div className="relative mt-3">
        <div className="truncate text-[15px] font-black text-black/90 dark:text-white/90">
          {title}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-black/55 dark:text-white/55">
          <span className="truncate">{locLine}</span>
          {(item as any).market_name ? <span className="truncate">• {(item as any).market_name}</span> : null}
          {(item as any).neighborhood ? <span className="truncate">• {(item as any).neighborhood}</span> : null}
        </div>

        <div className="mt-2 text-[13px] font-extrabold text-emerald-800 dark:text-emerald-200">
          {priceLine}
        </div>

        {String((item as any).description ?? "").trim() ? (
          <div className="mt-2 line-clamp-2 text-sm text-black/70 dark:text-white/70">
            {String((item as any).description)}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/listing/${id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400 transition"
          >
            Detaya git →
          </Link>

          <Link
            href={`/my-listings/edit?id=${encodeURIComponent(id)}`}
            className={clsx(
              "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-extrabold text-black/75 hover:bg-white transition",
              "dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
            )}
          >
            Düzenle
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HiddenClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HiddenRow[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "2-digit" });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as any });
  }, []);

  async function requireLogin() {
    const { data } = await supabase.auth.getSession();
    const myId = data.session?.user?.id;
    if (!myId) {
      toast({ variant: "warning", title: "Giriş gerekli", message: "Bu sayfayı görmek için giriş yapmalısın." });
      router.replace(`/auth?next=${encodeURIComponent("/settings/hidden")}`);
      return null;
    }
    return myId;
  }

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const myId = await requireLogin();
      if (!myId) return;

      // 1) Gizleme kayıtları
      const { data: hidden, error: hiddenErr } = await supabase
        .from(HIDDEN_TABLE)
        .select("id,user_id,listing_id,created_at")
        .eq("user_id", myId)
        .order("created_at", { ascending: false });

      if (hiddenErr) throw hiddenErr;

      const hiddenRows = (hidden ?? []) as HiddenRow[];
      setRows(hiddenRows);

      const ids = hiddenRows.map((r) => r.listing_id).filter(Boolean);
      if (!ids.length) {
        setListings([]);
        return;
      }

      // 2) İlan detaylarını çek (soft delete filtreli)
      const { data: lst, error: lstErr } = await supabase
        .from("listings")
        .select(
          [
            "id",
            "title",
            "description",
            "product_type",
            "city",
            "district",
            "neighborhood",
            "market_name",
            "price_per_unit",
            "unit",
            "min_quantity",
            "quantity",
            "is_active",
            "is_boosted",
            "expires_at",
            "created_at",
            "updated_at",
            "seller_id",
            "post_type",
            "product_name",
            "price",
            "min_price",
            "max_price",
            "deleted_at",
            "boost_until",
            "boost_score",
            "media_urls",
            "media_types",
          ].join(",")
        )
        .in("id", ids)
        .is("deleted_at", null);

      if (lstErr) throw lstErr;

      // 3) Gizleme sırasını koru
      const map = new Map<string, any>();
      (lst ?? []).forEach((x: any) => map.set(String(x.id), x));
      const ordered = ids.map((id) => map.get(String(id))).filter(Boolean);

      setListings(ordered as Listing[]);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Yüklenemedi.");
      toast({ variant: "error", title: "Yüklenemedi", message: e?.message ?? "Bir hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unhide(listingId: string) {
    try {
      const { data } = await supabase.auth.getSession();
      const myId = data.session?.user?.id;
      if (!myId) {
        toast({ variant: "warning", title: "Giriş gerekli", message: "Bu işlem için giriş yapmalısın." });
        return;
      }

      const { error } = await supabase
        .from(HIDDEN_TABLE)
        .delete()
        .eq("user_id", myId)
        .eq("listing_id", listingId);

      if (error) throw error;

      toast({ variant: "success", title: "Geri alındı", message: "İlan tekrar görünecek.", durationMs: 1400 });

      if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
      await load();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "error", title: "Olmadı", message: e?.message ?? "Geri alma başarısız." });
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* HERO */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tight">Gizlenen İlanlar</div>
            <div className="mt-2 text-sm text-black/60 dark:text-white/60">
              Gizlediğin ilanlar burada. İstersen tek dokunuşla geri alabilirsin.{" "}
              <span className="ml-2 opacity-80">({today})</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/settings"
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
              >
                ← Ayarlar
              </Link>

              <button
                onClick={load}
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
              >
                Yenile
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Özet</div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70 leading-6">
              Toplam gizlenen: <b>{rows.length}</b>
              <div className="mt-1 text-xs text-black/50 dark:text-white/50">
                Kaynak: <code className="font-mono">public.hidden_listings</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-800 dark:text-rose-200">
          {err}
          <div className="mt-2 text-xs text-rose-800/70 dark:text-rose-200/70">
            Eğer “schema cache / could not find table” görürsen: tablo adı <b>public.hidden_listings</b> olmalı ve RLS policy
            select/insert/delete izinleri açık olmalı.
          </div>
        </div>
      ) : null}

      <Card title="Liste" subtitle="Gizlediğin ilanlar — gizleme sırasına göre (en yeni üstte).">
        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm font-semibold text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            Yükleniyor…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm font-semibold text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            Gizlenen ilan yok.
            <div className="mt-2 text-xs text-black/50 dark:text-white/50">
              DB’de satır yoksa: ilan kartındaki “Bu ilanı gizle” aksiyonu Supabase’e <b>insert/upsert</b> atmıyor demektir.
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {listings.map((it) => {
              const row = rows.find((r) => String(r.listing_id) === String((it as any).id));
              return (
                <ListingMiniCard
                  key={String((it as any).id)}
                  item={it}
                  hiddenAt={row?.created_at ?? null}
                  onUnhide={unhide}
                />
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Kontrol Listesi" subtitle="Gizleme çalışmıyorsa en sık 3 sebep:">
        <ol className="list-decimal pl-5 space-y-2 text-sm text-black/70 dark:text-white/70">
          <li>Gizleme butonu sadece <b>localStorage</b> yazıyor (DB’ye insert yok) → Supabase’de satır oluşmaz.</li>
          <li>RLS policy insert/select/delete yok → insert başarısız olur veya select boş döner.</li>
          <li>Kayıt yanlış user_id ile atılmış → bu sayfa <code className="font-mono">.eq("user_id", myId)</code> ile çeker.</li>
        </ol>
      </Card>
    </div>
  );
}