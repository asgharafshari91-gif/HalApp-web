// app/pazar/[id]/ui/pazar-detail-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useMe } from "@/lib/me";
import { supabase } from "@/lib/supabaseClient";

type Photo = {
  url: string | null;
  thumb_url: string | null;
  media_type: string | null;
};

type SellerMini = {
  id: string;
  name: string;
  avatar_url?: string | null;
  phone?: string | null;
};

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
  seller: SellerMini | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function safeUrl(u: any) {
  const s = String(u ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return s;
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
  const mins = Math.floor(diff / (60 * 1000));
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(diff / (60 * 60 * 1000));
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days} gün önce`;
}

function initials(name?: string | null) {
  const s = String(name ?? "").trim();
  if (!s) return "S";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "S";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

function isImage(u?: string | null) {
  if (!u) return false;
  const x = u.toLowerCase();
  return (
    x.includes(".jpg") ||
    x.includes(".jpeg") ||
    x.includes(".png") ||
    x.includes(".webp") ||
    x.includes(".gif") ||
    x.startsWith("data:image/")
  );
}

function pickPhotos(photos?: Photo[] | null) {
  const arr = (photos ?? []).filter(Boolean);
  const normalized = arr
    .map((p) => ({
      url: safeUrl(p.url),
      thumb_url: safeUrl(p.thumb_url),
      media_type: p.media_type ?? null,
    }))
    .filter((p) => p.url || p.thumb_url);

  const gallery = normalized
    .map((p) => p.thumb_url || p.url)
    .filter(Boolean) as string[];

  const cover = gallery[0] ?? null;
  return { cover, gallery: gallery.slice(0, 12) };
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-black/10 bg-white/95 shadow-[0_30px_120px_rgba(0,0,0,.35)] dark:border-white/10 dark:bg-zinc-950/95">
        <div className="flex items-center justify-between gap-2 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="text-sm font-black">{title}</div>
          <button
            onClick={onClose}
            className="rounded-2xl bg-black/5 px-3 py-2 text-xs font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Kapat
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="h-6 w-2/3 rounded-xl bg-black/10 dark:bg-white/10" />
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="h-7 w-24 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-7 w-28 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-7 w-32 rounded-full bg-black/10 dark:bg-white/10" />
        </div>
        <div className="mt-4 h-72 w-full rounded-[22px] bg-black/10 dark:bg-white/10" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[22px] border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-4 w-28 rounded-lg bg-black/10 dark:bg-white/10" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-20 rounded-2xl bg-black/10 dark:bg-white/10" />
            <div className="h-20 rounded-2xl bg-black/10 dark:bg-white/10" />
          </div>
        </div>
        <div className="rounded-[22px] border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="h-4 w-24 rounded-lg bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-16 rounded-2xl bg-black/10 dark:bg-white/10" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="h-12 rounded-2xl bg-black/10 dark:bg-white/10" />
            <div className="h-12 rounded-2xl bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PazarDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const me = useMe();

  const [item, setItem] = useState<Listing | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [busyFav, setBusyFav] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const [openMore, setOpenMore] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [busyReport, setBusyReport] = useState(false);
  const [busyBlock, setBusyBlock] = useState(false);

  const myId = useMemo(() => {
    const p: any = me.profile ?? null;
    return (p?.id ?? p?.user_id ?? p?.uid ?? null) as string | null;
  }, [me.profile]);

  const isMine = useMemo(() => {
    if (!myId) return false;
    const sid = item?.seller_id ?? item?.seller?.id ?? null;
    return Boolean(sid && sid === myId);
  }, [myId, item]);

  const location = useMemo(() => {
    const parts = [item?.city, item?.district, item?.neighborhood].filter(Boolean);
    return parts.join(" / ");
  }, [item]);

  const priceText = useMemo(() => {
    const p = item?.price ?? item?.price_per_unit;
    if (p == null) return "—";
    const unit = item?.unit ? ` / ${item.unit}` : "";
    return `${fmtMoney(p)} ₺${unit}`;
  }, [item]);

  const productBadge = useMemo(() => {
    const p = (item?.product_name || item?.product_type || "").trim();
    return p || null;
  }, [item]);

  const { cover, gallery } = useMemo(() => pickPhotos(photos), [photos]);

  const mainPhoto = activePhoto || cover;

  useEffect(() => {
    setActivePhoto(null);
  }, [id]);

  async function fetchDetail(signal?: AbortSignal) {
    if (!id?.trim()) throw new Error("missing_id");

    const r = await fetch(`/api/pazar/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "detail_failed");
    return (j.item ?? null) as Listing | null;
  }

  async function fetchMedia(signal?: AbortSignal) {
    // ✅ Eğer sende bu endpoint yoksa sorun değil: boş döner
    try {
      const r = await fetch(`/api/pazar/${encodeURIComponent(id)}/media`, {
        cache: "no-store",
        signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return [];
      const arr: any[] = Array.isArray(j?.items) ? j.items : Array.isArray(j?.photos) ? j.photos : [];
      return arr.map((x) => ({
        url: safeUrl(x?.url ?? x?.public_url ?? x?.media_url ?? null),
        thumb_url: safeUrl(x?.thumb_url ?? x?.thumb ?? null),
        media_type: (x?.media_type ?? x?.type ?? null) as string | null,
      })) as Photo[];
    } catch {
      return [];
    }
  }

  async function fetchFavorites(signal?: AbortSignal) {
    const rf = await fetch(`/api/pazar/favorites`, { cache: "no-store", signal });
    const jf = await rf.json().catch(() => ({}));
    const ids: string[] = Array.isArray(jf?.ids) ? jf.ids : [];
    return ids;
  }

  async function refetchAll() {
    const ac = new AbortController();
    try {
      setLoading(true);
      setErr(null);

      const [it, media, favIds] = await Promise.all([
        fetchDetail(ac.signal),
        fetchMedia(ac.signal),
        fetchFavorites(ac.signal),
      ]);

      setItem(it);
      setPhotos(media);
      setFav(favIds.includes(id));

      const first = pickPhotos(media).cover;
      setActivePhoto(first);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }

  useEffect(() => {
    let stop = false;

    (async () => {
      if (stop) return;
      await refetchAll();
    })();

    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Realtime: listings + listing_media değişince otomatik yenile
  useEffect(() => {
    if (!id) return;

    const ch = supabase
      .channel(`pazar-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings", filter: `id=eq.${id}` },
        () => refetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listing_media", filter: `listing_id=eq.${id}` },
        () => refetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleFav() {
    try {
      setBusyFav(true);
      const r = await fetch(`/api/pazar/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j?.error === "not_authed") {
          toast({ variant: "info", title: "Giriş gerekli", message: "Favoriye eklemek için giriş yap." });
          router.push(`/auth?next=${encodeURIComponent(`/pazar/${id}`)}`);
          return;
        }
        throw new Error(j?.error || "favorite_failed");
      }
      setFav(Boolean(j.favorited));
    } catch (e: any) {
      toast({ variant: "error", title: "Favori hatası", message: e?.message ?? "İşlem başarısız." });
    } finally {
      setBusyFav(false);
    }
  }

  async function copyLink() {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      toast({ variant: "success", title: "Kopyalandı", message: "İlan linki panoya kopyalandı." });
    } catch {
      toast({ variant: "info", title: "Kopyalanamadı", message: "Tarayıcı izin vermedi." });
    }
  }

  function goMessage() {
    const sid = item?.seller?.id ?? item?.seller_id ?? "";
    if (!sid) return;
    router.push(`/conversations/new?to=${encodeURIComponent(sid)}&listing=${encodeURIComponent(id)}`);
  }

  function goCall() {
    const phone = item?.seller?.phone?.trim();
    if (!phone) {
      toast({ variant: "info", title: "Telefon yok", message: "Satıcı telefon bilgisi paylaşmamış." });
      return;
    }
    window.location.href = `tel:${phone}`;
  }

  async function deleteListing() {
    try {
      setBusyDelete(true);
      const r = await fetch(`/api/pazar/${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "delete_failed");

      toast({ variant: "success", title: "Silindi", message: "İlan kaldırıldı." });
      router.push("/pazar");
      router.refresh();
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Silinemedi",
        message: e?.message ?? "API silme endpoint'i yok/çalışmıyor olabilir.",
      });
    } finally {
      setBusyDelete(false);
      setOpenConfirmDelete(false);
    }
  }

  async function reportListing(reason: string) {
    try {
      setBusyReport(true);
      const r = await fetch(`/api/pazar/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: id, reason }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "report_failed");
      toast({ variant: "success", title: "Bildirildi", message: "Şikayet alındı. İncelenecek." });
      setOpenMore(false);
    } catch (e: any) {
      toast({ variant: "error", title: "Şikayet başarısız", message: e?.message ?? "İşlem yapılamadı." });
    } finally {
      setBusyReport(false);
    }
  }

  async function blockSeller() {
    const sid = item?.seller?.id ?? item?.seller_id ?? null;
    if (!sid) return;
    try {
      setBusyBlock(true);
      const r = await fetch(`/api/users/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: sid }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "block_failed");
      toast({ variant: "success", title: "Engellendi", message: "Bu kullanıcıyı artık görmeyeceksin." });
      setOpenMore(false);
      router.push("/pazar");
    } catch (e: any) {
      toast({ variant: "error", title: "Engellenemedi", message: e?.message ?? "İşlem yapılamadı." });
    } finally {
      setBusyBlock(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* quick nav */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/pazar"
          className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          ← Pazara dön
        </Link>

        <div className="flex items-center gap-2">
          <button
            disabled={busyFav}
            onClick={toggleFav}
            className={clsx(
              "rounded-2xl px-4 py-2 text-sm font-black transition",
              fav ? "bg-rose-500/15 text-rose-700 dark:text-rose-200" : "bg-black/5 text-black/70 dark:bg-white/5 dark:text-white/70",
              busyFav ? "cursor-not-allowed opacity-60" : "hover:bg-black/10 dark:hover:bg-white/10"
            )}
            title="Favori"
          >
            {fav ? "❤️" : "🤍"} Favori
          </button>

          <button
            onClick={() => setOpenMore(true)}
            className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            title="İşlemler"
          >
            ⋯
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : err ? (
        <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-700 dark:text-rose-200">
          API Hatası: {err}
        </div>
      ) : !item ? (
        <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
          İlan bulunamadı.
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl font-black text-black/90 dark:text-white/95">{item.title}</div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-800 dark:text-emerald-200">
                    {item.post_type?.toUpperCase() || "İLAN"}
                  </span>

                  {item.is_boosted ? (
                    <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-yellow-800 dark:text-yellow-200">
                      GOLD
                    </span>
                  ) : null}

                  {productBadge ? (
                    <span className="max-w-[180px] truncate rounded-full bg-black/5 px-3 py-1 text-black/70 dark:bg-white/5 dark:text-white/70">
                      {productBadge}
                    </span>
                  ) : null}

                  {item.created_at ? (
                    <span className="rounded-full bg-black/5 px-3 py-1 text-black/70 dark:bg-white/5 dark:text-white/70">
                      ⏱ {timeAgo(item.created_at)}
                    </span>
                  ) : null}

                  {location ? (
                    <span className="max-w-[240px] truncate rounded-full bg-black/5 px-3 py-1 text-black/70 dark:bg-white/5 dark:text-white/70">
                      📍 {location}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 rounded-[20px] border border-black/10 bg-emerald-500/10 px-4 py-3 dark:border-white/10">
                <div className="text-[11px] font-black text-black/60 dark:text-white/60">Fiyat</div>
                <div className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">{priceText}</div>
              </div>
            </div>

            {/* Photos */}
            <div className="mt-4 overflow-hidden rounded-[22px] border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
              {mainPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainPhoto} alt="cover" className="h-80 w-full object-cover" />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-black/40 dark:text-white/40">
                  Fotoğraf yok
                </div>
              )}
            </div>

            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((u, idx) => (
                  <button
                    key={u + idx}
                    type="button"
                    onClick={() => setActivePhoto(u)}
                    className={clsx(
                      "shrink-0 overflow-hidden rounded-2xl border bg-black/5 dark:bg-white/5",
                      activePhoto === u
                        ? "border-emerald-500/60"
                        : "border-black/10 dark:border-white/10 hover:opacity-90"
                    )}
                    title="Foto seç"
                  >
                    {isImage(u) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u} alt={`thumb-${idx}`} className="h-16 w-24 object-cover" />
                    ) : (
                      <div className="grid h-16 w-24 place-items-center text-xs font-black text-black/50 dark:text-white/50">
                        Dosya
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {/* quantities */}
            <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-sm font-black">📦 Stok / Limit</div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-black text-black/50 dark:text-white/50">Min</div>
                  <div className="mt-1 font-black">{item.min_quantity ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-black text-black/50 dark:text-white/50">Miktar</div>
                  <div className="mt-1 font-black">{item.quantity ?? "—"}</div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-black/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-black text-black/50 dark:text-white/50">Hal / Pazar</div>
                <div className="mt-1 font-black">{item.market_name || "—"}</div>
              </div>

              {/* quick info row */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-black text-black/50 dark:text-white/50">Birim</div>
                  <div className="mt-1 font-black">{item.unit || "—"}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-black text-black/50 dark:text-white/50">Tür</div>
                  <div className="mt-1 font-black">{item.product_type || item.product_name || "—"}</div>
                </div>
              </div>
            </div>

            {/* seller card */}
            <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-sm font-black">👤 Satıcı</div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex min-w-0 items-center gap-3">
                  {item.seller?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.seller.avatar_url}
                      alt="seller"
                      className="h-11 w-11 rounded-2xl object-cover bg-black/10 dark:bg-white/10"
                    />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-sm font-black text-emerald-800 dark:text-emerald-200">
                      {initials(item.seller?.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{item.seller?.name || "Satıcı"}</div>
                    <div className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">{location || "—"}</div>
                  </div>
                </div>

                {item.seller?.id ? (
                  <Link
                    href={`/users/${item.seller.id}`}
                    className="shrink-0 rounded-2xl bg-black/5 px-3 py-2 text-xs font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    Profil →
                  </Link>
                ) : null}
              </div>

              {/* actions */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {isMine ? (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push(`/my-listings?edit=${encodeURIComponent(id)}`)}
                      className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenConfirmDelete(true)}
                      className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400"
                    >
                      🗑️ Sil
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={goMessage}
                      className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400"
                    >
                      💬 Mesaj Gönder
                    </button>
                    <button
                      type="button"
                      onClick={goCall}
                      className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      📞 Ara
                    </button>
                  </>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                >
                  🔗 Link kopyala
                </button>

                {!isMine ? (
                  <button
                    type="button"
                    onClick={() => setOpenMore(true)}
                    className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                  >
                    ⚠️ Şikayet / Engelle
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* description */}
          <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-black">📝 Açıklama</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/80 dark:text-white/80">
              {item.description || "Açıklama yok."}
            </div>
          </div>
        </>
      )}

      {/* MORE modal */}
      <Modal open={openMore} title="İşlemler" onClose={() => setOpenMore(false)}>
        <div className="space-y-3">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Şikayet / engelle işlemleri API endpoint’lerine bağlıdır. (Endpoint yoksa toast ile hata görürsün.)
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busyReport}
              onClick={() => reportListing("spam_or_fake")}
              className={clsx(
                "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
                busyReport ? "cursor-not-allowed opacity-60" : ""
              )}
            >
              🚩 Sahte / Spam
            </button>

            <button
              type="button"
              disabled={busyReport}
              onClick={() => reportListing("wrong_price_or_info")}
              className={clsx(
                "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
                busyReport ? "cursor-not-allowed opacity-60" : ""
              )}
            >
              🧾 Yanlış bilgi
            </button>

            <button
              type="button"
              disabled={busyReport}
              onClick={() => reportListing("illegal_or_abuse")}
              className={clsx(
                "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
                busyReport ? "cursor-not-allowed opacity-60" : ""
              )}
            >
              ⛔ Uygunsuz
            </button>

            <button
              type="button"
              disabled={busyBlock}
              onClick={blockSeller}
              className={clsx(
                "rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400",
                busyBlock ? "cursor-not-allowed opacity-60" : ""
              )}
            >
              🚫 Satıcıyı engelle
            </button>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="w-full rounded-2xl bg-black/5 px-4 py-3 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            🔗 Link kopyala
          </button>
        </div>
      </Modal>

      {/* delete confirm */}
      <Modal open={openConfirmDelete} title="İlanı sil?" onClose={() => setOpenConfirmDelete(false)}>
        <div className="space-y-3">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
            Bu işlem geri alınamaz. İlan kaldırılacak.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpenConfirmDelete(false)}
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
            >
              Vazgeç
            </button>

            <button
              type="button"
              disabled={busyDelete}
              onClick={deleteListing}
              className={clsx(
                "rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400",
                busyDelete ? "cursor-not-allowed opacity-60" : ""
              )}
            >
              {busyDelete ? "Siliniyor…" : "Evet, sil"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}