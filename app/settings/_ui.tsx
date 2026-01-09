"use client";

import React from "react";

export function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="text-lg font-black">{title}</div>
      {desc ? (
        <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">
          {desc}
        </div>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function Row({
  title,
  desc,
  left,
  right,
  onClick,
}: {
  title: string;
  desc?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        "w-full text-left",
        "flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-black/5 p-4",
        "dark:border-white/10 dark:bg-white/5",
        onClick && "hover:bg-black/10 dark:hover:bg-white/10 transition"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {left ? (
          <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white/70 text-black/80 dark:border-white/10 dark:bg-black/30 dark:text-white/80">
            {left}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-black text-black/85 dark:text-white/85">{title}</div>
          {desc ? <div className="mt-1 text-xs text-black/60 dark:text-white/60">{desc}</div> : null}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {right}
        {onClick ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-55">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : null}
      </div>
    </Comp>
  );
}

export function BackBar({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <a
        href="/settings"
        className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm font-black text-black/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
      >
        ← Geri
      </a>
      <div className="text-base font-black text-black/90 dark:text-white/90">{title}</div>
    </div>
  );
}