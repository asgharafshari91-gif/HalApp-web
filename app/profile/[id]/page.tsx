"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import LiveCard from "@/components/live/LiveCard";

/** ===================== CONFIG ===================== */
// ❗ Supabase Storage bucket adların farklıysa burayı değiştir
const COVER_BUCKET = "profile_covers";
const LISTING_MEDIA_BUCKET = "listing_media";

/** ===================== TYPES ===================== */

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  public_id: string | null;

  city: string | null;
  district: string | null;

  account_type: string;
  is_premium: boolean;
  verified: boolean | null;
  kyc_status?: string | null;

  phone: string | null;
  phone_number: string | null;
  email: string | null;

  is_online: boolean;
  last_seen_at: string | null;
  created_at: string | null;
};

type ListingRow = any;

type MediaRow = {
  listing_id: string | null;
  url: string | null;
  thumb_url: string | null;
  media_type: string | null;
  sort_order: number | null;
};

type ReviewRow = {
  id: string;
  seller_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
    public_id: string | null;
    is_premium: boolean;
    verified: boolean | null;
  } | null;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  return v
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g`;
  if (hr > 0) return `${hr}s`;
  if (min > 0) return `${min}dk`;
  return "az önce";
}

function safeUrl(u: any) {
  const s = String(u ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return s; // storage path olabilir
}

function isProbablyImage(url?: string | null) {
  const u = (url ?? "").toLowerCase();
  return (
    u.includes(".jpg") ||
    u.includes(".jpeg") ||
    u.includes(".png") ||
    u.includes(".webp") ||
    u.includes(".gif") ||
    u.includes("storage")
  );
}

function Stars({ value, size = 18 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, value || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const isHalf = i === full && half;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            className={cn("text-amber-500", filled ? "opacity-100" : "opacity-60")}
          >
            <path
              d="M12 17.5l-6.2 3.3 1.2-7-5-4.9 7-1 3-6.3 3 6.3 7 1-5 4.9 1.2 7L12 17.5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {isHalf ? (
              <path
                d="M12 3.8v13.7l-4.1 2.2.8-4.6-3.3-3.2 4.6-.7L12 3.8z"
                fill="currentColor"
                opacity="0.9"
              />
            ) : null}
          </svg>
        );
      })}
    </div>
  );
}

/** ===================== PAGE ===================== */

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);

  const [meId, setMeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [listings, setListings] = useState<ListingRow[]>([]);
  const [listingCount, setListingCount] = useState<number>(0);

  const [salesCount, setSalesCount] = useState<number | null>(null);
  const [salesTotal, setSalesTotal] = useState<number | null>(null);

  // reviews
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsEnabled, setReviewsEnabled] = useState<boolean>(true);
  const [reviewBusy, setReviewBusy] = useState(false);

  // block
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  // report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  // contact modal
  const [contactOpen, setContactOpen] = useState(false);
  const [msgBusy, setMsgBusy] = useState(false);

  const displayName = useMemo(() => {
    const p = profile;
    return (p?.company_name?.trim() || p?.full_name?.trim() || "Satıcı") ?? "Satıcı";
  }, [profile]);

  const phone = useMemo(() => {
    const p = profile;
    const raw = (p?.phone_number ?? p?.phone ?? "").trim();
    return raw || null;
  }, [profile]);

  const locationLine = useMemo(() => {
    const p = profile;
    const parts = [p?.city, p?.district].filter(Boolean);
    return parts.length ? parts.join(" / ") : "—";
  }, [profile]);

  const isPremium = Boolean(profile?.is_premium);
  const isVerified =
    Boolean(profile?.verified) ||
    String(profile?.kyc_status ?? "").toLowerCase().trim() === "approved" ||
    String(profile?.kyc_status ?? "").toLowerCase().trim() === "verified";

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const isMyProfile = Boolean(meId && profile?.id && meId === profile.id);

  /** ---------- Auth + Block Status ---------- */

  async function loadMe() {
    try {
      const { data } = await supabase.auth.getSession();
      setMeId(data.session?.user?.id ?? null);
    } catch {
      setMeId(null);
    }
  }

  async function loadBlockState(sellerId: string) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!uid) {
        setIsBlocked(false);
        return;
      }
      const { data: rows, error } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", uid)
        .eq("blocked_id", sellerId)
        .limit(1);

      if (error) return;
      setIsBlocked(Boolean(rows && rows.length));
    } catch {
      setIsBlocked(false);
    }
  }

  /** ---------- URL Resolver (storage path -> public url) ---------- */
  function resolveStoragePublicUrl(bucket: string, maybePathOrUrl: string | null) {
    const s = safeUrl(maybePathOrUrl);
    if (!s) return null;

    // zaten tam URL ise dokunma
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;

    // path ise publicUrl üret
    const pub = supabase.storage.from(bucket).getPublicUrl(s);
    const url = pub?.data?.publicUrl ?? null;
    return url;
  }

  /** ---------- Cover Load ---------- */

  async function loadCoverFromStorage(sellerId: string) {
    // Biz cover’ı her zaman aynı path’e upsert edeceğiz:
    // `${sellerId}/cover.webp`
    // Ama eski içerik olabilir diye birkaç aday deniyoruz
    const candidates = [
      `${sellerId}/cover.webp`,
      `${sellerId}/cover.jpg`,
      `${sellerId}/cover.jpeg`,
      `${sellerId}/cover.png`,
    ];

    for (const path of candidates) {
      const pub = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
      const url = pub?.data?.publicUrl;
      if (!url) continue;

      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (res.ok) return url;
      } catch {}
    }
    return null;
  }

  async function loadCover(sellerId: string) {
    // profile_covers table vs. yoksa direkt storage dene
    const fromStorage = await loadCoverFromStorage(sellerId);
    if (fromStorage) return fromStorage;
    return null;
  }

  /** ---------- Cover Upload ---------- */
  async function uploadCover(file: File) {
    if (!profile?.id || !isMyProfile) return;

    const sellerId = profile.id;

    // sadece image
    if (!file.type.startsWith("image/")) {
      toast({ variant: "warning", title: "Geçersiz", message: "Lütfen bir görsel seç." });
      return;
    }

    // tek path (upsert)
    const path = `${sellerId}/cover.webp`;

    try {
      setCoverBusy(true);

      // upload (bucket yoksa error: Bucket not found)
      const { error: upErr } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/webp",
          cacheControl: "3600",
        });

      if (upErr) {
        const msg = String(upErr.message || "");
        if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not found")) {
          toast({
            variant: "error",
            title: "Bucket yok",
            message: `Supabase Storage’da "${COVER_BUCKET}" bucket’ı yok. Dashboard > Storage > New bucket (${COVER_BUCKET}) oluştur ve Public yap.`,
            durationMs: 4500,
          });
          return;
        }
        throw upErr;
      }

      const pub = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
      const url = pub?.data?.publicUrl ?? null;

      setCoverUrl(url ? `${url}?t=${Date.now()}` : null);
      toast({ variant: "success", title: "Yüklendi", message: "Kapak foto güncellendi.", durationMs: 1400 });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Yüklenemedi",
        message: e?.message ?? "Kapak foto yüklenemedi.",
      });
    } finally {
      setCoverBusy(false);
    }
  }

  /** ---------- Listing covers (listing_media) ---------- */

  async function attachListingCovers(items: ListingRow[]) {
    const ids = items.map((x) => x?.id).filter(Boolean);
    if (!ids.length) return items;

    try {
      const { data: media, error } = await supabase
        .from("listing_media")
        .select("listing_id,url,thumb_url,media_type,sort_order")
        .in("listing_id", ids)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const rows = (Array.isArray(media) ? media : []) as MediaRow[];
      const coverMap = new Map<string, { thumb: string | null; url: string | null }>();

      for (const m of rows) {
        const lid = String(m.listing_id ?? "").trim();
        if (!lid) continue;

        // url/thumb_url storage path olabilir → public url’e çevir
        const thumb = resolveStoragePublicUrl(LISTING_MEDIA_BUCKET, m.thumb_url);
        const url = resolveStoragePublicUrl(LISTING_MEDIA_BUCKET, m.url);

        const candidate = (thumb || url) ?? null;
        if (!candidate) continue;

        const isImg = isProbablyImage(candidate);
        if (!coverMap.has(lid)) {
          coverMap.set(lid, { thumb, url });
          continue;
        }

        const ex = coverMap.get(lid)!;
        const exCandidate = (ex.thumb || ex.url) ?? null;
        const exIsImg = isProbablyImage(exCandidate);
        if (!exIsImg && isImg) coverMap.set(lid, { thumb, url });
      }

      return items.map((it) => {
        const c = coverMap.get(String(it.id));
        return {
          ...it,
          cover_thumb: c?.thumb ?? null,
          cover_url: c?.url ?? null,
        };
      });
    } catch {
      return items;
    }
  }

  /** ---------- Reviews (optional seller_reviews) ---------- */
  async function loadReviews(sellerId: string) {
    try {
      const { data, error } = await supabase
        .from("seller_reviews")
        .select(
          `
          id,
          seller_id,
          reviewer_id,
          rating,
          comment,
          created_at,
          reviewer:profiles!seller_reviews_reviewer_id_fkey (
            id,
            full_name,
            company_name,
            avatar_url,
            public_id,
            is_premium,
            verified
          )
        `
        )
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setReviewsEnabled(true);
      setReviews((Array.isArray(data) ? data : []) as any);
    } catch {
      setReviewsEnabled(false);
      setReviews([]);
    }
  }

  /** ---------- Sales Stats (orders table) ---------- */
  async function loadSalesStats(sellerId: string) {
    // Senin verdiğin tablo kolonları: seller, total_amount, status ...
    // Biz completed/paid/delivered sayacağız
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total_amount,status")
        .eq("seller", sellerId)
        .in("status", ["paid", "completed", "delivered"]);

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      setSalesCount(rows.length);
      const total = rows.reduce((a: number, r: any) => a + (Number(r.total_amount) || 0), 0);
      setSalesTotal(total);
    } catch {
      setSalesCount(null);
      setSalesTotal(null);
    }
  }

  /** ---------- Main Load ---------- */

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      if (!id) return;
      setLoading(true);

      try {
        await loadMe();

        // Profile
        const { data: p, error: e1 } = await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            company_name,
            avatar_url,
            public_id,
            city,
            district,
            account_type,
            is_premium,
            verified,
            kyc_status,
            phone,
            phone_number,
            email,
            is_online,
            last_seen_at,
            created_at
          `
          )
          .eq("id", id)
          .single();

        if (e1) throw e1;
        if (!alive) return;
        setProfile(p as any);

        // Cover
        const cov = await loadCover(String(id));
        if (!alive) return;
        setCoverUrl(cov);

        // Block state
        await loadBlockState(String(id));

        // Listings
        const nowIso = new Date().toISOString();
        const { data: l, error: e2 } = await supabase
          .from("listings")
          .select(
            `
            id,
            title,
            description,
            product_type,
            product_name,
            post_type,
            city,
            district,
            neighborhood,
            market_name,
            price_per_unit,
            price,
            unit,
            min_quantity,
            quantity,
            is_active,
            is_boosted,
            expires_at,
            created_at,
            seller_id,
            deleted_at
          `
          )
          .eq("seller_id", id)
          .is("deleted_at", null)
          .eq("is_active", true)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
          .order("is_boosted", { ascending: false })
          .order("created_at", { ascending: false });

        if (e2) throw e2;

        const base = Array.isArray(l) ? l : [];
        setListingCount(base.length);

        // attach listing photos
        const merged = await attachListingCovers(base);
        if (!alive) return;

        // LiveCard seller object
        const sellerObj = {
          id: p.id,
          full_name: p.full_name,
          company_name: p.company_name,
          avatar_url: p.avatar_url,
          is_premium: p.is_premium,
          verified: Boolean(p.verified) || String(p.kyc_status ?? "").toLowerCase() === "approved",
          is_online: p.is_online,
          last_seen_at: p.last_seen_at,
        };

        setListings(merged.map((x) => ({ ...x, seller: sellerObj })));

        // reviews + sales
        await loadReviews(String(id));
        await loadSalesStats(String(id));
      } catch (e: any) {
        console.error("PROFILE LOAD ERROR:", e);
        toast({
          variant: "error",
          title: "Yüklenemedi",
          message: e?.message ?? "Profil yüklenemedi.",
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** ---------- Actions ---------- */

  async function ensureLogin(nextUrl?: string) {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (uid) return uid;

    toast({ variant: "warning", title: "Giriş gerekli", message: "Bu işlem için giriş yapmalısın." });
    router.push(`/auth?next=${encodeURIComponent(nextUrl || `/profile/${id}`)}`);
    return null;
  }

  async function startChat() {
    const sellerId = String(id || "");
    const uid = await ensureLogin(`/profile/${sellerId}`);
    if (!uid) return;

    if (uid === sellerId) {
      toast({ variant: "info", title: "Bilgi", message: "Kendi profilinle sohbet açamazsın." });
      return;
    }

    try {
      setMsgBusy(true);
      const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
        p_user_a: uid,
        p_user_b: sellerId,
      });
      if (error) throw error;

      router.push(`/chat/user/${sellerId}?cid=${encodeURIComponent(String(convId))}`);
      setContactOpen(false);
    } catch (e: any) {
      toast({ variant: "error", title: "Açılamadı", message: e?.message ?? "Sohbet açılamadı." });
    } finally {
      setMsgBusy(false);
    }
  }

  async function toggleBlock() {
    const sellerId = String(id || "");
    const uid = await ensureLogin(`/profile/${sellerId}`);
    if (!uid) return;

    if (uid === sellerId) {
      toast({ variant: "info", title: "Bilgi", message: "Kendini engelleyemezsin." });
      return;
    }

    try {
      setBlockBusy(true);

      if (!isBlocked) {
        const { error } = await supabase.from("user_blocks").insert({
          blocker_id: uid,
          blocked_id: sellerId,
        });
        if (error) throw error;

        setIsBlocked(true);
        toast({ variant: "success", title: "Engellendi", message: "Bu satıcı engellendi." });
      } else {
        const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", uid).eq("blocked_id", sellerId);
        if (error) throw error;

        setIsBlocked(false);
        toast({ variant: "success", title: "Kaldırıldı", message: "Engel kaldırıldı." });
      }
    } catch (e: any) {
      toast({ variant: "error", title: "Olmadı", message: e?.message ?? "İşlem başarısız." });
    } finally {
      setBlockBusy(false);
    }
  }

  async function doShare() {
    try {
      const url = typeof window !== "undefined" ? `${window.location.origin}/profile/${id}` : "";
      const title = `HalApp • ${displayName}`;

      if ((navigator as any).share) {
        await (navigator as any).share({ title, text: displayName, url });
        toast({ variant: "success", title: "Paylaşıldı", message: "Paylaşım penceresi açıldı.", durationMs: 1200 });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ variant: "success", title: "Kopyalandı", message: "Profil linki panoya kopyalandı.", durationMs: 1200 });
      }
    } catch (e: any) {
      if (String(e?.name || "").toLowerCase().includes("abort")) {
        toast({ variant: "info", title: "İptal edildi", message: "Paylaşım iptal edildi.", durationMs: 900 });
        return;
      }
      toast({ variant: "error", title: "Paylaşılamadı", message: e?.message ?? "Paylaşım başarısız." });
    }
  }

  async function sendReport() {
    const sellerId = String(id || "");
    const uid = await ensureLogin(`/profile/${sellerId}`);
    if (!uid) return;

    const subj = reportSubject.trim();
    const body = reportBody.trim();
    if (!subj || !body) {
      toast({ variant: "warning", title: "Eksik", message: "Konu ve açıklama yazmalısın." });
      return;
    }

    try {
      setReportBusy(true);

      try {
        const { error } = await supabase.from("reports").insert({
          reporter_id: uid,
          target_type: "profile",
          target_id: sellerId,
          subject: subj,
          message: body,
        });
        if (error) throw error;

        toast({ variant: "success", title: "Gönderildi", message: "Şikayetin alındı.", durationMs: 1400 });
        setReportOpen(false);
        setReportSubject("");
        setReportBody("");
        return;
      } catch {
        const url = typeof window !== "undefined" ? `${window.location.origin}/profile/${sellerId}` : "";
        const subject = encodeURIComponent(`HalApp Şikayet • Satıcı ${sellerId} • ${subj}`);
        const mailBody = encodeURIComponent(
          `Satıcı Profil:\n${url}\n\nSatıcı ID: ${sellerId}\nGönderen: ${uid}\n\nKonu:\n${subj}\n\nAçıklama:\n${body}`
        );
        window.location.href = `mailto:destek@halapp.com?subject=${subject}&body=${mailBody}`;
        toast({ variant: "info", title: "Mail açıldı", message: "Mail uygulaması üzerinden gönder.", durationMs: 1400 });
        setReportOpen(false);
      }
    } finally {
      setReportBusy(false);
    }
  }

  async function addReview(rating: number, comment: string) {
    const sellerId = String(id || "");
    const uid = await ensureLogin(`/profile/${sellerId}`);
    if (!uid) return;

    if (uid === sellerId) {
      toast({ variant: "info", title: "Bilgi", message: "Kendi kendine puan veremezsin." });
      return;
    }

    if (!reviewsEnabled) {
      toast({
        variant: "warning",
        title: "Aktif değil",
        message: "Yorum sistemi henüz aktif değil (seller_reviews tablosu yok).",
      });
      return;
    }

    const c = comment.trim();
    if (!rating || rating < 1 || rating > 5) {
      toast({ variant: "warning", title: "Eksik", message: "1-5 arası puan seç." });
      return;
    }

    try {
      setReviewBusy(true);

      const { data: existing } = await supabase
        .from("seller_reviews")
        .select("id")
        .eq("seller_id", sellerId)
        .eq("reviewer_id", uid)
        .limit(1);

      if (existing && existing.length) {
        const rid = existing[0].id;
        const { error } = await supabase.from("seller_reviews").update({ rating, comment: c }).eq("id", rid);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seller_reviews").insert({
          seller_id: sellerId,
          reviewer_id: uid,
          rating,
          comment: c,
        });
        if (error) throw error;
      }

      toast({ variant: "success", title: "Kaydedildi", message: "Yorumun kaydedildi.", durationMs: 1200 });
      await loadReviews(sellerId);
    } catch (e: any) {
      toast({ variant: "error", title: "Olmadı", message: e?.message ?? "Yorum kaydedilemedi." });
    } finally {
      setReviewBusy(false);
    }
  }

  /** ===================== RENDER ===================== */

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="h-56 rounded-[32px] bg-black/5 dark:bg-white/5 animate-pulse" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-[26px] bg-black/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          Profil bulunamadı.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
        >
          ← Geri
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={doShare}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-black text-black/75 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
          >
            Paylaş
            <span className="opacity-60">↗️</span>
          </button>

          <button
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-500/15 dark:text-rose-200"
          >
            Şikayet Et
          </button>
        </div>
      </div>

      {/* COVER */}
      <div className="relative overflow-hidden rounded-[32px] border border-black/10 dark:border-white/10">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="Kapak" className="h-60 w-full object-cover" />
        ) : (
          <div className="h-60 w-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400" />
        )}

        {/* premium overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,.55),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Cover upload (only self) */}
        {isMyProfile ? (
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover(f);
                // reset
                e.currentTarget.value = "";
              }}
            />

            <button
              disabled={coverBusy}
              onClick={() => coverInputRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur hover:bg-white/15 transition",
                coverBusy && "opacity-70 cursor-not-allowed"
              )}
            >
              {coverBusy ? "Yükleniyor…" : "🖼️ Kapak foto yükle"}
            </button>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl ring-4 ring-white/20 bg-white/10 backdrop-blur">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-lg font-black text-white">
                  {initials(displayName)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-2xl font-black">{displayName}</div>

                {isVerified ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-black">✔ Onaylı</span>
                ) : null}

                {isPremium ? (
                  <span className="rounded-full bg-amber-400/95 px-3 py-1 text-[11px] font-black text-black">
                    ⭐ Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/85">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold">{locationLine}</span>

                {profile.is_online ? (
                  <span className="rounded-full bg-emerald-400/30 px-2.5 py-1 text-[12px] font-black">Online</span>
                ) : profile.last_seen_at ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold">
                    Son görülme: {timeAgo(profile.last_seen_at)}
                  </span>
                ) : null}

                {profile.public_id ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold">@{profile.public_id}</span>
                ) : null}
              </div>

              {/* Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
                  <Stars value={avgRating} size={18} />
                  <span className="text-sm font-black">{reviews.length ? `${avgRating} / 5` : "Puan yok"}</span>
                  <span className="text-xs text-white/75">({reviews.length} yorum)</span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">
                  📊 Toplam ilan: {listingCount}
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">
                  💼 Satış: {salesCount ?? 0}
                  <span className="text-white/80 text-xs">
                    (Toplam ₺ {Number(salesTotal ?? 0).toLocaleString("tr-TR")})
                  </span>
                </div>
              </div>
            </div>

            {/* Right buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setContactOpen(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-white/90 px-4 py-3 text-sm font-black text-black hover:bg-white transition"
              >
                📞 İletişim
              </button>

              {!isMyProfile ? (
                <button
                  disabled={blockBusy}
                  onClick={toggleBlock}
                  className={cn(
                    "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition",
                    isBlocked ? "bg-white/15 text-white hover:bg-white/20" : "bg-rose-500/90 text-white hover:bg-rose-500/80",
                    blockBusy && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {blockBusy ? "İşleniyor..." : isBlocked ? "🚫 Engeli Kaldır" : "🚫 Engelle"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-black text-black/90 dark:text-white/90">İlanlar</div>
          <div className="text-xs text-black/55 dark:text-white/55">{listings.length} sonuç</div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-black/5 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            Bu satıcının aktif ilanı yok.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <LiveCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black text-black/90 dark:text-white/90">⭐ Yorumlar</div>
            <div className="mt-1 text-sm text-black/55 dark:text-white/55">
              {reviewsEnabled ? "Satıcıya puan verip yorum yazabilirsin." : "Yorum sistemi henüz aktif değil (seller_reviews tablosu yok)."}
            </div>
          </div>
        </div>

        {reviewsEnabled ? (
          <div className="mt-4">
            <ReviewComposer disabled={reviewBusy} onSubmit={(r, c) => addReview(r, c)} />
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
              Henüz yorum yok.
            </div>
          ) : (
            reviews.map((r) => {
              const u = r.reviewer ?? null;
              const nm = (u?.company_name?.trim() || u?.full_name?.trim() || "Kullanıcı") ?? "Kullanıcı";
              return (
                <div key={r.id} className="rounded-3xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                        {u?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt={nm} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs font-black text-black/70 dark:text-white/75">
                            {initials(nm)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-black/90 dark:text-white/90">
                          {nm}
                          {u?.verified ? <span className="ml-2 text-[11px] font-black text-emerald-700 dark:text-emerald-200">✔</span> : null}
                          {u?.is_premium ? <span className="ml-1 text-[11px] font-black text-amber-700 dark:text-amber-200">⭐</span> : null}
                        </div>
                        <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                          {new Date(r.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Stars value={Number(r.rating) || 0} size={16} />
                    </div>
                  </div>

                  {r.comment?.trim() ? (
                    <div className="mt-3 text-sm text-black/70 dark:text-white/70 leading-6">{r.comment}</div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CONTACT MODAL */}
      {contactOpen && (
        <Modal onClose={() => setContactOpen(false)} title="İletişim">
          <div className="grid gap-2">
            <button
              disabled={msgBusy}
              onClick={startChat}
              className={cn(
                "rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
                msgBusy && "opacity-70 cursor-not-allowed"
              )}
            >
              {msgBusy ? "Açılıyor..." : "💬 Sohbet Başlat"}
            </button>

            {phone ? (
              <>
                <a
                  href={`tel:${phone}`}
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-black text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                >
                  📞 Ara: {phone}
                </a>

                <a
                  href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-black text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                >
                  🟢 WhatsApp
                </a>
              </>
            ) : (
              <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                Satıcı telefon bilgisi yok.
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* REPORT MODAL */}
      {reportOpen && (
        <Modal onClose={() => setReportOpen(false)} title="Şikayet Formu">
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Konu</div>
              <input
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                placeholder="Örn: Dolandırıcılık şüphesi"
                className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-rose-500/25 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
              />
            </div>

            <div>
              <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Neden / Açıklama</div>
              <textarea
                value={reportBody}
                onChange={(e) => setReportBody(e.target.value)}
                placeholder="Detaylı açıklama yaz..."
                rows={5}
                className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-rose-500/25 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
              />
            </div>

            <button
              disabled={reportBusy}
              onClick={sendReport}
              className={cn(
                "w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400 transition",
                reportBusy && "opacity-70 cursor-not-allowed"
              )}
            >
              {reportBusy ? "Gönderiliyor..." : "Gönder"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** ===================== REVIEW COMPOSER ===================== */

function ReviewComposer({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  return (
    <div className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-black text-black/80 dark:text-white/80">Puan ver</div>

        <div className="inline-flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const v = i + 1;
            const active = v <= rating;
            return (
              <button
                key={v}
                type="button"
                disabled={disabled}
                onClick={() => setRating(v)}
                className={cn(
                  "h-9 w-9 rounded-2xl border border-black/10 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition",
                  active ? "text-amber-500" : "text-black/30 dark:text-white/30",
                  disabled && "opacity-70 cursor-not-allowed"
                )}
                aria-label={`${v} yıldız`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}>
                  <path
                    d="M12 17.5l-6.2 3.3 1.2-7-5-4.9 7-1 3-6.3 3 6.3 7 1-5 4.9 1.2 7L12 17.5z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Yorum yaz (opsiyonel)..."
          className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
        />
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit(rating, comment)}
        className={cn(
          "mt-3 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
          disabled && "opacity-70 cursor-not-allowed"
        )}
      >
        Gönder
      </button>
    </div>
  );
}

/** ===================== MODAL ===================== */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-xl p-3">
        <div className="rounded-[28px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_70px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-zinc-950/95">
          <div className="flex items-start justify-between gap-3">
            <div className="text-lg font-black text-black/90 dark:text-white/90">{title}</div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
            >
              Kapat
            </button>
          </div>

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}