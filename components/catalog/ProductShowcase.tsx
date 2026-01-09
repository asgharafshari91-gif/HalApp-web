"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  category: "meyve" | "sebze";
  image_url: string | null;
  is_featured: boolean;
};

export default function ProductShowcase() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products_catalog")
      .select("id,name,category,image_url,is_featured")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(24)
      .then(({ data }) => {
        setItems((data ?? []) as any);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xl font-black tracking-tight">Meyve & Sebze</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Profesyonel vitrin — hızlı erişim.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-[24px] border border-black/10 bg-white/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_55px_rgba(0,0,0,0.10)] dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute -inset-10 bg-[radial-gradient(circle_at_25%_15%,rgba(34,197,94,.16),transparent_55%)]" />
            </div>

            <div className="relative flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-black/5 dark:ring-white/10 dark:bg-white/5">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/60 dark:text-white/60">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate text-[15px] font-black">{p.name}</div>
                <div className="mt-0.5 inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] font-extrabold text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  {p.category === "meyve" ? "Meyve" : "Sebze"}
                </div>
              </div>

              {p.is_featured ? (
                <div className="ml-auto inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
                  Öne Çıkan
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}