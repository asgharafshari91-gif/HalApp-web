"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MediaType = "image" | "video";
type LocationsMap = Record<string, Record<string, string[]>>;

type Props = {
  open: boolean;
  initial: any | null;
  onClose: () => void;
  onSave: (patch: any) => Promise<void>;
  onMediaInstant?: (listingId: string, urls: string[], types: MediaType[]) => void;
};

const PRODUCTS = [
  "Ahududu",
  "Altınçilek",
  "Amme(Cennet Meyvesi)",
  "Ananas",
  "Armut",
  "Avokado",
  "Ayva",
  "Biber",
  "Biber Çarli",
  "Biber Kapya",
  "Biber Sivri",
  "Biber Üçburun",
  "Blue Berry",
  "Böğürtlen",
  "Brokoli",
  "Çilek",
  "Dereotu",
  "Domates",
  "Domates (Ceri)",
  "Domates (Pembe)",
  "Domates Kokteyl",
  "Elma (Golden)",
  "Elma (Grann Smith)",
  "Elma (Starking)",
  "Fasulye",
  "Fesleğen",
  "Frenk Üzümü",
  "Greyfurt",
  "Havuç",
  "Hıyar",
  "Hindistan Cevizi",
  "Ispanak",
  "Kabak (Bal)",
  "Kabak (Sakız)",
  "Karadeniz Yaprağı",
  "Karnabahar",
  "Kavun(Kırkağaç)",
  "Kereviz",
  "Kivi",
  "Kuzu Kulağı",
  "Lahana (Beyaz)",
  "Lahana (Kırmızı)",
  "Lime Limon",
  "Limon",
  "Mandarin(Paket)",
  "Mango",
  "Mantar",
  "Marul (Aysberk)",
  "Marul (Düz)",
  "Marul (Kıvırcık)",
  "Maydonoz",
  "Muz (Yerli)",
  "Muz İthal",
  "Nane",
  "Nar",
  "Pancar",
  "Patates",
  "Patates (Baby)",
  "Patates (Kumpirlik)",
  "Patlıcan",
  "Patlıcan (Topak)",
  "Pazı Bağ",
  "Pırasa",
  "Portakal (Sıkmalık)",
  "Portakal (Valencia Pak)",
  "Roka Bağ",
  "Sarımsak (Taze)",
  "Semizotu Bağ",
  "Soğan (Arpacık)",
  "Soğan (Kırmız)",
  "Soğan (Yeşil) Bağ",
  "Soğan Kuru",
  "Tere Bağ",
  "Tere Su",
  "Turp (Kırmızı)",
  "Turp(Fındık)",
  "Üzüm (Beyaz)",
  "Üzüm (Siyah)",
  "Zencefil",
] as const;

