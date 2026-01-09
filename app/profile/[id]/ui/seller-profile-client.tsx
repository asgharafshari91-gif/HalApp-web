"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { formatUnitPrice, safeText } from "@/lib/format";

const LS_BLOCK = "halapp_block_seller_ids_v1";

type SellerProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_premium: boolean | null;
  kyc_status: string | null;
  is_online: boolean | null;
  last_seen_at: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  product_name: string | null;
  post_type: string | null;

  city: string | null;
  district: string | null;
  market_name: string | null;

  price_per_unit: number | null;
  unit: string | null;

  created_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
  is_boosted: boolean | null;
  deleted_at: string | null;

  // opsiyonel (LiveGrid’den geliyordu, burada da varsa göster)
  cover_url?: string | null;
  cover_thumb?: string | null;

  // DB’de varsa: min/max/quantity vs kullanırsın
  quantity?: number | null;
  min_quantity?: number | null;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function isVerified(kycStatus: string | null | undefined) {
  const v = (kycStatus ?? "").toLowerCase().trim();
  return v === "approved" || v === "verified" || v === "ok";
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

function getLSSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveLSSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

function pillTR(postType?: string | null) {
  const v = (postType ?? "").toLowerCase().trim();
  if (!v) return "İlan";
  if (v.includes("buy") || v.includes("talep")) return "Talep";
  if (v.includes("sell") || v.includes("ürün") || v.includes("urun") || v.includes("product")) return "Ürün";
  return "İlan";
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8.5 12.2l2.3 2.3 4.8-5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Onaylı Satıcı
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-900 dark:text-amber-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 17.5l-6.2 3.3 1.2-7-5-4.9 7-1 3-6.3 3 6.3 7 1-5 4.9 1.2 7L12 17.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      Premium
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      {children}
    </span>
  );
}

