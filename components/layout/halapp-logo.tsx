// components/layout/halapp-logo.tsx

"use client";

export default function HalAppLogo() {
  return (
    <div className="relative flex items-center gap-3">
      {/* Glow */}
      <div className="absolute -inset-3 rounded-3xl bg-emerald-500/20 blur-2xl" />

      {/* Icon */}
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_10px_35px_rgba(16,185,129,.35)]">
        <span className="text-lg font-black text-black">
          H
        </span>
      </div>

      {/* Text */}
      <div className="relative leading-tight">
        <div className="text-[20px] font-black tracking-tight text-white">
          HalApp
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/90">
          Premium Marketplace
        </div>
      </div>
    </div>
  );
}