const PRODUCT_EMOJI: Record<string, string> = {
  Ahududu: "🍓",
  Altınçilek: "🫐",
  "Amme(Cennet Meyvesi)": "🥭",
  Ananas: "🍍",
  Armut: "🍐",
  Avokado: "🥑",
  Ayva: "🍐",
  Biber: "🌶️",
  "Biber Çarli": "🌶️",
  "Biber Kapya": "🫑",
  "Biber Sivri": "🌶️",
  "Biber Üçburun": "🫑",
  "Blue Berry": "🫐",
  Böğürtlen: "🫐",
  Brokoli: "🥦",
  Çilek: "🍓",
  Dereotu: "🌿",
  Domates: "🍅",
  "Domates (Ceri)": "🍅",
  "Domates (Pembe)": "🍅",
  "Domates Kokteyl": "🍅",
  "Elma (Golden)": "🍏",
  "Elma (Grann Smith)": "🍏",
  "Elma (Starking)": "🍎",
  Fasulye: "🫘",
  Fesleğen: "🌿",
  "Frenk Üzümü": "🫐",
  Greyfurt: "🍊",
  Havuç: "🥕",
  Hıyar: "🥒",
  "Hindistan Cevizi": "🥥",
  Ispanak: "🥬",
  "Kabak (Bal)": "🎃",
  "Kabak (Sakız)": "🥒",
  "Karadeniz Yaprağı": "🍃",
  Karnabahar: "🥦",
  "Kavun(Kırkağaç)": "🍈",
  Kereviz: "🥬",
  Kivi: "🥝",
  "Kuzu Kulağı": "🌿",
  "Lahana (Beyaz)": "🥬",
  "Lahana (Kırmızı)": "🥬",
  "Lime Limon": "🍋",
  Limon: "🍋",
  "Mandarin(Paket)": "🍊",
  Mango: "🥭",
  Mantar: "🍄",
  "Marul (Aysberk)": "🥬",
  "Marul (Düz)": "🥬",
  "Marul (Kıvırcık)": "🥬",
  Maydonoz: "🌿",
  "Muz (Yerli)": "🍌",
  "Muz İthal": "🍌",
  Nane: "🌿",
  Nar: "🔴",
  Pancar: "🫜",
  Patates: "🥔",
  "Patates (Baby)": "🥔",
  "Patates (Kumpirlik)": "🥔",
  Patlıcan: "🍆",
  "Patlıcan (Topak)": "🍆",
  "Pazı Bağ": "🥬",
  Pırasa: "🥬",
  "Portakal (Sıkmalık)": "🍊",
  "Portakal (Valencia Pak)": "🍊",
  "Roka Bağ": "🥬",
  "Sarımsak (Taze)": "🧄",
  "Semizotu Bağ": "🥬",
  "Soğan (Arpacık)": "🧅",
  "Soğan (Kırmız)": "🧅",
  "Soğan (Yeşil) Bağ": "🧅",
  "Soğan Kuru": "🧅",
  "Tere Bağ": "🥬",
  "Tere Su": "🥬",
  "Turp (Kırmızı)": "🍠",
  "Turp(Fındık)": "🍠",
  "Üzüm (Beyaz)": "🍇",
  "Üzüm (Siyah)": "🍇",
  Zencefil: "🫚",
};

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}
function textOrNull(v: string): string | null {
  const t = String(v ?? "").trim();
  return t ? t : null;
}
function numOrNull(v: string): number | null {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function isImage(m: string) {
  return m.startsWith("image/");
}
function isVideo(m: string) {
  return m.startsWith("video/");
}
function safeExt(name: string, mime: string) {
  const raw = name.split(".").pop()?.toLowerCase();
  if (raw && raw.length <= 8) return raw;
  if (isImage(mime)) return "jpg";
  if (isVideo(mime)) return "mp4";
  return "bin";
}

function Field({
  label,
  span2,
  children,
  hint,
}: {
  label: string;
  span2?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn(span2 && "md:col-span-2")}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">{label}</div>
        {hint ? <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-500">{hint}</div> : null}
      </div>
      {children}
    </label>
  );
}

function MediaTile({
  url,
  type,
  cover,
  dragHint,
  onMakeCover,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  url: string;
  type: MediaType;
  cover: boolean;
  dragHint: string;
  onMakeCover: () => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-900/40",
        cover ? "border-emerald-300/70 dark:border-emerald-500/40" : "border-black/10 dark:border-white/10"
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={dragHint}
    >
      <div className="absolute left-2 top-2 z-10 flex gap-2">
        {cover ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
            KAPAK
          </span>
        ) : (
          <button
            type="button"
            onClick={onMakeCover}
            className="rounded-full border border-black/10 bg-white/90 px-2 py-1 text-[11px] font-black text-zinc-900 hover:bg-white dark:border-white/10 dark:bg-black/45 dark:text-zinc-100 dark:hover:bg-black/55"
          >
            Kapak yap
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-black text-red-800 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/30"
      >
        Sil
      </button>

      <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[11px] font-black text-white opacity-90 backdrop-blur">
        ⇅ sürükle
      </div>

      {type === "video" ? (
        <video src={url} className="h-44 w-full bg-black object-cover" controls playsInline />
      ) : (
        <img src={url} alt="media" className="h-44 w-full object-cover" draggable={false} />
      )}

      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
    </div>
  );
}

export default function EditListingModelPremium({ open, initial, onClose, onSave, onMediaInstant }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // --- ✅ STATE: önce hepsi tanımlı olsun (city/district useMemo hatası biter) ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [marketName, setMarketName] = useState("");

  const [unit, setUnit] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [quantity, setQuantity] = useState("");

  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ✅ ilan türü: product / request
  const [postType, setPostType] = useState<"product" | "request">("product");

  const [expiresAt, setExpiresAt] = useState("");

  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);

  // locations.json
  const [locMap, setLocMap] = useState<LocationsMap>({});

  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    // locations
    fetch("/locations.json")
      .then((r) => r.json())
      .then((j) => setLocMap((j || {}) as LocationsMap))
      .catch((e) => console.error("locations.json error", e));
  }, []);

  const cities = useMemo(() => Object.keys(locMap).sort((a, b) => a.localeCompare(b, "tr")), [locMap]);

  const districts = useMemo(() => {
    if (!city) return [];
    return Object.keys(locMap[city] || {}).sort((a, b) => a.localeCompare(b, "tr"));
  }, [locMap, city]);

  const neighborhoods = useMemo(() => {
    if (!city || !district) return [];
    return locMap[city]?.[district] || [];
  }, [locMap, city, district]);

  // ✅ listing_media tablosundan çek
