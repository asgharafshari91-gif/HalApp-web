"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import LiveCard from "@/components/live/LiveCard";

type Props = {
  currentId: string;
  city?: string | null;
  productName?: string | null;
  productType?: string | null;
};

type SellerProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  kyc_status: string | null;
  is_online: boolean;
  last_seen_at: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  description: string | null;
  product_type: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  market_name: string | null;
  price_per_unit: number | null;
  unit: string | null;
  min_quantity: number | null;
  is_active: boolean | null;
  is_boosted: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  seller_id: string | null;
  post_type: string | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
  min_price: number | null;
  max_price: number | null;
  deleted_at: string | null;
  seller?: SellerProfile | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: ListingRow[] };

function isVerified(kycStatus: string | null | undefined) {
  const v = (kycStatus ?? "").toLowerCase().trim();
  return v === "approved" || v === "verified" || v === "ok";
}

function normalizeSeller(s: unknown): SellerProfile | null {
  if (!s) return null;
  const obj = Array.isArray(s) ? s[0] : s;
  if (!obj || typeof obj !== "object") return null;
  const o = obj as any;
  return {
    id: String(o.id ?? ""),
    full_name: (o.full_name ?? null) as any,
    company_name: (o.company_name ?? null) as any,
    avatar_url: (o.avatar_url ?? null) as any,
    is_premium: Boolean(o.is_premium),
    kyc_status: (o.kyc_status ?? null) as any,
    is_online: Boolean(o.is_online),
    last_seen_at: (o.last_seen_at ?? null) as any,
  };
}

function normalizeListing(r: any): ListingRow | null {
  if (!r || typeof r !== "object") return null;
  return {
    id: String(r.id ?? ""),
    title: (r.title ?? null) as any,
    description: (r.description ?? null) as any,
    product_type: (r.product_type ?? null) as any,
    city: (r.city ?? null) as any,
    district: (r.district ?? null) as any,
    neighborhood: (r.neighborhood ?? null) as any,
    market_name: (r.market_name ?? null) as any,
    price_per_unit: (r.price_per_unit ?? null) as any,
    unit: (r.unit ?? null) as any,
    min_quantity: (r.min_quantity ?? null) as any,
    is_active: (r.is_active ?? null) as any,
    is_boosted: (r.is_boosted ?? null) as any,
    expires_at: (r.expires_at ?? null) as any,
    created_at: (r.created_at ?? null) as any,
    seller_id: (r.seller_id ?? null) as any,
    post_type: (r.post_type ?? null) as any,
    product_name: (r.product_name ?? null) as any,
    quantity: (r.quantity ?? null) as any,
    price: (r.price ?? null) as any,
    min_price: (r.min_price ?? null) as any,
    max_price: (r.max_price ?? null) as any,
    deleted_at: (r.deleted_at ?? null) as any,
    seller: normalizeSeller(r.seller),
  };
}

export default function SimilarListings({ currentId, city, productName, productType }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      const today = new Date().toISOString().slice(0, 10);

      // “Benzerlik”: product_name varsa ona göre, yoksa product_type.
      // Şehir varsa aynı şehirden öncelik.
      let query = supabase
        .from("listings")
        .select(
          `
          id,
          title,
          description,
          product_type,
          city,
          district,
          neighborhood,
          market_name,
          price_per_unit,
          unit,
          min_quantity,
          is_active,
          is_boosted,
          expires_at,
          created_at,
          seller_id,
          post_type,
          product_name,
          quantity,
          price,
          min_price,
          max_price,
          deleted_at,
          seller:profiles!listings_seller_id_fkey (
            id,
            full_name,
            company_name,
            avatar_url,
            is_premium,
            kyc_status,
            is_online,
            last_seen_at
          )
        `
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gte.${today}`)
        .neq("id", currentId);

      const pn = (productName ?? "").trim();
      const pt = (productType ?? "").trim();
      const c = (city ?? "").trim();

      if (pn) {
        query = query.ilike("product_name", `%${pn}%`);
      } else if (pt) {
        query = query.ilike("product_type", `%${pt}%`);
      }

      if (c) {
        query = query.eq("city", c);
      }

      const { data, error } = await query
        .order("is_boosted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (cancelled) return;

      if (error) {
        setState({ status: "error", message: error.message });
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const items = rows.map(normalizeListing).filter(Boolean) as ListingRow[];
      setState({ status: "ready", items });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentId, city, productName, productType]);

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[26px] border border-black/10 bg-white/70 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.06)] animate-pulse dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="h-4 w-28 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-3 h-5 w-2/3 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-4 w-1/2 rounded bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (state.status === "error") {
      return (
        <div className="rounded-[26px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-black text-red-700 dark:text-red-300">
            Benzer ilanlar yüklenemedi
          </div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">{state.message}</div>
        </div>
      );
    }

    if (state.items.length === 0) {
      return (
        <div className="rounded-[26px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-black text-black/90 dark:text-white/90">
            Benzer ilan bulunamadı
          </div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">
            Şimdilik aynı kategori/şehirden yeni ilan yok.
          </div>
          <Link
            href="/#canli-ilanlar"
            className="mt-4 inline-flex w-fit items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
          >
            Canlı ilanlara dön
          </Link>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.items.map((item) => (
          <LiveCard
            key={item.id}
            item={
              {
                ...item,
                seller: item.seller
                  ? ({
                      ...item.seller,
                      verified: isVerified(item.seller.kyc_status),
                    } as any)
                  : null,
              } as any
            }
          />
        ))}
      </div>
    );
  }, [state]);

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-black/95 dark:text-white/95">
            Benzer İlanlar
          </h3>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Aynı ürün / kategori / şehir yakın ilanlar
          </p>
        </div>
      </div>

      <div className="mt-5">{content}</div>
    </section>
  );
}