"use client";

import React, { useEffect, useMemo, useState } from "react";

export type MediaType = "image" | "video";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function isVideoType(t: any): t is "video" {
  return String(t) === "video";
}

function guessTypeFromUrl(url: string): MediaType {
  const u = String(url || "").toLowerCase();
  if (u.includes(".mp4") || u.includes(".mov") || u.includes(".webm") || u.includes("video")) return "video";
  return "image";
}

function buildPosters(urls: string[], types: MediaType[]) {
  // video poster yoksa null (Lightbox null kabul eder)
  return urls.map((u, i) => (types[i] === "video" ? null : u));
}

/** ✅ LIGHTBOX */
export function Lightbox({
  open,
  title,
  urls,
  types,
  posters,
  startIndex,
  onClose,
}: {
  open: boolean;
  title: string;
  urls: string[];
  types: MediaType[];
  posters?: Array<string | null>;
  startIndex?: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (open) setI(Math.max(0, Math.min(startIndex ?? 0, Math.max(0, urls.length - 1))));
  }, [open, startIndex, urls.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setI((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setI((p) => Math.min(urls.length - 1, p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, urls.length]);

  if (!open) return null;

  const t: MediaType = types[i] ?? guessTypeFromUrl(urls[i] ?? "");
  const src = urls[i] ?? "";
  const poster = posters?.[i] ?? null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(1100px,96vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{title || "Medya"}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-white/60">
                {urls.length ? `${i + 1} / ${urls.length}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setI((p) => Math.max(0, p - 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-white hover:bg-white/10 disabled:opacity-40"
                disabled={i <= 0}
              >
                ‹
              </button>
              <button
                onClick={() => setI((p) => Math.min(urls.length - 1, p + 1))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-white hover:bg-white/10 disabled:opacity-40"
                disabled={i >= urls.length - 1}
              >
                ›
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-white hover:bg-white/10"
              >
                Kapat
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              {t === "video" ? (
                <video
                  src={src}
                  poster={poster ?? undefined}
                  className="h-[70vh] w-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <img src={src} alt="media" className="h-[70vh] w-full object-contain" />
              )}
            </div>

            <div className="mt-3 text-[11px] font-semibold text-white/60">
              İpucu: <span className="font-black text-white/80">ESC</span> kapatır •{" "}
              <span className="font-black text-white/80">←/→</span> değiştirir • double click fullscreen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ✅ KARE MEDYA (Pazar kartları için) */
export function SquareMedia({
  title,
  urls,
  types,
  onOpen,
  isBoosted,
  isPremiumSeller,
}: {
  title: string;
  urls: string[];
  types: MediaType[];
  onOpen: (index: number, posters: Array<string | null>) => void;
  isBoosted?: boolean;
  isPremiumSeller?: boolean;
}) {
  const safeUrls = Array.isArray(urls) ? urls : [];
  const safeTypes = Array.isArray(types) ? types : [];
  const first = safeUrls[0] ?? "";
  const firstType: MediaType = safeTypes[0] ?? guessTypeFromUrl(first);

  const posters = useMemo(() => buildPosters(safeUrls, safeTypes), [safeUrls, safeTypes]);
  const mediaCount = Math.min(safeUrls.length, safeTypes.length);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => safeUrls.length && onOpen(0, posters)}
        className={cn(
          "relative block w-full overflow-hidden rounded-[24px] border text-left shadow-sm transition hover:shadow-md",
          "border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950"
        )}
        title={title}
      >
        <div className="relative aspect-square w-full bg-black/5 dark:bg-white/5">
          {/* rozetler */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            {isBoosted ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                🚀 Boost
              </span>
            ) : null}

            {isPremiumSeller ? (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200">
                ⭐ Premium satıcı
              </span>
            ) : null}
          </div>

          {/* sayaç */}
          {mediaCount ? (
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-black text-white backdrop-blur">
              {mediaCount} • {firstType === "video" ? "Video" : "Foto"}
            </div>
          ) : null}

          {/* medya */}
          {first ? (
            firstType === "video" ? (
              <video src={first} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={first} alt={title || "media"} className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-500 dark:text-zinc-400">
              Medya yok
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition hover:opacity-100" />
        </div>
      </button>

      {/* thumbnail şeridi */}
      {mediaCount > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {safeUrls.slice(0, 5).map((u, idx) => {
            const t: MediaType = safeTypes[idx] ?? guessTypeFromUrl(u);
            return (
              <button
                key={`${u}-${idx}`}
                type="button"
                onClick={() => onOpen(idx, posters)}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
                title={`${idx + 1}. medya`}
              >
                <div className="aspect-square w-full bg-black/5 dark:bg-white/5">
                  {t === "video" ? (
                    <video src={u} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={u} alt="thumb" className="h-full w-full object-cover" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** ✅ (Opsiyonel) Basit Medya parse helper — listings tablosunda media_urls/media_types varsa */
export function getListingMedia(listing: any): { urls: string[]; types: MediaType[] } {
  const urls: string[] = Array.isArray(listing?.media_urls) ? listing.media_urls : [];
  const typesRaw: any[] = Array.isArray(listing?.media_types) ? listing.media_types : [];
  const types: MediaType[] = typesRaw.map((t) => (isVideoType(t) ? "video" : "image"));
  const len = Math.min(urls.length, types.length);
  return { urls: urls.slice(0, len), types: types.slice(0, len) };
}