async function loadFromListingMediaTable(listingId: string) {
  const { data, error } = await supabase
    .from("listing_media")
    .select("url, media_type, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const urls = data.map(r => r.url);
  const types = data.map(r =>
    r.media_type === "video" ? "video" : "image"
  );

  setMediaUrls(urls);
  setMediaTypes(types);
}

  // ✅ listing_media tablosuna yaz (app ile ortak)
async function persistToListingMediaTable(
  listingId: string,
  urls: string[],
  types: MediaType[]
) {
  try {
    await supabase
      .from("listing_media")
      .delete()
      .eq("listing_id", listingId);

    const rows = urls.map((u, i) => ({
      listing_id: listingId,
      url: u,
      media_type: types[i] ?? "image",   // ✅ BURASI
      sort_order: i,
    }));

    if (rows.length) {
      const { error } = await supabase.from("listing_media").insert(rows);
      if (error) throw error;
    }
  } catch (e: any) {
    console.error("listing_media persist error:", e?.message ?? e);
    throw e;
  }
}

  // initial load
  useEffect(() => {
    if (!open || !initial) return;

    setErr(null);

    setTitle(initial.title ?? "");
    setDescription(initial.description ?? "");

    setProductName(initial.product_name ?? "");
    setProductType(initial.product_type ?? "");

    setCity(initial.city ?? "");
    setDistrict(initial.district ?? "");
    setNeighborhood(initial.neighborhood ?? "");
    setMarketName(initial.market_name ?? "");

    setUnit(initial.unit ?? "");
    setPricePerUnit(initial.price_per_unit == null ? "" : String(initial.price_per_unit));
    setMinQuantity(initial.min_quantity == null ? "" : String(initial.min_quantity));
    setQuantity(initial.quantity == null ? "" : String(initial.quantity));

    setPrice(initial.price == null ? "" : String(initial.price));
    setMinPrice(initial.min_price == null ? "" : String(initial.min_price));
    setMaxPrice(initial.max_price == null ? "" : String(initial.max_price));

    setPostType((initial.post_type === "request" ? "request" : "product") as any);
    setExpiresAt(initial.expires_at ?? "");

    // 1) listings array varsa onu al
    const urls = Array.isArray(initial.media_urls) ? initial.media_urls : [];
    const typesRaw = Array.isArray(initial.media_types) ? initial.media_types : [];
    const mapped = typesRaw.map((t: any) => (String(t) === "video" ? "video" : "image")) as MediaType[];

    const len = Math.min(urls.length, mapped.length);
    const finalUrls = urls.slice(0, len);
    const finalTypes = mapped.slice(0, len);

    setMediaUrls(finalUrls);
    setMediaTypes(finalTypes);

    // 2) array boşsa → listing_media tablosu
    if (initial?.id && finalUrls.length === 0) {
      loadFromListingMediaTable(initial.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const validation = useMemo(() => {
    if (!String(title ?? "").trim()) return "Başlık zorunlu.";
    if (mediaUrls.length !== mediaTypes.length) return "Medya listesi bozuk (url/type uyumsuz).";
    if (city && !district) return "İlçe seçmeyi unutma.";
    if (district && !neighborhood) return "Mahalle seçmeyi unutma.";
    return null;
  }, [title, mediaUrls.length, mediaTypes.length, city, district, neighborhood]);

  async function instantPersist(urls: string[], types: MediaType[]) {
    if (!initial?.id) return;
    onMediaInstant?.(initial.id, urls, types);
    try {
      await persistToListingMediaTable(initial.id, urls, types);
    } catch (e: any) {
      console.error("listing_media persist error:", e?.message ?? e);
      setErr(
        "Medya web’de görünüyor ama uygulamada görünmüyorsa genelde sebep RLS/izin. listing_media insert/delete yetkisini kontrol et."
      );
    }
  }

  async function uploadMany(files: FileList) {
    if (!initial) return;

    setErr(null);
    setUploading(true);

    try {
      const newUrls: string[] = [];
      const newTypes: MediaType[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mime = file.type || "";

        if (!isImage(mime) && !isVideo(mime)) {
          throw new Error("Sadece fotoğraf veya video yükleyebilirsin.");
        }

        const ext = safeExt(file.name, mime);
        const path = `${initial.seller_id}/listing_${initial.id}/${Date.now()}_${i}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("listing_media")
          .upload(path, file, { upsert: true, contentType: mime });

        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("listing_media").getPublicUrl(path);
        const publicUrl = pub?.publicUrl;

        newUrls.push(publicUrl || path);
        newTypes.push(isVideo(mime) ? "video" : "image");
      }

      const urls = [...mediaUrls, ...newUrls];
      const types = [...mediaTypes, ...newTypes];

      setMediaUrls(urls);
      setMediaTypes(types);

      await instantPersist(urls, types);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Yükleme hatası");
    } finally {
      setUploading(false);
    }
  }

  function removeMediaAt(idx: number) {
    const urls = mediaUrls.filter((_, i) => i !== idx);
    const types = mediaTypes.filter((_, i) => i !== idx);
    setMediaUrls(urls);
    setMediaTypes(types);
    instantPersist(urls, types);
  }

  function makeCover(idx: number) {
    if (idx <= 0) return;
    const urls = [...mediaUrls];
    const types = [...mediaTypes];

    const [u] = urls.splice(idx, 1);
    const [t] = types.splice(idx, 1);

    urls.unshift(u);
    types.unshift(t);

    setMediaUrls(urls);
    setMediaTypes(types);

    instantPersist(urls, types);
  }

  function onDragStart(i: number, e: React.DragEvent) {
    dragFrom.current = i;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(i: number, e: React.DragEvent) {
    e.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from == null || from === i) return;

    const urls = [...mediaUrls];
    const types = [...mediaTypes];

    const [u] = urls.splice(from, 1);
    const [t] = types.splice(from, 1);

    urls.splice(i, 0, u);
    types.splice(i, 0, t);

    setMediaUrls(urls);
    setMediaTypes(types);
    instantPersist(urls, types);
  }

  async function handleSave() {
    if (!initial) return;

    setErr(null);
    if (validation) {
      setErr(validation);
      return;
    }

    setSaving(true);
    try {
      const patch = {
        id: initial.id,
        title: String(title).trim(),
        description: textOrNull(description),

        product_name: textOrNull(productName),
        product_type: textOrNull(productType),

        city: textOrNull(city),
        district: textOrNull(district),
        neighborhood: textOrNull(neighborhood),
        market_name: textOrNull(marketName),

        unit: textOrNull(unit),
        price_per_unit: numOrNull(pricePerUnit),

        min_quantity: numOrNull(minQuantity),
        quantity: numOrNull(quantity),

        price: numOrNull(price),
        min_price: numOrNull(minPrice),
        max_price: numOrNull(maxPrice),

        post_type: postType, // ✅ product | request
        expires_at: textOrNull(expiresAt),

        // web liste için de yaz (ama app için asıl olan listing_media tablosu)
        media_urls: mediaUrls,
        media_types: mediaTypes,
      };

      await onSave(patch);
      onClose();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !initial) return null;

  const productEmoji = PRODUCT_EMOJI[productName] || "🍏";

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] dark:bg-black/75"
        onClick={() => !saving && !uploading && onClose()}
      />

      <div className="absolute left-1/2 top-1/2 w-[min(1100px,94vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
          {/* HEADER */}
          <div className="relative border-b border-black/5 px-6 py-5 dark:border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-indigo-400/10" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">İlan Düzenle</div>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                    Premium
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Medyayı sürükle-bırak sırala • Kapak seçince anında kaydedilir • Locations.json ile konum seç
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={saving || uploading}
                  onClick={onClose}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
                >
                  Kapat
                </button>
                <button
                  disabled={saving || uploading || !!validation}
                  onClick={handleSave}
                  className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-black text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="max-h-[78vh] overflow-auto px-6 py-6">
            {err ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                {err}
              </div>
            ) : null}

            {/* MEDIA */}
            <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/40">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-black text-zinc-600 dark:text-zinc-400">
                  Ürün Foto/Video Galerisi (Kapak = ilk medya)
                </div>
                <div className="flex items-center gap-2">
                  {loadingMedia ? (
                    <div className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                      Medya okunuyor...
                    </div>
                  ) : null}
                  <div className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                    {mediaUrls.length} medya
                  </div>
                </div>
              </div>

              {mediaUrls.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {mediaUrls.map((u, i) => (
                    <MediaTile
                      key={`${u}-${i}`}
                      url={u}
                      type={mediaTypes[i] ?? "image"}
                      cover={i === 0}
                      dragHint="Sürükle bırak ile sırala"
                      onMakeCover={() => makeCover(i)}
                      onRemove={() => removeMediaAt(i)}
                      onDragStart={(e) => onDragStart(i, e)}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(i, e)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 bg-black/5 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                  Henüz medya yok.
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  disabled={uploading}
                  className="text-sm text-zinc-900 dark:text-zinc-100"
                  onChange={(e) => {
                    const fl = e.target.files;
                    if (fl && fl.length) uploadMany(fl);
                    e.currentTarget.value = "";
                  }}
                />
                <div className="text-xs font-black text-zinc-500 dark:text-zinc-500">
                  {uploading ? "Yükleniyor..." : "Hazır"}
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="İlan türü" hint="Ürün / Talep">
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={postType}
                  onChange={(e) => setPostType(e.target.value === "request" ? "request" : "product")}
                >
                  <option value="product">🧺 Ürün ilanı</option>
                  <option value="request">📝 Talep ilanı</option>
                </select>
              </Field>

              <Field label="Son tarih (opsiyonel)" hint="YYYY-MM-DD veya ISO">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  placeholder="2026-02-01"
                />
              </Field>

              <Field label="Başlık" span2 hint="Zorunlu">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Valencia Portakal 1. sınıf"
                />
              </Field>

              <Field label="Açıklama" span2 hint="Detay yaz, güven verir">
                <textarea
                  className="min-h-[110px] w-full resize-y rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kalibre, paket, sevkiyat, ödeme vb."
                />
              </Field>

              <Field label="Ürün" hint={`${productEmoji} emoji`}>
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                >
                  <option value="">Ürün seç</option>
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>
                      {(PRODUCT_EMOJI[p] || "🍏") + " " + p}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ürün tipi / varyant" hint="Örn: Pak / Dökme / Kasa">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="Örn: Valencia Pak"
                />
              </Field>

              <Field label="Şehir" hint="locations.json">
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setDistrict("");
                    setNeighborhood("");
                  }}
                >
                  <option value="">Şehir seç</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="İlçe" hint="Şehir seçince aktif">
                <select
                  disabled={!city}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none",
                    !city
                      ? "border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                      : "border-black/10 bg-white text-zinc-900 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100"
                  )}
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setNeighborhood("");
                  }}
                >
                  <option value="">İlçe seç</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mahalle" hint="İlçe seçince aktif">
                <select
                  disabled={!district}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none",
                    !district
                      ? "border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                      : "border-black/10 bg-white text-zinc-900 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100"
                  )}
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                >
                  <option value="">Mahalle seç</option>
                  {neighborhoods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Hal / Pazar adı" hint="Opsiyonel">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={marketName}
                  onChange={(e) => setMarketName(e.target.value)}
                  placeholder="Örn: Demre Hal"
                />
              </Field>

              <Field label="Birim" hint="kg / kasa / adet">
                <input
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg"
                />
              </Field>

              <Field label="Birim fiyat" hint="Örn: 28.5">
                <input
                  type="number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </Field>

              <Field label="Min miktar" hint="Örn: 100">
                <input
                  type="number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                />
              </Field>

              <Field label="Toplam miktar" hint="Örn: 5000">
                <input
                  type="number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>

              <Field label="Toplam fiyat" hint="Opsiyonel">
                <input
                  type="number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>

              <Field label="Min fiyat" hint="Aralık kullanacaksan">
                <input
                  type="number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </Field>

              <Field label="Max fiyat" hint="Aralık kullanacaksan">
                <input
                  type="number"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-white/25"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </Field>
            </div>

            {validation ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                {validation}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}