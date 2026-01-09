"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* sheet */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl">
        <div className="rounded-t-[28px] border border-black/10 bg-white/90 shadow-[0_-20px_60px_rgba(0,0,0,.14)] dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-[0_-24px_80px_rgba(0,0,0,.55)]">
          {/* grabber + header */}
          <div className="px-5 pt-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm font-black text-black/90 dark:text-white/90">
                {title ?? "İlan Detayı"}
              </div>
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                onClick={onClose}
              >
                Kapat
              </button>
            </div>
          </div>

          <div className="max-h-[78vh] overflow-auto px-5 pb-6 pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}