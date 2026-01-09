// app/pazar/[id]/edit/ui/edit-listing-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  product_name: string | null;
  product_type: string | null;
  post_type: string | null;

  city: string | null;
  district: string | null;
  neighborhood: string | null;
  market_name: string | null;

  price: number | null;
  price_per_unit: number | null;
  unit: string | null;

  quantity: number | null;
  min_quantity: number | null;

  is_active: boolean | null;
  is_boosted: boolean | null;
  expires_at: string | null;

  seller_id: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function safeStr(v: any) {
  const s = String(v ?? "").trim();
  return s.length ? s : "";
}

function safeNumStr(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
}

function toNumberOrNull(s: string) {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: any) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return false;
}

export default function EditListingClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [item, setItem] = useState<Listing | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [postType, setPostType] = useState("");

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [marketName, setMarketName] = useState("");

  const [price, setPrice] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [unit, setUnit] = useState("");

  const [quantity, setQuantity] = useState("");
  const [minQuantity, setMinQuantity] = useState("");

  const [isActive, setIsActive] = useState(true);

  const canSave = useMemo(() => {
    return title.trim().length >= 3 && !saving;
  }, [title, saving]);

  async function fetchDetail(signal?: AbortSignal) {
    const r = await fetch(`/api/pazar/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "detail_failed");
    return (j?.item ?? null) as Listing | null;
  }

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const it = await fetchDetail(ac.signal);
        setItem(it);

        if (!it) return;

        setTitle(safeStr(it.title));
        setDescription(safeStr(it.description));

        setProductName(safeStr(it.product_name));
        setProductType(safeStr(it.product_type));
        setPostType(safeStr(it.post_type));

        setCity(safeStr(it.city));
        setDistrict(safeStr(it.district));
        setNeighborhood(safeStr(it.neighborhood));
        setMarketName(safeStr(it.market_name));

        setPrice(safeNumStr(it.price));
        setPricePerUnit(safeNumStr(it.price_per_unit));
        setUnit(safeStr(it.unit));

        setQuantity(safeNumStr(it.quantity));
        setMinQuantity(safeNumStr(it.min_quantity));

        setIsActive(Boolean(it.is_active ?? true));
      } catch (e: any) {
        setErr(e?.message ?? "Hata");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  async function save() {
    if (!canSave) return;

    try {
      setSaving(true);

      // ✅ allowlist patch (manage route allowlist ile uyumlu)
      const patch: any = {
        title: title.trim(),
        description: description.trim() ? description : null,

        product_name: productName.trim() ? productName : null,
        product_type: productType.trim() ? productType : null,
        post_type: postType.trim() ? postType : null,

        city: city.trim() ? city : null,
        district: district.trim() ? district : null,
        neighborhood: neighborhood.trim() ? neighborhood : null,
        market_name: marketName.trim() ? marketName : null,

        // fiyat: ikisinden biri dolu olabilir
        price: toNumberOrNull(price),
        price_per_unit: toNumberOrNull(pricePerUnit),
        unit: unit.trim() ? unit : null,

        quantity: toNumberOrNull(quantity),
        min_quantity: toNumberOrNull(minQuantity),

        is_active: toBool(isActive),
      };

      const r = await fetch(`/api/pazar/${encodeURIComponent(id)}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        if (j?.error === "not_authed") {
          toast({ variant: "info", title: "Giriş gerekli", message: "İlan düzenlemek için giriş yap." });
          router.push(`/auth?next=${encodeURIComponent(`/pazar/${id}/edit`)}`);
          return;
        }
        if (j?.error === "not_allowed") {
          toast({ variant: "error", title: "Yetkisiz", message: "Bu ilanı düzenleme yetkin yok." });
          return;
        }
        throw new Error(j?.error || "update_failed");
      }

      toast({ variant: "success", title: "Kaydedildi", message: "İlan güncellendi." });
      router.replace(`/pazar/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (e: any) {
      toast({ variant: "error", title: "Kaydedilemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        Yükleniyor…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-700 dark:text-rose-200">
        API Hatası: {err}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        İlan bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-sm font-black">Başlık</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: 1 Ton Domates"
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
        />

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-sm font-black">Ürün adı</div>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Örn: Domates"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">Ürün türü</div>
            <input
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="Örn: Sebze / Meyve"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">İlan tipi</div>
            <input
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              placeholder="Örn: satılık / alım"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">Birim</div>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Örn: kg / kasa / ton"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-sm font-black">Fiyat (toplam)</div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Örn: 120000"
              inputMode="decimal"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">Birim fiyat</div>
            <input
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              placeholder="Örn: 25"
              inputMode="decimal"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-sm font-black">Miktar</div>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Örn: 1000"
              inputMode="decimal"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">Minimum</div>
            <input
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="Örn: 100"
              inputMode="decimal"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-sm font-black">Şehir</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Örn: Antalya"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">İlçe</div>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Örn: Kepez"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">Mahalle</div>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Örn: Varsak"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div>
            <div className="text-sm font-black">Hal / Pazar</div>
            <input
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              placeholder="Örn: Antalya Hali"
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
          <div>
            <div className="text-sm font-black">İlan aktif</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">
              Pasif yaparsan pazarda görünmez.
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-black">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Aktif
          </label>
        </div>

        <div className="mt-4">
          <div className="text-sm font-black">Açıklama</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Detayları yaz…"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={!canSave}
            onClick={save}
            className={clsx(
              "rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
              !canSave ? "opacity-60 cursor-not-allowed" : ""
            )}
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>

          <button
            disabled={saving}
            onClick={() => router.replace(`/pazar/${encodeURIComponent(id)}`)}
            className={clsx(
              "rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
              saving ? "opacity-60 cursor-not-allowed" : ""
            )}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}