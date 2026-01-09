// components/listing/ListingActions.tsx
"use client";

import { useMemo, useState } from "react";

type Props = {
  listingId: string;
  title?: string | null;
  sellerPhone?: string | null;
  sellerPhoneNumber?: string | null;
};

function normalizePhone(v?: string | null) {
  const s = (v ?? "").trim();
  if (!s) return "";
  // +90 / 0 / boşluk - parantez temizle
  return s.replace(/[^\d+]/g, "");
}

export default function ListingActions({
  listingId,
  title,
  sellerPhone,
  sellerPhoneNumber,
}: Props) {
  const [copied, setCopied] = useState(false);

  const phone = useMemo(() => {
    return normalizePhone(sellerPhoneNumber) || normalizePhone(sellerPhone);
  }, [sellerPhone, sellerPhoneNumber]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/ilan/${listingId}`;
  }, [listingId]);

  async function copyLink() {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/ilan/${listingId}`
          : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/ilan/${listingId}`
        : "";

    try {
      // Web Share API varsa
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({
          title: title ?? "HalApp İlan",
          text: "HalApp ilan detayı",
          url,
        });
        return;
      }
    } catch {
      // ignore
    }

    // fallback: copy
    await copyLink();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Call / WhatsApp */}
      {phone ? (
        <div className="flex gap-2">
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black hover:bg-emerald-400 transition"
          >
            Ara
          </a>

          <a
            href={`https://wa.me/${phone.replace(/^\+/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-extrabold text-emerald-800 hover:bg-emerald-500/15 transition dark:text-emerald-200"
          >
            WhatsApp
          </a>
        </div>
      ) : (
        <div className="text-xs text-black/60 dark:text-white/60">
          Satıcı telefonu görünmüyor
        </div>
      )}

      {/* Share / Copy */}
      <div className="flex gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2.5 text-sm font-extrabold text-black/75 hover:bg-black/10 transition dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
        >
          Paylaş
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-extrabold text-black/75 hover:bg-white transition dark:border-white/10 dark:bg-black/40 dark:text-white/75"
        >
          {copied ? "Kopyalandı ✓" : "Link Kopyala"}
        </button>
      </div>

      {/* hidden debug url */}
      {shareUrl ? (
        <div className="hidden">{shareUrl}</div>
      ) : null}
    </div>
  );
}