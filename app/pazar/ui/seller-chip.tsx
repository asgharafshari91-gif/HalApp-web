"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function looksLikeHttp(s: string) {
  return /^https?:\/\//i.test(s);
}

function normalizePath(s: string) {
  let p = String(s || "").trim();
  if (!p) return "";
  p = p.replace(/^public\//, "");
  p = p.replace(/^\/+/, "");
  return p;
}

/**
 * Favorilerde çalışan yaklaşım:
 * - avatar_url zaten http ise direkt kullan
 * - değilse: avatars bucket -> getPublicUrl(path)
 */
function resolveAvatar(raw: string | null) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;

  if (looksLikeHttp(v)) return v;

  const path = normalizePath(v);
  if (!path) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const u = data?.publicUrl ? String(data.publicUrl) : "";
  return u && looksLikeHttp(u) ? u : null;
}

export default function SellerChip({
  name,
  avatarUrl,
  sub,
  compact,
}: {
  name: string;
  avatarUrl: string | null;
  sub?: string;
  compact?: boolean;
}) {
  const letter = useMemo(() => (name?.trim()?.[0] ?? "U").toUpperCase(), [name]);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(resolveAvatar(avatarUrl));
  }, [avatarUrl]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/35",
        compact && "p-2"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/40",
          compact ? "h-9 w-9" : "h-11 w-11"
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setSrc(null)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-700 dark:text-zinc-200">
            {letter}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className={cn("truncate font-black text-zinc-900 dark:text-zinc-100", compact ? "text-sm" : "text-[15px]")}>
          {name}
        </div>
        {sub ? (
          <div className={cn("truncate text-zinc-600 dark:text-zinc-400", compact ? "text-[11px]" : "text-xs")}>
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}