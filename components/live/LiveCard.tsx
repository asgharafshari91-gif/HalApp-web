

"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import type { Listing } from "@/lib/types";

import {
  formatTRY,
  formatUnitPrice,
  safeText,
} from "@/lib/format";

import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

const FAV_TABLE = "listing_favorites";

const LS_HIDE = "halapp_hide_listing_ids_v1";
const LS_BLOCK = "halapp_block_seller_ids_v1";

const EVT_LOCAL_UPDATED =
  "halapp:local-filters-updated";

function initials(name?: string | null) {
  const v = (name ?? "").trim();

  if (!v) return "HA";

  const parts = v.split(/\s+/).slice(0, 2);

  return (
    parts.map((p) => p[0]?.toUpperCase()).join("") ||
    "HA"
  );
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
  const v = (postType ?? "")
    .toLowerCase()
    .trim();

  if (v.includes("buy")) return "Talep";

  if (
    v.includes("product") ||
    v.includes("ürün") ||
    v.includes("urun")
  ) {
    return "Ürün";
  }

  return "İlan";
}

function productEmoji(name?: string | null) {
  const n = (name ?? "").toLowerCase();

  if (n.includes("elma")) return "🍎";
  if (n.includes("portakal")) return "🍊";
  if (n.includes("limon")) return "🍋";
  if (n.includes("muz")) return "🍌";
  if (n.includes("çilek")) return "🍓";
  if (n.includes("karpuz")) return "🍉";
  if (n.includes("üzüm")) return "🍇";
  if (n.includes("domates")) return "🍅";
  if (n.includes("avokado")) return "🥑";
  if (n.includes("patates")) return "🥔";
  if (n.includes("havuç")) return "🥕";
  if (n.includes("biber")) return "🌶️";
  if (n.includes("lahana")) return "🥬";
  if (n.includes("mantar")) return "🍄";
  if (n.includes("salatalık")) return "🥒";
  if (n.includes("kivi")) return "🥝";
  if (n.includes("armut")) return "🍐";
  if (n.includes("ananas")) return "🍍";
  if (n.includes("soğan")) return "🧅";

  return "📦";
}

function Chip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-black text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      {children}
    </span>
  );
}

function HalAppVerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
      ✔ Onaylı
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">
      👑 Premium
    </span>
  );
}

function GoldBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] font-black text-yellow-700 dark:text-yellow-300">
      ⭐ Gold
    </span>
  );
}

function getLSSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);

    const arr = raw
      ? (JSON.parse(raw) as string[])
      : [];

    return new Set(
      Array.isArray(arr)
        ? arr.map(String)
        : []
    );
  } catch {
    return new Set();
  }
}

function saveLSSet(
  key: string,
  set: Set<string>
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(Array.from(set))
    );
  } catch {}
}

async function copyToClipboard(
  text: string
) {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
}

function pickSellerId(
  item: Listing,
  sellerObj: any
): string | null {
  const cands = [
    sellerObj?.id,
    (item as any)?.user_id,
    (item as any)?.seller_id,
  ].filter(Boolean);

  const v = cands[0];

  return typeof v === "string"
    ? v
    : null;
}

