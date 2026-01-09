"use client";

import { useEffect } from "react";

export default function MediaLightbox({
  open,
  kind,
  src,
  onClose,
}: {
  open: boolean;
  kind: "image" | "video";
  src: string | null;
  onClose: () => void;
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-extrabold text-white/85">
              {kind === "image" ? "Fotoğraf" : "Video"}
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-extrabold text-white/80 hover:bg-white/10 transition"
            >
              Kapat ✕
            </button>
          </div>

          <div className="p-3">
            {kind === "image" ? (
              <img
                src={src}
                alt="Media"
                className="mx-auto max-h-[78vh] w-auto rounded-2xl object-contain"
              />
            ) : (
              <video
                src={src}
                controls
                autoPlay
                className="w-full max-h-[78vh] rounded-2xl"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}