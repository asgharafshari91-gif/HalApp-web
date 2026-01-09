"use client";

import { useEffect } from "react";

export default function MediaLightbox({
  open,
  onClose,
  src,
  title = "Medya",
  type = "image",
}: {
  open: boolean;
  onClose: () => void;
  src: string | null;
  title?: string;
  type?: "image" | "video";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/80 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="truncate text-sm font-extrabold text-white/90">{title}</div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white/85 hover:bg-white/10 transition"
            >
              Kapat
            </button>
          </div>

          <div className="p-3">
            {type === "video" ? (
              <video
                src={src}
                controls
                autoPlay
                className="max-h-[75vh] w-full rounded-2xl bg-black"
              />
            ) : (
              <img
                src={src}
                alt="Fotoğraf"
                className="max-h-[75vh] w-full rounded-2xl object-contain bg-black"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}