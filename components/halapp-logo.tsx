import React from "react";

type Props = {
  className?: string;
  size?: number;
  withText?: boolean;
};

export default function HalAppLogo({ className = "", size = 36, withText = true }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative grid place-items-center rounded-2xl"
        style={{ width: size, height: size }}
        aria-label="HalApp"
      >
        {/* App icon vibe */}
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(106,255,148,.35),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(34,197,94,.35),transparent_50%)]" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-500/30 to-emerald-900/30" />
        <div className="absolute inset-0 rounded-2xl border border-emerald-300/20" />
        <div className="absolute inset-0 rounded-2xl shadow-[0_18px_60px_rgba(34,197,94,.15)]" />

        {/* Leaf */}
        <svg
          width={Math.max(18, Math.round(size * 0.56))}
          height={Math.max(18, Math.round(size * 0.56))}
          viewBox="0 0 64 64"
          fill="none"
          className="relative"
        >
          <path
            d="M52 14c-9 1-18 4-25 11S17 41 16 50c9 1 18-2 25-9s10-16 11-27Z"
            fill="url(#g1)"
          />
          <path
            d="M22 46c6-10 14-18 26-26"
            stroke="rgba(6,95,70,.9)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="g1" x1="18" y1="50" x2="52" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22c55e" />
              <stop offset="1" stopColor="#86efac" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {withText && (
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-white">
            HalApp
          </div>
          <div className="text-[12px] text-white/60">
            Premium • Hızlı • Güvenli
          </div>
        </div>
      )}
    </div>
  );
}