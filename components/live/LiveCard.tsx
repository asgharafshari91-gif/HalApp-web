"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import type { Listing } from "@/lib/types";
import { formatTRY, formatUnitPrice, safeText } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

const FAV_TABLE = "listing_favorites";

// local hide/block keys
const LS_HIDE = "halapp_hide_listing_ids_v1";
const LS_BLOCK = "halapp_block_seller_ids_v1";

// LiveGrid’e anında güncelle sinyali
const EVT_LOCAL_UPDATED = "halapp:local-filters-updated";

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
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

function HalAppVerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12.2l2.3 2.3 4.8-5"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Onaylı
    </span>
  );
}

function GoldBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 17.5l-6.2 3.3 1.2-7-5-4.9 7-1 3-6.3 3 6.3 7 1-5 4.9 1.2 7L12 17.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      Gold
    </span>
  );
}

function PremiumSellerBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 17.5l-6.2 3.3 1.2-7-5-4.9 7-1 3-6.3 3 6.3 7 1-5 4.9 1.2 7L12 17.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      Premium
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      {children}
    </span>
  );
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

function pickSellerId(item: Listing, sellerObj: any): string | null {
  const cands = [
    sellerObj?.id,
    (item as any)?.user_id,
    (item as any)?.seller_id,
    (item as any)?.owner_id,
    (item as any)?.created_by,
  ].filter(Boolean);

  const v = cands[0];
  return typeof v === "string" && v.length > 10 ? v : null;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

function isAbortShareError(err: any) {
  const name = String(err?.name ?? "");
  const msg = String(err?.message ?? "");
  return name === "AbortError" || msg.toLowerCase().includes("abort");
}

export default function LiveCard({ item }: { item: Listing }) {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  // ✅ favorite
  const [favLoading, setFavLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // ✅ menu (portal)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuBoxRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });

  // ✅ report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTopic, setReportTopic] = useState("");
  const [reportReason, setReportReason] = useState("");

  // ✅ cover (LiveGrid veriyor)
  const cover = ((item as any)?.cover_thumb || (item as any)?.cover_url) as string | null;

  const title = safeText(item.product_name || item.title, "İlan");

  const seller = (item as any).seller as
    | {
        id?: string;
        full_name?: string | null;
        company_name?: string | null;
        avatar_url?: string | null;
        is_premium?: boolean;
        verified?: boolean;
        kyc_status?: string | null;
        is_online?: boolean;
        last_seen_at?: string | null;
      }
    | null
    | undefined;

  const sellerName =
    (seller?.company_name?.trim() ? seller?.company_name : seller?.full_name) ?? "Satıcı";

  const locParts = [item.city, item.district].filter(Boolean);
  const locLine = locParts.length ? locParts.join(" / ") : "—";

  const typeLabel = pillTR(item.post_type);
  const created = timeAgo(item.created_at ?? null);

  const isSellerPremium = Boolean(seller?.is_premium);
  const isSellerVerified = Boolean((seller as any)?.verified);
  const isBoosted = Boolean((item as any)?.is_boosted);

  const detailHref = useMemo(() => `/listing/${item.id}`, [item.id]);
  const sellerId = useMemo(() => pickSellerId(item, seller), [item, seller]);
  const chatHref = useMemo(() => (sellerId ? `/chat/user/${sellerId}` : `/chat`), [sellerId]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${detailHref}`;
  }, [detailHref]);

  // sheet açıkken body scroll kapat
  useEffect(() => {
    document.body.style.overflow = open || reportOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, reportOpen]);

  // ✅ Favori durumunu yükle (login varsa)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const myId = sess.session?.user?.id;
        if (!myId) {
          if (alive) setIsFav(false);
          return;
        }
        const { data, error } = await supabase
          .from(FAV_TABLE)
          .select("listing_id")
          .eq("user_id", myId)
          .eq("listing_id", item.id)
          .limit(1);

        if (!alive) return;
        if (error) return;
        setIsFav(Boolean(data && data.length));
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [item.id]);

  async function ensureLogin(nextUrl?: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const myId = sessionData.session?.user?.id;
    if (myId) return myId;

    toast({
      variant: "warning",
      title: "Giriş gerekli",
      message: "Bu işlem için giriş yapmalısın.",
    });

    const next = encodeURIComponent(nextUrl || detailHref);
    router.push(`/auth?next=${next}`);
    return null;
  }

  async function toggleFavorite(e?: React.MouseEvent) {
    e?.stopPropagation();
    e?.preventDefault();

    const myId = await ensureLogin(`${detailHref}`);
    if (!myId) return;

    try {
      setFavLoading(true);

      // optimistic
      const next = !isFav;
      setIsFav(next);

      if (next) {
        const { error } = await supabase.from(FAV_TABLE).insert({
          user_id: myId,
          listing_id: item.id,
        });
        if (error) throw error;

        toast({ variant: "success", title: "Favorilere eklendi", message: "İlan favorilerine eklendi.", durationMs: 1200 });
      } else {
        const { error } = await supabase
          .from(FAV_TABLE)
          .delete()
          .eq("user_id", myId)
          .eq("listing_id", item.id);

        if (error) throw error;

        toast({ variant: "info", title: "Favorilerden çıkarıldı", message: "İlan favorilerden kaldırıldı.", durationMs: 1200 });
      }
    } catch (err: any) {
      console.error(err);
      setIsFav((v) => !v);
      toast({ variant: "error", title: "Olmadı", message: err?.message ?? "Favori işlemi başarısız." });
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
          title: "Satıcı bulunamadı",
          message: "İlan sahibinin kullanıcı bilgisi eksik. Lütfen sayfayı yenile.",
        });
        return;
      }

      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const myId = sessionData.session?.user?.id;

      if (!myId) {
        toast({ variant: "warning", title: "Giriş gerekli", message: "Mesaj göndermek için giriş yapmalısın." });
        setOpen(false);
        const next = encodeURIComponent(chatHref);
        router.push(`/auth?next=${next}`);
        return;
      }

      if (sellerId === myId) {
        toast({ variant: "info", title: "Bilgi", message: "Kendi ilanına mesaj gönderemezsin." });
        return;
      }

      const { data: convId, error: rpcErr } = await supabase.rpc("get_or_create_conversation", {
        p_user_a: myId,
        p_user_b: sellerId,
      });
      if (rpcErr) throw rpcErr;

      setOpen(false);
      router.push(`${chatHref}?cid=${encodeURIComponent(String(convId))}`);
      toast({ variant: "success", title: "Sohbet hazır", message: "Mesaj ekranı açılıyor…", durationMs: 1600 });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "error", title: "Açılamadı", message: e?.message ?? "Mesaj ekranı açılamadı." });
    } finally {
      setMsgLoading(false);
    }
  }

  // ✅ menu position (portal) — kartın altına girmesin
  const computeMenuPos = useCallback(() => {
    const btn = menuBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const w = 264; // premium menü width
    const gap = 10;

    const vw = window.innerWidth;
    let left = r.right - w; // sağa hizalı
    if (left < 12) left = 12;
    if (left + w > vw - 12) left = vw - 12 - w;

    let top = r.bottom + gap;

    // aşağıda yer yoksa yukarı aç
    const approxMenuH = 360;
    const vh = window.innerHeight;
    if (top + approxMenuH > vh - 12) {
      top = Math.max(12, r.top - gap - approxMenuH);
    }

    setMenuPos({ top, left, width: w });
  }, []);

  // menu aç/kapat
  function toggleMenu(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen((v) => {
      const next = !v;
      if (next) {
        // next tick ölç
        requestAnimationFrame(() => computeMenuPos());
      }
      return next;
    });
  }

  // dış tık kapat + ESC kapat + resize/scroll reposition
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!menuOpen) return;
      const t = e.target as Node | null;
      if (!t) return;

      if (menuBoxRef.current && menuBoxRef.current.contains(t)) return;
      if (menuBtnRef.current && menuBtnRef.current.contains(t)) return;

      setMenuOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (!menuOpen) return;
      if (e.key === "Escape") setMenuOpen(false);
    }

    function onReflow() {
      if (!menuOpen) return;
      computeMenuPos();
    }

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);

    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [menuOpen, computeMenuPos]);

  function hideThisListing() {
    try {
      const set = getLSSet(LS_HIDE);
      set.add(String(item.id));
      saveLSSet(LS_HIDE, set);

      toast({ variant: "success", title: "Gizlendi", message: "Bu ilan artık sana gösterilmeyecek (local)." });

      setMenuOpen(false);
      window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
    } catch {
      toast({ variant: "error", title: "Olmadı", message: "Gizleme işlemi başarısız." });
    }
  }

  function blockSeller() {
    if (!sellerId) {
      toast({ variant: "error", title: "Satıcı yok", message: "Satıcı bilgisi bulunamadı." });
      return;
    }
    try {
      const set = getLSSet(LS_BLOCK);
      set.add(String(sellerId));
      saveLSSet(LS_BLOCK, set);

      toast({ variant: "success", title: "Engellendi", message: "Bu satıcının ilanları gizlenecek (local)." });

      setMenuOpen(false);
      window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
    } catch {
      toast({ variant: "error", title: "Olmadı", message: "Engelleme işlemi başarısız." });
    }
  }

  async function doShare() {
    try {
      // iOS/Safari’da paylaş iptalinde AbortError normal
      if (navigator.share) {
        await navigator.share({ title: `HalApp • ${title}`, text: title, url: shareUrl });
        toast({ variant: "success", title: "Paylaşıldı", message: "Paylaşım penceresi açıldı.", durationMs: 1200 });
      } else {
        const ok = await copyToClipboard(shareUrl);
        toast({
          variant: ok ? "success" : "info",
          title: ok ? "Kopyalandı" : "Link",
          message: ok ? "Link panoya kopyalandı." : shareUrl,
          durationMs: 1400,
        });
      }
    } catch (e: any) {
      if (isAbortShareError(e)) {
        // kullanıcı iptal etti — hata göstermeyelim
      } else {
        console.error(e);
        toast({ variant: "error", title: "Paylaşım olmadı", message: e?.message ?? "Paylaşım başarısız." });
      }
    } finally {
      setMenuOpen(false);
    }
  }

  async function copyLink() {
    const ok = await copyToClipboard(shareUrl);
    toast({
      variant: ok ? "success" : "error",
      title: ok ? "Kopyalandı" : "Olmadı",
      message: ok ? "İlan linki panoya kopyalandı." : "Kopyalanamadı.",
      durationMs: 1200,
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
    const topic = reportTopic.trim();
    const reason = reportReason.trim();

    if (!topic || !reason) {
      toast({ variant: "warning", title: "Eksik", message: "Konu ve neden alanlarını doldur." });
      return;
    }

    // Backend yoksa: mailto ile gönder (çalışır)
    const subject = encodeURIComponent(`HalApp Şikayet • ${topic}`);
    const body = encodeURIComponent(
      `Şikayet edilen ilan:\n${shareUrl}\n\nİlan ID: ${item.id}\nSatıcı: ${sellerName}\n\nKonu:\n${topic}\n\nNeden:\n${reason}\n`
    );

    window.location.href = `mailto:support@halapp.com?subject=${subject}&body=${body}`;
    setReportOpen(false);

    toast({ variant: "success", title: "Hazır", message: "Şikayet formu e-posta olarak açıldı.", durationMs: 1400 });
  }

  // ✅ Premium menu (portal)
const MenuPortal =
  menuOpen && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuBoxRef}
          className="fixed z-[9999]"
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[
              "overflow-hidden rounded-3xl border shadow-[0_18px_70px_rgba(0,0,0,0.20)] backdrop-blur-xl",
              "border-black/10 bg-white/97 text-black",
              "dark:border-white/10 dark:bg-zinc-950/95 dark:text-white dark:shadow-[0_22px_90px_rgba(0,0,0,0.55)]",
            ].join(" ")}
          >
            {/* header shine */}
            <div className="relative px-4 py-3">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,.18),transparent_55%)]" />
                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_85%_20%,rgba(59,130,246,.10),transparent_55%)]" />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="text-xs font-black text-black/75 dark:text-white/75">
                  İşlemler
                </div>

                <button
                  className={[
                    "inline-flex h-8 w-8 items-center justify-center rounded-2xl border",
                    "border-black/10 bg-black/5 text-black/70 hover:bg-black/10",
                    "dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/12",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:focus:ring-emerald-400/25",
                  ].join(" ")}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Kapat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="h-px bg-black/10 dark:bg-white/10" />

            {/* shared item styles */}
            {(() => {
              const itemCls =
                "group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-extrabold " +
                "text-black/80 hover:text-black hover:bg-black/6 active:bg-black/10 " +
                "dark:text-white/85 dark:hover:text-white dark:hover:bg-white/12 dark:active:bg-white/16 " +
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 " +
                "transition";

              const iconBoxCls =
                "grid h-8 w-8 place-items-center rounded-2xl border " +
                "border-black/10 bg-black/5 text-black/70 " +
                "dark:border-white/10 dark:bg-white/7 dark:text-white/80 " +
                "transition";

              const dividerCls = "my-2 h-px bg-black/10 dark:bg-white/10";

              const dangerCls =
                "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-extrabold " +
                "text-rose-700 hover:bg-rose-500/10 active:bg-rose-500/15 " +
                "dark:text-rose-200 dark:hover:bg-rose-500/16 dark:active:bg-rose-500/22 " +
                "focus:outline-none focus:ring-2 focus:ring-rose-500/20 " +
                "transition";

              const dangerIconCls =
                "grid h-8 w-8 place-items-center rounded-2xl border " +
                "border-rose-500/25 bg-rose-500/10 text-rose-700 " +
                "dark:border-rose-500/25 dark:bg-rose-500/16 dark:text-rose-200";

              return (
                <div className="p-2">
                  {/* Share */}
                  <button className={itemCls} onClick={doShare}>
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M7 8l5-5 5 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      Paylaş
                    </span>
                    <span className="text-xs text-black/45 dark:text-white/45">↗️</span>
                  </button>

                  {/* Copy */}
                  <button className={itemCls} onClick={copyLink}>
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M10 13a5 5 0 007.1 0l1.4-1.4a5 5 0 000-7.1 5 5 0 00-7.1 0L10.6 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M14 11a5 5 0 01-7.1 0L5.5 9.6a5 5 0 010-7.1 5 5 0 017.1 0L13.4 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      Link kopyala
                    </span>
                  </button>

                  <div className={dividerCls} />

                  {/* Detail */}
                  <button
                    className={itemCls}
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(detailHref);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                      </span>
                      İlan detayına git
                    </span>
                    <span className="text-xs text-black/45 dark:text-white/45">→</span>
                  </button>

                  {/* Seller profile */}
                  {sellerId ? (
                    <button
                      className={itemCls}
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(`/profile/${sellerId}`);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span className={iconBoxCls}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M20 21a8 8 0 10-16 0"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 11a4 4 0 100-8 4 4 0 000 8z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        Satıcı profili
                      </span>
                      <span className="text-xs text-black/45 dark:text-white/45">→</span>
                    </button>
                  ) : null}

                  <div className={dividerCls} />

                  {/* Hide listing */}
                  <button className={itemCls} onClick={hideThisListing}>
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                      Bu ilanı gizle
                    </span>
                  </button>

                  {/* Block seller (danger) */}
                  <button className={dangerCls} onClick={blockSeller}>
                    <span className="flex items-center gap-2">
                      <span className={dangerIconCls}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                      </span>
                      Satıcıyı engelle
                    </span>
                  </button>

                  <div className={dividerCls} />

                  {/* Report */}
                  <button className={itemCls} onClick={openReport}>
                    <span className="flex items-center gap-2">
                      <span className={iconBoxCls}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          <path
                            d="M10.3 3.6l-8 14A2 2 0 004 20h16a2 2 0 001.7-2.9l-8-14a2 2 0 00-3.4 0z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      Şikayet et
                    </span>
                    <span className="text-xs text-black/45 dark:text-white/45">→</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* CARD */}
      <article
        className={[
          "group relative overflow-hidden rounded-[26px] border border-black/10 bg-white/80 p-4",
          "shadow-[0_14px_40px_rgba(0,0,0,0.06)]",
          "transition hover:-translate-y-[1px] hover:shadow-[0_18px_55px_rgba(0,0,0,0.10)]",
          "dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]",
          "cursor-pointer",
        ].join(" ")}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        aria-label="İlanı aç"
      >
        {/* glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -inset-10 bg-[radial-gradient(circle_at_25%_15%,rgba(34,197,94,.14),transparent_55%)]" />
        </div>

        {/* Top row */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>{typeLabel}</Chip>
            {created ? <Chip>{created}</Chip> : null}
            {isBoosted ? <GoldBadge /> : null}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* ❤️ Premium Favorite */}
            <button
              type="button"
              disabled={favLoading}
              className={[
                "relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10",
                "bg-white/70 text-black/70 hover:bg-white",
                "dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10",
                "shadow-[0_10px_24px_rgba(0,0,0,0.10)]",
                favLoading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFavorite(e);
              }}
              aria-label="Favori"
              title="Favori"
            >
              {/* tiny shine */}
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.55),transparent_45%)] opacity-60" />
              {isFav ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="relative">
                  <path d="M12 21s-7-4.6-9.3-8.5C.9 9.2 2.8 6 6.4 6c2 0 3.2 1 3.6 1.6C10.4 7 11.6 6 13.6 6c3.6 0 5.5 3.2 3.7 6.5C19 16.4 12 21 12 21z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="relative">
                  <path
                    d="M12 21s-7-4.6-9.3-8.5C.9 9.2 2.8 6 6.4 6c2 0 3.2 1 3.6 1.6C10.4 7 11.6 6 13.6 6c3.6 0 5.5 3.2 3.7 6.5C19 16.4 12 21 12 21z"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* ⋯ Menu Button */}
            <button
              ref={menuBtnRef}
              type="button"
              className={[
                "relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10",
                "bg-white/70 text-black/70 hover:bg-white",
                "dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10",
                "shadow-[0_10px_24px_rgba(0,0,0,0.10)]",
              ].join(" ")}
              onClick={toggleMenu}
              aria-label="Menü"
              title="Menü"
            >
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.55),transparent_45%)] opacity-60" />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative">
                <path d="M6 12h.01M12 12h.01M18 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </button>

            {/* ✅ Portal menu here */}
            {MenuPortal}
          </div>
        </div>

        {/* Main content */}
        <div className="relative mt-3 flex items-start gap-3">
          <div className="shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[11px] font-black text-black/45 dark:text-white/45">
                  Foto
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-black text-black/90 dark:text-white/90">
              {title}
            </div>

            <div className="mt-1 flex items-center gap-2 text-[12px] text-black/55 dark:text-white/55">
              <span className="truncate">{locLine}</span>
              {item.market_name ? <span className="truncate">• {item.market_name}</span> : null}
            </div>

            <div className="mt-2 text-[13px] font-extrabold text-emerald-800 dark:text-emerald-200">
              {formatUnitPrice(item.price_per_unit, item.unit)}
            </div>
          </div>
        </div>

        {/* Bottom seller row */}
        <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-6 w-6 overflow-hidden rounded-full border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
              {seller?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seller.avatar_url} alt={safeText(sellerName, "Profil")} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[9px] font-black text-black/70 dark:text-white/75">
                  {initials(sellerName)}
                </div>
              )}
            </div>

            <span className="max-w-[160px] truncate text-[12px] font-bold text-black/70 dark:text-white/70">
              {safeText(sellerName, "Satıcı")}
            </span>

            {isSellerVerified ? <HalAppVerifiedBadge /> : null}
            {isSellerPremium ? <PremiumSellerBadge /> : null}
          </div>

          <span className="text-[12px] font-extrabold text-emerald-700 dark:text-emerald-200">
            Aç →
          </span>
        </div>
      </article>

      {/* SHEET */}
      {open && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl">
            <div className="rounded-t-[28px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_70px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-zinc-950/95">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip>{typeLabel}</Chip>
                    {isBoosted ? <GoldBadge /> : null}
                    {isSellerVerified ? <HalAppVerifiedBadge /> : null}
                    {isSellerPremium ? <PremiumSellerBadge /> : null}
                  </div>

                  <div className="mt-3 text-lg font-black text-black/95 dark:text-white/95 line-clamp-2">
                    {title}
                  </div>

                  <div className="mt-1 text-sm text-black/60 dark:text-white/60">
                    {[item.city, item.district, item.market_name, item.neighborhood].filter(Boolean).slice(0, 3).join(" • ") || "—"}
                  </div>
                </div>

                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                  onClick={() => setOpen(false)}
                >
                  Kapat
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
                <div className="h-40 w-full">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-black text-black/45 dark:text-white/45">
                      Foto yok
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Birim fiyat</div>
                  <div className="mt-1 text-base font-black text-black/90 dark:text-white/90">
                    {formatUnitPrice(item.price_per_unit, item.unit)}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Miktar</div>
                  <div className="mt-1 text-base font-black text-black/90 dark:text-white/90">
                    {item.quantity ?? item.min_quantity ?? "—"} {(item.unit ?? "").trim()}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Fiyat aralığı</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip>Min: <b className="ml-1">{formatTRY((item as any).min_price)}</b></Chip>
                  <Chip>Max: <b className="ml-1">{formatTRY((item as any).max_price)}</b></Chip>
                </div>
              </div>

              {item.description?.trim() ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Açıklama</div>
                  <div className="mt-2 text-sm text-black/70 dark:text-white/70 leading-6">
                    {item.description}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link
                  href={detailHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
                  onClick={() => setOpen(false)}
                >
                  İlan Detayı →
                </Link>

                <button
                  type="button"
                  disabled={msgLoading}
                  className={[
                    "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold text-black/70 hover:bg-black/10",
                    "dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition",
                    msgLoading ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                  onClick={handleMessage}
                >
                  {msgLoading ? "Açılıyor..." : "Mesaj Gönder"}
                </button>
              </div>

              <div className="mt-4 text-xs text-black/50 dark:text-white/50">
                İlan ID: <span className="font-mono">{item.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ REPORT MODAL (HalApp form) */}
      {reportOpen && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl">
            <div className="rounded-t-[28px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_70px_rgba(0,0,0,0.22)] dark:border-white/10 dark:bg-zinc-950/95">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-black/90 dark:text-white/90">Şikayet Formu</div>
                  <div className="mt-1 text-xs text-black/55 dark:text-white/55">
                    İlan: <span className="font-mono">{String(item.id).slice(0, 8)}…</span>
                  </div>
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                  onClick={() => setReportOpen(false)}
                >
                  Kapat
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Konu</div>
                  <input
                    value={reportTopic}
                    onChange={(e) => setReportTopic(e.target.value)}
                    placeholder="Örn: Yanıltıcı fiyat / Sahte ürün / Uygunsuz içerik"
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white/80"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Neden</div>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Detay yaz…"
                    rows={5}
                    className="mt-1 w-full resize-none rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/60 dark:text-white/80"
                  />
                </div>

                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  <button
                    className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                    onClick={() => setReportOpen(false)}
                  >
                    Vazgeç
                  </button>

                  <button
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
                    onClick={sendReport}
                  >
                    Gönder
                  </button>
                </div>

                <div className="text-xs text-black/45 dark:text-white/45">
                  Not: Şu an “Gönder” e-posta olarak açılır (backend zorunlu değil). İstersen sonra Supabase’e kayıtlı şikayet tablosu da ekleriz.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}