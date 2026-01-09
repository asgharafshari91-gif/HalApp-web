export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ChatClient from "@/components/chat/ChatClient";

type ListingRow = {
  id: string;
  title: string | null;
  product_name: string | null;
  city: string | null;
  district: string | null;
  market_name: string | null;
  neighborhood: string | null;
  seller_id: string | null;
  seller?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen_at: string | null;
  } | null;
};

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, { auth: { persistSession: false } });
}

function safeText(v: any, fallback: string) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fallback;
}

export default async function ChatListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;

  const sb = supabaseServer();

  const { data, error } = await sb
    .from("listings")
    .select(
      `
      id,
      title,
      product_name,
      city,
      district,
      market_name,
      neighborhood,
      seller_id,
      seller:profiles!listings_seller_id_fkey (
        id,
        full_name,
        company_name,
        avatar_url,
        is_online,
        last_seen_at
      )
    `
    )
    .eq("id", listingId)
    .maybeSingle<ListingRow>();

  if (error || !data) {
    return (
      <div className="mt-6">
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-black text-red-700 dark:text-red-300">
            Sohbet açılamadı
          </div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">
            {error?.message ?? "İlan bulunamadı."}
          </div>

          <div className="mt-5">
            <Link
              href="/#canli-ilanlar"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
            >
              ← Canlı ilanlara dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const listing = data;
  const seller = listing.seller ?? null;

  const sellerName = safeText(
    seller?.company_name?.trim() ? seller?.company_name : seller?.full_name,
    "Satıcı"
  );

  const listingTitle = safeText(listing.product_name || listing.title, "İlan");

  const subtitle = [listing.city, listing.district, listing.market_name, listing.neighborhood]
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");

  const peerId = listing.seller_id || seller?.id || "";

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/listing/${listing.id}`}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition"
          >
            <span className="text-lg">←</span> İlan detayına dön
          </Link>

          <h1 className="mt-2 truncate text-2xl sm:text-3xl font-black tracking-tight text-black/95 dark:text-white/95">
            {sellerName}
          </h1>

          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            <span className="font-extrabold text-black/75 dark:text-white/75">
              {listingTitle}
            </span>
            {subtitle ? <span> • {subtitle}</span> : null}
          </div>
        </div>

        <Link
          href={`/listing/${listing.id}`}
          className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-2 text-sm font-extrabold text-emerald-900 hover:bg-emerald-500/18 dark:text-emerald-200 transition"
        >
          İlan Detayı →
        </Link>
      </div>

      <div className="mt-5">
        <ChatClient
          listingId={listing.id}
          peerId={peerId}
          peerName={sellerName}
          peerAvatarUrl={seller?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}