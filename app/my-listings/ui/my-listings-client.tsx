"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import EditListingModel from "./edit-listing-model";
import { Lightbox, SquareMedia } from "./listing-card";

type MediaType = "image" | "video";
type TabType = "listings" | "create";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function fmtNum(v: any) {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR");
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("tr-TR");
}

function isVideoType(t: any): t is "video" {
  return String(t) === "video";
}

function fmtPrice(x: any) {
  const unit = x?.unit ? String(x.unit) : null;

  const ppu = x?.price_per_unit;
  const price = x?.price;
  const minP = x?.min_price;
  const maxP = x?.max_price;

  const hasPPU = ppu != null && Number.isFinite(Number(ppu));
  const hasPrice = price != null && Number.isFinite(Number(price));
  const hasMin = minP != null && Number.isFinite(Number(minP));
  const hasMax = maxP != null && Number.isFinite(Number(maxP));

  if (hasPPU) return { main: fmtNum(ppu), sub: unit ? `/ ${unit}` : "" };
  if (hasPrice) return { main: fmtNum(price), sub: "Toplam" };
  if (hasMin && hasMax) return { main: `${fmtNum(minP)} - ${fmtNum(maxP)}`, sub: "Aralık" };
  if (hasMin) return { main: fmtNum(minP), sub: "Min" };
  if (hasMax) return { main: fmtNum(maxP), sub: "Max" };

  return { main: "—", sub: "" };
}