export default function SellerProfileClient({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [items, setItems] = useState<ListingRow[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  const sellerName = useMemo(() => {
    const s = seller;
    const n = (s?.company_name?.trim() ? s?.company_name : s?.full_name) ?? "Satıcı";
    return n;
  }, [seller]);

  // local block state
  useEffect(() => {
    if (!sellerId) return;
    try {
      const set = getLSSet(LS_BLOCK);
      setBlocked(set.has(String(sellerId)));
    } catch {}
  }, [sellerId]);

  // load seller + listings
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        if (!sellerId || sellerId.length < 10) {
          setSeller(null);
          setItems([]);
          setLoading(false);
          return;
        }

        // 1) seller
        const { data: sData, error: sErr } = await supabase
          .from("profiles")
          .select("id, full_name, company_name, avatar_url, is_premium, kyc_status, is_online, last_seen_at")
          .eq("id", sellerId)
          .limit(1)
          .maybeSingle();

        if (!alive) return;
        if (sErr) throw sErr;

        const s = (sData ?? null) as any;
        setSeller(
          s
            ? {
                id: String(s.id ?? sellerId),
                full_name: s.full_name ?? null,
                company_name: s.company_name ?? null,
                avatar_url: s.avatar_url ?? null,
                is_premium: Boolean(s.is_premium),
                kyc_status: s.kyc_status ?? null,
                is_online: Boolean(s.is_online),
                last_seen_at: s.last_seen_at ?? null,
              }
            : null
        );

        // 2) listings
        const nowIso = new Date().toISOString();
        const { data: lData, error: lErr } = await supabase
          .from("listings")
          .select(
            `
            id,
            title,
            product_name,
            post_type,
            city,
            district,
            market_name,
            price_per_unit,
            unit,
            created_at,
            expires_at,
            is_active,
            is_boosted,
            deleted_at,
            cover_url,
            cover_thumb,
            quantity,
            min_quantity
          `
          )
          .is("deleted_at", null)
          .eq("seller_id", sellerId)
          .eq("is_active", true)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
          .order("is_boosted", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(60);

        if (!alive) return;
        if (lErr) throw lErr;

        setItems((Array.isArray(lData) ? lData : []) as any);
      } catch (e: any) {
        console.error(e);
        toast({
          variant: "error",
          title: "Profil yüklenemedi",
          message: e?.message ?? "Bir hata oluştu.",
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [sellerId, toast]);

  function toggleBlock() {
    try {
      const set = getLSSet(LS_BLOCK);
      const next = !set.has(String(sellerId));
      if (next) set.add(String(sellerId));
      else set.delete(String(sellerId));
      saveLSSet(LS_BLOCK, set);
      setBlocked(next);

      toast({
        variant: next ? "success" : "info",
        title: next ? "Satıcı engellendi" : "Engel kaldırıldı",
        message: next ? "Bu satıcının ilanları listelerde gizlenecek (local)." : "Satıcı tekrar görünecek.",
        durationMs: 1400,
      });

      // listeler anında güncellensin
      window.dispatchEvent(new Event("halapp:local-filters-updated"));
    } catch {
      toast({ variant: "error", title: "Olmadı", message: "Engel işlemi başarısız." });
    }
  }

  async function ensureLogin(nextUrl: string) {
    const { data } = await supabase.auth.getSession();
    const myId = data.session?.user?.id;
    if (myId) return myId;

    toast({ variant: "warning", title: "Giriş gerekli", message: "Bu işlem için giriş yapmalısın." });
    router.push(`/auth?next=${encodeURIComponent(nextUrl)}`);
    return null;
  }

  async function handleMessage() {
    try {
      setMsgLoading(true);

      const nextUrl = `/profile/${sellerId}`;
      const myId = await ensureLogin(nextUrl);
      if (!myId) return;

      if (myId === sellerId) {
        toast({ variant: "info", title: "Bilgi", message: "Kendi profilinle sohbet açamazsın." });
        return;
      }

      // RPC: get_or_create_conversation(p_user_a uuid, p_user_b uuid)
      const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
        p_user_a: myId,
        p_user_b: sellerId,
      });
      if (error) throw error;

      router.push(`/chat/user/${sellerId}?cid=${encodeURIComponent(String(convId))}`);

      toast({ variant: "success", title: "Sohbet hazır", message: "Mesaj ekranı açılıyor…", durationMs: 1200 });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "error", title: "Açılamadı", message: e?.message ?? "Mesaj ekranı açılamadı." });
    } finally {
      setMsgLoading(false);
    }
  }

  const verified = isVerified(seller?.kyc_status);
  const premium = Boolean(seller?.is_premium);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
        >
          <span className="text-lg leading-none">←</span> Geri
        </button>

        <Link
          href="/pazar"
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
        >
          Pazara dön →
        </Link>
      </div>

      {/* Header card */}
      <section
        className={cn(
          "relative overflow-hidden rounded-[30px] border border-black/10 bg-white/80 p-6",
          "shadow-[0_18px_60px_rgba(0,0,0,0.08)]",
          "dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_70px_rgba(0,0,0,0.55)]"
        )}
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 w-52 rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-4 h-14 w-14 rounded-2xl bg-black/10 dark:bg-white/10" />
            <div className="mt-4 h-4 w-64 rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-2 h-4 w-44 rounded bg-black/10 dark:bg-white/10" />
          </div>
        ) : !seller ? (
          <div className="text-sm font-bold text-black/70 dark:text-white/70">Satıcı bulunamadı.</div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative h-16 w-16 shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-3xl ring-1 ring-black/10 bg-black/5 dark:ring-white/10 dark:bg-white/5">
                  {seller.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={seller.avatar_url} alt={safeText(sellerName, "Profil")} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-black text-black/70 dark:text-white/80">
                      {initials(sellerName)}
                    </div>
                  )}
                </div>

                {seller.is_online ? (
                  <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-black" />
                ) : null}
              </div>

              {/* Meta */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-black text-black/95 dark:text-white/95">
                    {safeText(sellerName, "Satıcı")}
                  </h1>
                  {verified ? <VerifiedBadge /> : null}
                  {premium ? <PremiumBadge /> : null}
                  {blocked ? (
                    <span className="inline-flex items-center rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-extrabold text-red-700 dark:text-red-300">
                      Engelli
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-sm text-black/60 dark:text-white/60">
                  {seller.is_online
                    ? "Şu an online"
                    : seller.last_seen_at
                    ? `Son görülme: ${timeAgo(seller.last_seen_at)}`
                    : "—"}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip>{items.length} ilan</Chip>
                  {items.some((x) => Boolean(x.is_boosted)) ? <Chip>Gold ilan var</Chip> : null}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={msgLoading || !sellerId}
                onClick={handleMessage}
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
                  (msgLoading || !sellerId) && "opacity-60 cursor-not-allowed"
                )}
              >
                {msgLoading ? "Açılıyor..." : "Mesaj Gönder"}
              </button>

              <button
                type="button"
                onClick={toggleBlock}
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-5 py-3 text-sm font-extrabold text-black/70 hover:bg-black/10",
                  "dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
                )}
              >
                {blocked ? "Engeli kaldır" : "Satıcıyı engelle"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Listings */}
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-black text-black/90 dark:text-white/90">Satıcının ilanları</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">Aktif ilanlar listelenir</div>
          </div>

          {blocked ? (
            <span className="text-xs font-bold text-red-700 dark:text-red-300">
              Bu satıcı engelli — listelerde gizlenecek.
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[26px] border border-black/10 bg-white/70 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.06)] animate-pulse dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="h-28 w-full rounded-2xl bg-black/10 dark:bg-white/10" />
                <div className="mt-4 h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-2 h-4 w-48 rounded bg-black/10 dark:bg-white/10" />
                <div className="mt-6 h-10 w-full rounded-2xl bg-black/10 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[26px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-black text-black/90 dark:text-white/90">İlan yok</div>
            <div className="mt-2 text-sm text-black/60 dark:text-white/60">Bu satıcının şu an aktif ilanı görünmüyor.</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((x) => {
              const title = safeText(x.product_name || x.title, "İlan");
              const loc = [x.city, x.district].filter(Boolean).join(" / ") || "—";
              const cover = (x.cover_thumb || x.cover_url || "")?.trim() || null;
              const created = timeAgo(x.created_at);

              return (
                <Link
                  key={x.id}
                  href={`/listing/${x.id}`}
                  className={cn(
                    "group relative overflow-hidden rounded-[26px] border border-black/10 bg-white/80 p-4",
                    "shadow-[0_14px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_55px_rgba(0,0,0,0.10)]",
                    "dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
                  )}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -inset-10 bg-[radial-gradient(circle_at_25%_15%,rgba(34,197,94,.14),transparent_55%)]" />
                  </div>

                  {/* top chips */}
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>{pillTR(x.post_type)}</Chip>
                      {created ? <Chip>{created}</Chip> : null}
                      {x.is_boosted ? (
                        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/12 px-3 py-1 text-[11px] font-black text-amber-900 dark:text-amber-200">
                          Gold
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-200">Aç →</span>
                  </div>

                  {/* body */}
                  <div className="relative mt-3 flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-[11px] font-black text-black/45 dark:text-white/45">
                          Foto
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-black text-black/90 dark:text-white/90">{title}</div>
                      <div className="mt-1 truncate text-[12px] text-black/55 dark:text-white/55">
                        {loc}
                        {x.market_name ? ` • ${x.market_name}` : ""}
                      </div>

                      <div className="mt-2 text-[13px] font-extrabold text-emerald-800 dark:text-emerald-200">
                        {formatUnitPrice(x.price_per_unit, x.unit)}
                      </div>

                      {x.quantity ?? x.min_quantity ? (
                        <div className="mt-2 text-[12px] font-semibold text-black/55 dark:text-white/55">
                          Miktar: <b className="text-black/75 dark:text-white/75">{x.quantity ?? x.min_quantity}</b>{" "}
                          {(x.unit ?? "").trim()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}