export default function LiveCard({
  item,
}: {
  item: Listing;
}) {
  const router = useRouter();

  const { toast } = useToast();

  const [open, setOpen] =
    useState(false);

  const [msgLoading, setMsgLoading] =
    useState(false);

  const [favLoading, setFavLoading] =
    useState(false);

  const [isFav, setIsFav] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [reportOpen, setReportOpen] =
    useState(false);

  const [reportTopic, setReportTopic] =
    useState("");

  const [
    reportReason,
    setReportReason,
  ] = useState("");

  const menuBtnRef =
    useRef<HTMLButtonElement | null>(
      null
    );

  const menuBoxRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [menuPos, setMenuPos] =
    useState({
      top: 0,
      left: 0,
      width: 260,
    });

  const title = safeText(
    item.product_name || item.title,
    "İlan"
  );

  const cover = ((item as any)
    ?.cover_thumb ||
    (item as any)?.cover_url) as
    | string
    | null;

  const seller = (item as any)
    ?.seller;

  const sellerName =
    seller?.company_name ||
    seller?.full_name ||
    "Satıcı";

  const sellerId = useMemo(
    () => pickSellerId(item, seller),
    [item, seller]
  );

  const detailHref = useMemo(
    () => `/listing/${item.id}`,
    [item.id]
  );

  const created = timeAgo(
    item.created_at
  );

  const typeLabel = pillTR(
    item.post_type
  );

  const isBoosted = Boolean(
    (item as any)?.is_boosted
  );

  const isSellerPremium = Boolean(
    seller?.is_premium
  );

  const isSellerVerified = Boolean(
    seller?.verified
  );

  useEffect(() => {
    document.body.style.overflow =
      open || reportOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, reportOpen]);

  useEffect(() => {
    let alive = true;

    async function loadFav() {
      try {
        const { data } =
          await supabase.auth.getSession();

        const uid =
          data.session?.user?.id;

        if (!uid) return;

        const { data: fav } =
          await supabase
            .from(FAV_TABLE)
            .select("listing_id")
            .eq("user_id", uid)
            .eq("listing_id", item.id)
            .limit(1);

        if (!alive) return;

        setIsFav(
          Boolean(fav?.length)
        );
      } catch {}
    }

    loadFav();

    return () => {
      alive = false;
    };
  }, [item.id]);

  async function ensureLogin(
    nextUrl?: string
  ) {
    const { data } =
      await supabase.auth.getSession();

    const uid =
      data.session?.user?.id;

    if (uid) return uid;

    toast({
      variant: "warning",
      title: "Giriş gerekli",
      message:
        "Bu işlem için giriş yapmalısın.",
    });

    router.push(
      `/auth?next=${encodeURIComponent(
        nextUrl || detailHref
      )}`
    );

    return null;
  }

  async function toggleFavorite(
    e?: React.MouseEvent
  ) {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      setFavLoading(true);

      const uid =
        await ensureLogin(
          detailHref
        );

      if (!uid) return;

      const next = !isFav;

      setIsFav(next);

      if (next) {
        const { error } =
          await supabase
            .from(FAV_TABLE)
            .insert({
              user_id: uid,
              listing_id: item.id,
            });

        if (error) throw error;

        toast({
          variant: "success",
          title:
            "Favorilere eklendi",
          message:
            "İlan favorilere eklendi.",
        });
      } else {
        const { error } =
          await supabase
            .from(FAV_TABLE)
            .delete()
            .eq("user_id", uid)
            .eq(
              "listing_id",
              item.id
            );

        if (error) throw error;

        toast({
          variant: "info",
          title:
            "Favorilerden kaldırıldı",
          message:
            "İlan kaldırıldı.",
        });
      }
    } catch (e: any) {
      console.error(e);

      setIsFav((v) => !v);

      toast({
        variant: "error",
        title: "Hata",
        message:
          e?.message ||
          "Favori işlemi başarısız.",
      });
    } finally {
      setFavLoading(false);
    }
  }

  async function handleMessage() {
    try {
      setMsgLoading(true);

      if (!sellerId) {
        toast({
          variant: "error",
          title: "Satıcı yok",
          message:
            "Satıcı bilgisi eksik.",
        });

        return;
      }

      const { data } =
        await supabase.auth.getSession();

      const uid =
        data.session?.user?.id;

      if (!uid) {
        router.push(
          `/auth?next=${encodeURIComponent(
            detailHref
          )}`
        );

        return;
      }

      if (uid === sellerId) {
        toast({
          variant: "info",
          title: "Bilgi",
          message:
            "Kendi ilanına mesaj gönderemezsin.",
        });

        return;
      }

      const { data: convId } =
        await supabase.rpc(
          "get_or_create_conversation",
          {
            p_user_a: uid,
            p_user_b: sellerId,
          }
        );

      setOpen(false);

      router.push(
        `/chat/user/${sellerId}?cid=${convId}`
      );
    } catch (e: any) {
      console.error(e);

      toast({
        variant: "error",
        title: "Hata",
        message:
          e?.message ||
          "Mesaj ekranı açılamadı.",
      });
    } finally {
      setMsgLoading(false);
    }
  }

  const shareUrl = useMemo(() => {
    if (
      typeof window ===
      "undefined"
    )
      return "";

    return `${window.location.origin}${detailHref}`;
  }, [detailHref]);

  async function doShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } else {
        await copyToClipboard(
          shareUrl
        );
      }

      toast({
        variant: "success",
        title: "Paylaşıldı",
        message:
          "İlan paylaşımı hazır.",
      });
    } catch {}

    setMenuOpen(false);
  }

  async function copyLink() {
    await copyToClipboard(
      shareUrl
    );

    toast({
      variant: "success",
      title: "Kopyalandı",
      message:
        "Link panoya kopyalandı.",
    });

    setMenuOpen(false);
  }

  function hideListing() {
    const set =
      getLSSet(LS_HIDE);

    set.add(String(item.id));

    saveLSSet(
      LS_HIDE,
      set
    );

    window.dispatchEvent(
      new Event(
        EVT_LOCAL_UPDATED
      )
    );

    toast({
      variant: "success",
      title: "Gizlendi",
      message:
        "İlan artık gösterilmeyecek.",
    });

    setMenuOpen(false);
  }

  function blockSeller() {
    if (!sellerId) return;

    const set =
      getLSSet(LS_BLOCK);

    set.add(String(sellerId));

    saveLSSet(
      LS_BLOCK,
      set
    );

    window.dispatchEvent(
      new Event(
        EVT_LOCAL_UPDATED
      )
    );

    toast({
      variant: "success",
      title:
        "Satıcı engellendi",
      message:
        "Bu satıcının ilanları gizlenecek.",
    });

    setMenuOpen(false);
  }

  function openReport() {
    setMenuOpen(false);

    setReportTopic("");
    setReportReason("");

    setReportOpen(true);
  }

  function sendReport() {
    const topic =
      reportTopic.trim();

    const reason =
      reportReason.trim();

    if (
      !topic ||
      !reason
    ) {
      toast({
        variant: "warning",
        title: "Eksik",
        message:
          "Konu ve neden gerekli.",
      });

      return;
    }

    const subject =
      encodeURIComponent(
        `HalApp Şikayet • ${topic}`
      );

    const body =
      encodeURIComponent(
        `
İlan: ${shareUrl}

İlan ID: ${item.id}

Satıcı: ${sellerName}

Konu:
${topic}

Neden:
${reason}
`
      );

    window.location.href = `mailto:support@halapp.com?subject=${subject}&body=${body}`;

    setReportOpen(false);

    toast({
      variant: "success",
      title:
        "Şikayet hazır",
      message:
        "Mail ekranı açıldı.",
    });
  }

  const computeMenuPos =
    useCallback(() => {
      const btn =
        menuBtnRef.current;

      if (!btn) return;

      const r =
        btn.getBoundingClientRect();

      const width = 260;

      let left =
        r.right - width;

      if (left < 12)
        left = 12;

      setMenuPos({
        top: r.bottom + 10,
        left,
        width,
      });
    }, []);

  function toggleMenu(
    e: React.MouseEvent
  ) {
    e.preventDefault();

    e.stopPropagation();

    setMenuOpen((v) => {
      const next = !v;

      if (next) {
        requestAnimationFrame(
          () => {
            computeMenuPos();
          }
        );
      }

      return next;
    });
  }

  useEffect(() => {
    function onDoc(
      e: MouseEvent
    ) {
      if (!menuOpen) return;

      const t =
        e.target as Node;

      if (
        menuBoxRef.current?.contains(
          t
        ) ||
        menuBtnRef.current?.contains(
          t
        )
      ) {
        return;
      }

      setMenuOpen(false);
    }

    function onKey(
      e: KeyboardEvent
    ) {
      if (
        e.key ===
        "Escape"
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      onDoc
    );

    document.addEventListener(
      "keydown",
      onKey
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onDoc
      );

      document.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, [menuOpen]);

  const MenuPortal =
    menuOpen &&
    typeof document !==
      "undefined"
      ? createPortal(
          <div
            ref={menuBoxRef}
            className="fixed z-[9999]"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width:
                menuPos.width,
            }}
          >
            <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white/95 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">

              <div className="border-b border-black/10 p-4 dark:border-white/10">
                <div className="text-sm font-black text-black/80 dark:text-white/80">
                  İşlemler
                </div>
              </div>

              <div className="p-2">

                <button
                  onClick={doShare}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  🔗 Paylaş
                </button>

                <button
                  onClick={copyLink}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  📋 Link Kopyala
                </button>

                <button
                  onClick={() => {
                    router.push(
                      detailHref
                    );

                    setMenuOpen(
                      false
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  👁️ İlan Detayı
                </button>

                {sellerId && (
                  <button
                    onClick={() => {
                      router.push(
                        `/profile/${sellerId}`
                      );

                      setMenuOpen(
                        false
                      );
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    👤 Satıcı Profili
                  </button>
                )}

                <div className="my-2 h-px bg-black/10 dark:bg-white/10" />

                <button
                  onClick={
                    hideListing
                  }
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  🙈 Bu İlanı Gizle
                </button>

                <button
                  onClick={
                    blockSeller
                  }
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
                >
                  ⛔ Satıcıyı Engelle
                </button>

                <div className="my-2 h-px bg-black/10 dark:bg-white/10" />

                <button
                  onClick={
                    openReport
                  }
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  ⚠️ Şikayet Et
                </button>

              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <article
        onClick={() =>
          setOpen(true)
        }
        className="group relative cursor-pointer overflow-hidden rounded-[30px] border border-black/10 bg-white/90 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-white/[0.04]"
      >

        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,.16),transparent_55%)]" />
        </div>

        <div className="relative flex items-start justify-between">

          <div className="flex flex-wrap items-center gap-2">

            <Chip>
              {typeLabel}
            </Chip>

            {created && (
              <Chip>
                {created}
              </Chip>
            )}

            {isBoosted && (
              <GoldBadge />
            )}

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={
                toggleFavorite
              }
              disabled={
                favLoading
              }
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-lg shadow-lg dark:border-white/10 dark:bg-white/5"
            >
              {isFav
                ? "❤️"
                : "🤍"}
            </button>

            <button
              ref={
                menuBtnRef
              }
              onClick={
                toggleMenu
              }
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-lg shadow-lg dark:border-white/10 dark:bg-white/5"
            >
              ⋯
            </button>

            {MenuPortal}

          </div>
        </div>

        <div className="relative mt-4 flex items-start gap-4">

          <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">

            {cover ? (
              <img
                src={cover}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl">
                {productEmoji(
                  title
                )}
              </div>
            )}

          </div>

          <div className="min-w-0 flex-1">

            <div className="line-clamp-2 text-[17px] font-black text-black/90 dark:text-white/90">
              {
                productEmoji(
                  title
                )
              }{" "}
              {title}
            </div>

            <div className="mt-1 text-sm text-black/55 dark:text-white/55">
              {[
                item.city,
                item.district,
                item.market_name,
              ]
                .filter(Boolean)
                .join(" • ")}
            </div>

            <div className="mt-3 text-lg font-black text-emerald-700 dark:text-emerald-300">
              {formatUnitPrice(
                item.price_per_unit,
                item.unit
              )}
            </div>

          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between">

          <div className="flex min-w-0 items-center gap-3">

            <div className="h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">

              {seller
                ?.avatar_url ? (
                <img
                  src={
                    seller.avatar_url
                  }
                  alt={
                    sellerName
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs font-black">
                  {initials(
                    sellerName
                  )}
                </div>
              )}

            </div>

            <div className="min-w-0">

              <div className="truncate text-sm font-bold text-black/75 dark:text-white/75">
                {sellerName}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1">

                {isSellerVerified && (
                  <HalAppVerifiedBadge />
                )}

                {isSellerPremium && (
                  <PremiumBadge />
                )}

              </div>

            </div>
          </div>

          <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
            Aç →
          </div>

        </div>
     </article>

      {open && (
        <div className="fixed inset-0 z-[70]">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              setOpen(false)
            }
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl">

            <div className="rounded-t-[34px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_80px_rgba(0,0,0,0.20)] dark:border-white/10 dark:bg-zinc-950/95">

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <Chip>
                      {typeLabel}
                    </Chip>

                    {isBoosted && (
                      <GoldBadge />
                    )}

                    {isSellerVerified && (
                      <HalAppVerifiedBadge />
                    )}

                    {isSellerPremium && (
                      <PremiumBadge />
                    )}

                  </div>

                  <div className="mt-4 line-clamp-2 text-2xl font-black text-black/90 dark:text-white/90">
                    {
                      productEmoji(
                        title
                      )
                    }{" "}
                    {title}
                  </div>

                  <div className="mt-2 text-sm text-black/55 dark:text-white/55">
                    {[
                      item.city,
                      item.district,
                      item.market_name,
                      item.neighborhood,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>

                </div>

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-black dark:border-white/10 dark:bg-white/5"
                >
                  Kapat
                </button>

              </div>

              <div className="mt-5 overflow-hidden rounded-[28px] border border-black/10 dark:border-white/10">

                <div className="h-64">

                  {cover ? (
                    <img
                      src={cover}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-black/5 text-8xl dark:bg-white/5">
                      {
                        productEmoji(
                          title
                        )
                      }
                    </div>
                  )}

                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <div className="rounded-[26px] border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">

                  <div className="text-xs font-black text-black/55 dark:text-white/55">
                    Birim Fiyat
                  </div>

                  <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {formatUnitPrice(
                      item.price_per_unit,
                      item.unit
                    )}
                  </div>

                </div>

                <div className="rounded-[26px] border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">

                  <div className="text-xs font-black text-black/55 dark:text-white/55">
                    Miktar
                  </div>

                  <div className="mt-2 text-2xl font-black text-black/90 dark:text-white/90">
                    {item.quantity ||
                      item.min_quantity ||
                      "—"}{" "}
                    {item.unit}
                  </div>

                </div>

              </div>

              <div className="mt-4 rounded-[26px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">

                <div className="text-xs font-black text-black/55 dark:text-white/55">
                  Fiyat Aralığı
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">

                  <Chip>
                    Min:
                    <span className="ml-1">
                      {formatTRY(
                        (item as any)
                          ?.min_price
                      )}
                    </span>
                  </Chip>

                  <Chip>
                    Max:
                    <span className="ml-1">
                      {formatTRY(
                        (item as any)
                          ?.max_price
                      )}
                    </span>
                  </Chip>

                </div>

              </div>

              {item.description && (
                <div className="mt-4 rounded-[26px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">

                  <div className="text-xs font-black text-black/55 dark:text-white/55">
                    Açıklama
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/75 dark:text-white/75">
                    {
                      item.description
                    }
                  </div>

                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <Link
                  href={detailHref}
                  className="inline-flex items-center justify-center rounded-[24px] bg-emerald-500 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-400"
                >
                  İlan Detayı →
                </Link>

                <button
                  onClick={
                    handleMessage
                  }
                  disabled={
                    msgLoading
                  }
                  className="inline-flex items-center justify-center rounded-[24px] border border-black/10 bg-black/5 px-5 py-4 text-sm font-black text-black/80 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                >
                  {msgLoading
                    ? "Açılıyor..."
                    : "Mesaj Gönder"}
                </button>

              </div>

              <div className="mt-5 text-xs text-black/45 dark:text-white/45">
                İlan ID:
                <span className="ml-1 font-mono">
                  {item.id}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-[80]">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              setReportOpen(false)
            }
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl">

            <div className="rounded-t-[34px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_80px_rgba(0,0,0,0.20)] dark:border-white/10 dark:bg-zinc-950/95">

              <div className="flex items-start justify-between">

                <div>

                  <div className="text-lg font-black text-black/90 dark:text-white/90">
                    Şikayet Formu
                  </div>

                  <div className="mt-1 text-xs text-black/55 dark:text-white/55">
                    İlan ID:
                    <span className="ml-1 font-mono">
                      {item.id}
                    </span>
                  </div>

                </div>

                <button
                  onClick={() =>
                    setReportOpen(false)
                  }
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-black dark:border-white/10 dark:bg-white/5"
                >
                  Kapat
                </button>

              </div>

              <div className="mt-5 grid gap-4">

                <div>

                  <div className="text-xs font-black text-black/55 dark:text-white/55">
                    Konu
                  </div>

                  <input
                    value={
                      reportTopic
                    }
                    onChange={(e) =>
                      setReportTopic(
                        e.target.value
                      )
                    }
                    placeholder="Örn: Sahte ürün"
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-900"
                  />

                </div>

                <div>

                  <div className="text-xs font-black text-black/55 dark:text-white/55">
                    Neden
                  </div>

                  <textarea
                    rows={5}
                    value={
                      reportReason
                    }
                    onChange={(e) =>
                      setReportReason(
                        e.target.value
                      )
                    }
                    placeholder="Detay yaz..."
                    className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-900"
                  />

                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  <button
                    onClick={() =>
                      setReportOpen(
                        false
                      )
                    }
                    className="rounded-[22px] border border-black/10 bg-black/5 px-5 py-4 text-sm font-black dark:border-white/10 dark:bg-white/5"
                  >
                    Vazgeç
                  </button>

                  <button
                    onClick={
                      sendReport
                    }
                    className="rounded-[22px] bg-emerald-500 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-400"
                  >
                    Gönder
                  </button>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </>
  );
}