export default function MyListingsClient({ initialListings }: { initialListings: any[] }) {
  const router = useRouter();

  const [items, setItems] = useState<any[]>(initialListings);
  const [activeTab, setActiveTab] = useState<TabType>("listings");

  const [profileLoading, setProfileLoading] = useState(true);
  const [kycApproved, setKycApproved] = useState(false);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "boosted">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbTitle, setLbTitle] = useState("");
  const [lbUrls, setLbUrls] = useState<string[]>([]);
  const [lbTypes, setLbTypes] = useState<MediaType[]>([]);
  const [lbPosters, setLbPosters] = useState<Array<string | null>>([]);
  const [lbStart, setLbStart] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setProfileLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setKycApproved(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.log("profile error:", error.message);
        setKycApproved(false);
        return;
      }

      const approved =
        data?.kyc_status === "approved" ||
        data?.kyc_status === "approved_verified" ||
        data?.kyc_status === "verified" ||
        data?.is_kyc_verified === true ||
        data?.kyc_approved === true ||
        data?.verified_seller === true;

      setKycApproved(Boolean(approved));
    } finally {
      setProfileLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.is_active).length;
    const inactive = total - active;
    const boosted = items.filter((x) => x.is_boosted || x.is_featured).length;
    return { total, active, inactive, boosted };
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items
      .filter((x) => {
        if (filter === "active" && !x.is_active) return false;
        if (filter === "inactive" && x.is_active) return false;
        if (filter === "boosted" && !x.is_boosted && !x.is_featured) return false;
        return true;
      })
      .filter((x) => {
        if (!qq) return true;

        const hay = `${x.title ?? ""} ${x.description ?? ""} ${x.product_name ?? ""} ${x.product_type ?? ""} ${x.city ?? ""} ${x.district ?? ""} ${x.market_name ?? ""}`.toLowerCase();

        return hay.includes(qq);
      });
  }, [items, q, filter]);

  function openEdit(row: any) {
    setEditing(row);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditing(null);
  }

  function getMedia(x: any): { urls: string[]; types: MediaType[] } {
    const urls: string[] = Array.isArray(x.media_urls) ? x.media_urls : [];
    const typesRaw: any[] = Array.isArray(x.media_types) ? x.media_types : [];

    const types: MediaType[] = typesRaw.map((t) => (isVideoType(t) ? "video" : "image"));
    const len = Math.min(urls.length, types.length);

    return { urls: urls.slice(0, len), types: types.slice(0, len) };
  }

  async function savePatch(patch: any) {
    setBusyId(patch.id);
    setToast(null);

    try {
      const { error } = await supabase
        .from("listings")
        .update({
          title: patch.title,
          description: patch.description,
          product_type: patch.product_type,
          product_name: patch.product_name,
          city: patch.city,
          district: patch.district,
          neighborhood: patch.neighborhood,
          market_name: patch.market_name,
          price_per_unit: patch.price_per_unit,
          unit: patch.unit,
          min_quantity: patch.min_quantity,
          quantity: patch.quantity,
          price: patch.price,
          min_price: patch.min_price,
          max_price: patch.max_price,
          post_type: patch.post_type,
          is_active: patch.is_active,
          expires_at: patch.expires_at,
          media_urls: patch.media_urls ?? [],
          media_types: patch.media_types ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", patch.id);

      if (error) throw error;

      setItems((prev) => prev.map((it) => (it.id === patch.id ? { ...it, ...patch } : it)));
      setToast({ type: "ok", msg: "İlan kaydedildi." });
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ? String(e.message) : "Kaydetme hatası" });
      throw e;
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(id: string, value: boolean) {
    setBusyId(id);
    setToast(null);

    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_active: value, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_active: value } : it)));
      setToast({ type: "ok", msg: value ? "İlan yayına alındı." : "İlan yayından kaldırıldı." });
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ? String(e.message) : "İşlem hatası" });
    } finally {
      setBusyId(null);
    }
  }

  async function republish(id: string) {
    setBusyId(id);
    setToast(null);

    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      const expiresAt = expires.toISOString().slice(0, 10);

      const { error } = await supabase
        .from("listings")
        .update({
          is_active: true,
          deleted_at: null,
          expires_at: expiresAt,
          last_renewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, is_active: true, deleted_at: null, expires_at: expiresAt }
            : it
        )
      );

      setToast({ type: "ok", msg: "İlan yeniden paylaşıldı." });
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ? String(e.message) : "Yeniden paylaş hatası" });
    } finally {
      setBusyId(null);
    }
  }

  async function softDelete(id: string) {
    if (!window.confirm("Bu ilan silinsin mi?")) return;

    setBusyId(id);
    setToast(null);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("listings")
        .update({ deleted_at: now, is_active: false, updated_at: now })
        .eq("id", id);

      if (error) throw error;

      setItems((prev) => prev.filter((it) => it.id !== id));
      setToast({ type: "ok", msg: "İlan silindi." });
    } catch (e: any) {
      setToast({ type: "err", msg: e?.message ? String(e.message) : "Silme hatası" });
    } finally {
      setBusyId(null);
    }
  }

  function goPayment(item: any, productCode: "boost_24h" | "boost_3d" | "featured_7d") {
    router.push(`/payment?product_code=${productCode}&listing_id=${item.id}&source=my_listings`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Lightbox
        open={lbOpen}
        title={lbTitle}
        urls={lbUrls}
        types={lbTypes}
        posters={lbPosters}
        startIndex={lbStart}
        onClose={() => setLbOpen(false)}
      />

      <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-400/25 to-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/20 to-fuchsia-400/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-gradient-to-tr from-amber-400/15 to-rose-400/10 blur-3xl" />
        </div>

        <div className="relative p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                İlanlarım
              </div>

              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                İlanlarını yönet, düzenle, öne çıkar veya yeni ilan oluştur.
              </div>
            </div>

            {activeTab === "listings" ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ara: başlık, ürün, şehir..."
                  className="w-[min(560px,92vw)] rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
                />

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Yayında</option>
                  <option value="inactive">Kapalı</option>
                  <option value="boosted">Öne Çıkan</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Toplam", value: stats.total },
              { label: "Yayında", value: stats.active },
              { label: "Kapalı", value: stats.inactive },
              { label: "Öne Çıkan", value: stats.boosted },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/40"
              >
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {s.label}
                </div>
                <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl border border-black/10 bg-white/70 p-2 backdrop-blur dark:border-white/10 dark:bg-zinc-900/40">
            <button
              type="button"
              onClick={() => setActiveTab("listings")}
              className={cn(
                "rounded-2xl px-5 py-3 text-sm font-black transition",
                activeTab === "listings"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
              )}
            >
              📦 İlanlarım
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={cn(
                "rounded-2xl px-5 py-3 text-sm font-black transition",
                activeTab === "create"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
              )}
            >
              🚀 İlan Ver
            </button>
          </div>

          {toast ? (
            <div
              className={cn(
                "mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold",
                toast.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
              )}
            >
              {toast.msg}
            </div>
          ) : null}
        </div>
      </div>
{activeTab === "create" ? (
        <div className="mt-6">
          {profileLoading ? (
            <div className="rounded-[28px] border border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-950">
              <div className="text-4xl">⏳</div>
              <div className="mt-3 text-xl font-black">Kontrol ediliyor...</div>
              <div className="mt-2 text-sm text-zinc-500">KYC durumun kontrol ediliyor.</div>
            </div>
          ) : kycApproved ? (
            <div className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-white to-green-500/10 p-8 dark:via-zinc-950">
              <div className="text-xs font-black tracking-[0.25em] text-emerald-600">
                KYC ONAYLI
              </div>

              <h2 className="mt-3 text-4xl font-black text-zinc-900 dark:text-zinc-100">
                Yeni ilan verebilirsin 🚀
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-zinc-400">
                Hesabın doğrulanmış. Ürününü yayınlayabilir, sonra istersen öne çıkarma paketiyle daha fazla alıcıya ulaşabilirsin.
              </p>

              <button
                type="button"
                onClick={() => router.push("/create-listing")}
                className="mt-6 rounded-2xl bg-emerald-500 px-7 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01]"
              >
                🚀 Yeni İlan Oluştur
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-white to-orange-500/10 p-8 dark:via-zinc-950">
              <div className="text-5xl">🔒</div>

              <h2 className="mt-4 text-4xl font-black text-zinc-900 dark:text-zinc-100">
                KYC onayı gerekli
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-zinc-400">
                Güvenli ticaret için ilan vermeden önce kimlik doğrulama/KYC onayının tamamlanması gerekiyor.
              </p>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="mt-6 rounded-2xl bg-amber-500 px-7 py-4 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition hover:scale-[1.01]"
              >
                Kimlik Doğrulamaya Git →
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4">
            {filtered.map((x) => {
              const busy = busyId === x.id;
              const { urls, types } = getMedia(x);
              const priceView = fmtPrice(x);

              const statusCls = x.is_active
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200";

              return (
                <div
                  key={x.id}
                  className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
                >
                  <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[320px_1fr_220px] md:items-start">
                    <div className="md:sticky md:top-5">
                      <SquareMedia
                        title={x.title ?? "İlan"}
                        urls={urls}
                        types={types}
                        onOpen={(startIndex, posters) => {
                          setLbTitle(x.title ?? "İlan");
                          setLbUrls(urls);
                          setLbTypes(types);
                          setLbPosters(posters);
                          setLbStart(startIndex);
                          setLbOpen(true);
                        }}
                      />

                      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
                        İpucu: görsele <span className="font-black">double click</span> → fullscreen
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-lg font-black text-zinc-900 dark:text-zinc-100">
                          {x.title}
                        </div>

                        <span className={cn("rounded-full border px-3 py-1 text-xs font-black", statusCls)}>
                          {x.is_active ? "Yayında" : "Kapalı"}
                        </span>

                        {x.is_boosted || x.is_featured ? (
                          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200">
                            ÖNE ÇIKAN
                          </span>
                        ) : null}

                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                          {urls.length} medya
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/35">
                          <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">Fiyat</div>

                          <div className="mt-1 flex items-end gap-2">
                            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                              {priceView.main}
                            </div>

                            {priceView.sub ? (
                              <div className="pb-[2px] text-sm font-black text-zinc-500 dark:text-zinc-400">
                                {priceView.sub}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Ürün:{" "}
                            <span className="font-black text-zinc-900 dark:text-zinc-100">
                              {x.product_name ?? x.product_type ?? "—"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/35">
                          <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">Konum</div>

                          <div className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-100">
                            {[x.city, x.district, x.neighborhood].filter(Boolean).join(" / ") || "—"}
                          </div>

                          {x.market_name ? (
                            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                              Hal/Pazar:{" "}
                              <span className="font-black text-zinc-900 dark:text-zinc-100">
                                {x.market_name}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-zinc-900/35">
                        <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">Açıklama</div>

                        {x.description ? (
                          <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                            {x.description}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                            Açıklama yok
                          </div>
                        )}

                        <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-500">
                          Oluşturma: {fmtDateTime(x.created_at)} • Bitiş: {x.expires_at ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="md:sticky md:top-5">
                      <div className="rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/35">
                        <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">İşlemler</div>

                        <div className="mt-3 grid gap-2">
                          <button
                            disabled={busy}
                            onClick={() => openEdit(x)}
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
                          >
                            Düzenle
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => republish(x.id)}
                            className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                          >
                            {busy ? "İşleniyor..." : "Yeniden Paylaş"}
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => toggleActive(x.id, !x.is_active)}
                            className={cn(
                              "w-full rounded-2xl border px-4 py-3 text-sm font-black disabled:opacity-50",
                              x.is_active
                                ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/30"
                                : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                            )}
                          >
                            {x.is_active ? "Yayından Kaldır" : "Yayına Al"}
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => goPayment(x, "featured_7d")}
                            className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-900 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/30"
                          >
                            👑 Vitrine Çıkar
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => goPayment(x, "boost_3d")}
                            className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                          >
                            🚀 Boost Satın Al
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => softDelete(x.id)}
                            className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/30"
                          >
                            Sil
                          </button>
                        </div>

                        {x.is_boosted && x.boost_until ? (
                          <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-3 text-[11px] text-zinc-600 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-400">
                            Boost bitiş:{" "}
                            <span className="font-mono">
                              {new Date(x.boost_until).toLocaleString("tr-TR")}
                            </span>
                            {typeof x.boost_score === "number" ? (
                              <>
                                {" "}
                                • skor: <span className="font-black">{x.boost_score}</span>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <EditListingModel open={editOpen} initial={editing} onClose={closeEdit} onSave={savePatch} />
        </>
      )}
    </div>
  );
}