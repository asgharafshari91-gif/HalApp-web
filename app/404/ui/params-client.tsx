"use client";

import { useSearchParams } from "next/navigation";

export default function ParamsClient() {
  // İstersen kullan, istemezsen tamamen kaldırabilirsin.
  const sp = useSearchParams();
  const next = sp.get("next");

  // Burada sadece okunacak ufak bir şey yapıyoruz (opsiyonel)
  if (!next) return null;

  return (
    <div className="mt-2 text-xs text-black/50 dark:text-white/50">
      İpucu: <span className="font-bold">{next}</span>
    </div>
  );
}