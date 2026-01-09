"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { formatTRY, formatUnitPrice, safeText } from "@/lib/format";

type ListingRow = {
  id: string;
  user_id?: string | null; // sende seller_id ise buna göre değiştir
  title: string | null;
  product_name: string | null;
  description: string | null;

  city: string | null;
  district: string | null;
  market_name: string | null;
  neighborhood: string | null;

  unit: string | null;
  quantity: number | null;
  min_quantity: number | null;

  price_per_unit: number | null;
  min_price: number | null;
  max_price: number | null;

  is_boosted: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
};

function timeAgoShort(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g`;
  if (hr > 0) return `${hr}s`;
  if (min > 0) return `${min}dk`;
  return "az önce";
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
      {children}
    </span>
  );
}

export default function MyListingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<ListingRow[]>([]);

  const empty = !loading && rows.length === 0;

  const countBoosted = useMemo(
    () => rows.filter((x) => Boolean(x.is_boosted)).length,
    [rows]
  );

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

      // ✅ sende user_id yerine seller_id ise: .eq("seller_id", uid)
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id,title,product_name,description,city,district,market_name,neighborhood,unit,quantity,min_quantity,price_per_unit,min_price,max_price,is_boosted,is_active,created_at"
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRows((data ?? []) as ListingRow[]);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "İlanlar yüklenemedi",
        message: e?.message ?? "Bir hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_active: !current })
        .eq("id", id);
      if (error) throw error;

      toast({
        variant: "success",
        title: "Güncellendi",
        message: !current ? "İlan yayına alındı." : "İlan pasife alındı.",
      });

      setRows((prev) =>
        prev.map((x) => (x.id === id ? { ...x, is_active: !current } : x))
      );
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Güncellenemedi",
        message: e?.message ?? "Bir hata oluştu.",
      });
    }
  }

  async function removeListing(id: string) {
    if (!confirm("Bu ilan silinsin mi?")) return;
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;

      toast({
        variant: "success",
        title: "Silindi",
        message: "İlan kaldırıldı.",
      });

      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Silinemedi",
        message: e?.message ?? "Bir hata oluştu.",
      });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">İlanlarım</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Kendi ilanlarını yönet.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/live"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
          >
            Canlı İlanlar
          </Link>
          <Link
            href="/new-listing"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            + Yeni İlan
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
            Toplam
          </div>
          <div className="mt-1 text-2xl font-black">{rows.length}</div>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
            Öne Çıkan
          </div>
          <div className="mt-1 text-2xl font-black">{countBoosted}</div>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
            Yayında
          </div>
          <div className="mt-1 text-2xl font-black">
            {rows.filter((x) => x.is_active !== false).length}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">
            Yükleniyor…
          </div>
        ) : empty ? (
          <div className="p-6 text-sm text-black/60 dark:text-white/60">
            Henüz ilan yok. “Yeni İlan” ile ekleyebilirsin.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((x) => {
              const title = safeText(x.product_name || x.title, "İlan");
              const loc = [x.city, x.district, x.market_name]
                .filter(Boolean)
                .slice(0, 3)
                .join(" • ");
              const active = x.is_active !== false;

              return (
                <div
                  key={x.id}
                  className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">
                          {title}
                        </div>
                        {x.is_boosted ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                            Öne Çıkan
                          </span>
                        ) : null}
                        <Chip>{active ? "Yayında" : "Pasif"}</Chip>
                      </div>

                      <div className="mt-1 text-xs text-black/55 dark:text-white/55">
                        {loc || "—"}{" "}
                        {x.created_at ? <span>• {timeAgoShort(x.created_at)}</span> : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Chip>
                          Birim:{" "}
                          <b className="ml-1">{formatUnitPrice(x.price_per_unit, x.unit)}</b>
                        </Chip>
                        <Chip>
                          Aralık:{" "}
                          <b className="ml-1">{formatTRY(x.min_price)} - {formatTRY(x.max_price)}</b>
                        </Chip>
                        <Chip>
                          Miktar:{" "}
                          <b className="ml-1">
                            {x.quantity ?? x.min_quantity ?? "—"} {(x.unit ?? "").trim()}
                          </b>
                        </Chip>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      <Link
                        href={`/listing/${x.id}`}
                        className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition text-center"
                      >
                        Gör
                      </Link>

                      <button
                        onClick={() => toggleActive(x.id, active)}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 transition"
                      >
                        {active ? "Pasife al" : "Yayına al"}
                      </button>

                      <button
                        onClick={() => removeListing(x.id)}
                        className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-black text-white hover:bg-rose-400 transition"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}