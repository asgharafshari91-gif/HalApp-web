"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type ListingRow = {
  id: string;
  title: string | null;
  price: number | null;
  currency: string | null;
  cover_url: string | null;
  city: string | null;
  district: string | null;
  created_at: string | null;
  status?: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function bust(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return "";
  const hasQ = u.includes("?");
  return `${u}${hasQ ? "&" : "?"}t=${Date.now()}`;
}

function safeTab(v: string | null) {
  // /my-listings?tab=all|active|passive|sold gibi büyütebilirsin
  if (!v) return "all";
  if (!["all", "active", "passive", "sold"].includes(v)) return "all";
  return v as "all" | "active" | "passive" | "sold";
}

export default function MyListingsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  const tab = useMemo(() => safeTab(sp.get("tab")), [sp]);

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<ListingRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;

      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/my-listings")}`);
        return;
      }
      setMyId(uid);

      // ✅ Buradaki owner_id alanı sende farklıysa düzelt:
      // .eq("owner_id", uid)  -> .eq("user_id", uid) gibi
      const q = supabase
        .from("listings")
        .select("id,title,price,currency,cover_url,city,district,created_at,status")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });

      // Tab filtre (opsiyonel)
      if (tab !== "all") {
        // status değerlerin farklıysa burada uyarlarsın
        // örnek: active / passive / sold
        (q as any).eq("status", tab);
      }

      const { data, error } = await q;
      if (error) throw error;

      setRows((data ?? []) as ListingRow[]);
    } catch (e: any) {
      toast({ variant: "error", title: "İlanlar yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">İlanlarım</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">Yayınladığın ilanları buradan yönet.</div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/my-listings?tab=all"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              tab === "all"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Tümü
          </Link>

          <Link
            href="/my-listings?tab=active"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              tab === "active"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Aktif
          </Link>

          <Link
            href="/my-listings?tab=passive"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              tab === "passive"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Pasif
          </Link>

          <Link
            href="/my-listings?tab=sold"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              tab === "sold"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Satıldı
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
          >
            ← Geri
          </Link>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Henüz ilan yok.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((l) => {
              const title = l.title?.trim() || "İlan";
              const loc = [l.city, l.district].filter(Boolean).join(" / ");

              return (
                <div
                  key={l.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <Link href={`/listing/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                      {l.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bust(l.cover_url)} alt="Cover" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/60 dark:text-white/60">
                          📦
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">{title}</div>
                        <div className="shrink-0 text-xs text-black/50 dark:text-white/50">
                          {l.created_at ? new Date(l.created_at).toLocaleDateString("tr-TR") : ""}
                        </div>
                      </div>

                      <div className="mt-1 truncate text-xs text-black/60 dark:text-white/60">
                        {loc || "—"}
                        {l.price != null ? (
                          <>
                            {" "}
                            • <b className="text-black/75 dark:text-white/75">{l.price}</b>{" "}
                            <span className="opacity-80">{l.currency ?? "TL"}</span>
                          </>
                        ) : null}
                        {l.status ? (
                          <>
                            {" "}
                            • <span className="font-bold opacity-80">{l.status}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/listing/${l.id}/edit`}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
                  >
                    Düzenle
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-black/45 dark:text-white/45">
        Eğer ilan tablon “listings” değilse veya sahip alanı “owner_id” değilse, Supabase şema screenshot at — 1 dakikada
        birebir uyarlarım.
      </div>
    </div>
  );
}