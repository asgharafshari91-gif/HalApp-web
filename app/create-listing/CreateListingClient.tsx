"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import locationsRaw from "@/public/locations.json";

type FormState = {
  product_name: string;
  title: string;
  description: string;
  city: string;
  district: string;
  neighborhood: string;
  product_type: string;
  quantity: string;
  min_quantity: string;
  unit: string;
  price: string;
  packaging_type: string;
  cold_chain: boolean;
  transport_included: boolean;
};

type UploadedMediaResult = {
  mediaUrls: string[];
  mediaTypes: string[];
};

type ProductItem = {
  name: string;
  emoji: string;
  type: "Meyve" | "Sebze" | "Yeşillik" | "Kuru Yemiş";
};

const PRODUCTS: ProductItem[] = [
  { name: "Elma", emoji: "🍎", type: "Meyve" },
  { name: "Armut", emoji: "🍐", type: "Meyve" },
  { name: "Portakal", emoji: "🍊", type: "Meyve" },
  { name: "Mandalina", emoji: "🍊", type: "Meyve" },
  { name: "Greyfurt", emoji: "🍊", type: "Meyve" },
  { name: "Limon", emoji: "🍋", type: "Meyve" },
  { name: "Muz", emoji: "🍌", type: "Meyve" },
  { name: "Karpuz", emoji: "🍉", type: "Meyve" },
  { name: "Kavun", emoji: "🍈", type: "Meyve" },
  { name: "Üzüm", emoji: "🍇", type: "Meyve" },
  { name: "Çilek", emoji: "🍓", type: "Meyve" },
  { name: "Ahududu", emoji: "🫐", type: "Meyve" },
  { name: "Böğürtlen", emoji: "🫐", type: "Meyve" },
  { name: "Blueberry", emoji: "🫐", type: "Meyve" },
  { name: "Yaban Mersini", emoji: "🫐", type: "Meyve" },
  { name: "Kiraz", emoji: "🍒", type: "Meyve" },
  { name: "Vişne", emoji: "🍒", type: "Meyve" },
  { name: "Şeftali", emoji: "🍑", type: "Meyve" },
  { name: "Kayısı", emoji: "🍑", type: "Meyve" },
  { name: "Nektarin", emoji: "🍑", type: "Meyve" },
  { name: "Erik", emoji: "🟣", type: "Meyve" },
  { name: "Nar", emoji: "🔴", type: "Meyve" },
  { name: "Ayva", emoji: "🍐", type: "Meyve" },
  { name: "İncir", emoji: "🟣", type: "Meyve" },
  { name: "Kivi", emoji: "🥝", type: "Meyve" },
  { name: "Ananas", emoji: "🍍", type: "Meyve" },
  { name: "Mango", emoji: "🥭", type: "Meyve" },
  { name: "Avokado", emoji: "🥑", type: "Meyve" },
  { name: "Hindistan Cevizi", emoji: "🥥", type: "Meyve" },
  { name: "Hurma", emoji: "🌴", type: "Meyve" },
  { name: "Dut", emoji: "🫐", type: "Meyve" },
  { name: "Altın Çilek", emoji: "🍓", type: "Meyve" },

  { name: "Domates", emoji: "🍅", type: "Sebze" },
  { name: "Biber", emoji: "🌶️", type: "Sebze" },
  { name: "Patlıcan", emoji: "🍆", type: "Sebze" },
  { name: "Salatalık", emoji: "🥒", type: "Sebze" },
  { name: "Hıyar", emoji: "🥒", type: "Sebze" },
  { name: "Kabak", emoji: "🎃", type: "Sebze" },
  { name: "Patates", emoji: "🥔", type: "Sebze" },
  { name: "Soğan", emoji: "🧅", type: "Sebze" },
  { name: "Sarımsak", emoji: "🧄", type: "Sebze" },
  { name: "Havuç", emoji: "🥕", type: "Sebze" },
  { name: "Turp", emoji: "🥕", type: "Sebze" },
  { name: "Pancar", emoji: "🥕", type: "Sebze" },
  { name: "Brokoli", emoji: "🥦", type: "Sebze" },
  { name: "Karnabahar", emoji: "🥦", type: "Sebze" },
  { name: "Lahana", emoji: "🥬", type: "Sebze" },
  { name: "Marul", emoji: "🥬", type: "Sebze" },
  { name: "Ispanak", emoji: "🥬", type: "Sebze" },
  { name: "Pazı", emoji: "🥬", type: "Sebze" },
  { name: "Kereviz", emoji: "🥬", type: "Sebze" },
  { name: "Pırasa", emoji: "🥬", type: "Sebze" },
  { name: "Enginar", emoji: "🌿", type: "Sebze" },
  { name: "Bamya", emoji: "🌿", type: "Sebze" },
  { name: "Fasulye", emoji: "🫛", type: "Sebze" },
  { name: "Bezelye", emoji: "🫛", type: "Sebze" },
  { name: "Bakla", emoji: "🫛", type: "Sebze" },
  { name: "Mısır", emoji: "🌽", type: "Sebze" },
  { name: "Mantar", emoji: "🍄", type: "Sebze" },
  { name: "Kuşkonmaz", emoji: "🌱", type: "Sebze" },

  { name: "Roka", emoji: "🌿", type: "Yeşillik" },
  { name: "Nane", emoji: "🌿", type: "Yeşillik" },
  { name: "Maydanoz", emoji: "🌿", type: "Yeşillik" },
  { name: "Dereotu", emoji: "🌿", type: "Yeşillik" },
  { name: "Fesleğen", emoji: "🌿", type: "Yeşillik" },
  { name: "Tere", emoji: "🌿", type: "Yeşillik" },

  { name: "Ceviz", emoji: "🥜", type: "Kuru Yemiş" },
  { name: "Badem", emoji: "🥜", type: "Kuru Yemiş" },
  { name: "Fındık", emoji: "🥜", type: "Kuru Yemiş" },
  { name: "Antep Fıstığı", emoji: "🥜", type: "Kuru Yemiş" },
];

const INITIAL_FORM: FormState = {
  product_name: "",
  title: "",
  description: "",
  city: "",
  district: "",
  neighborhood: "",
  product_type: "Meyve",
  quantity: "",
  min_quantity: "",
  unit: "kg",
  price: "",
  packaging_type: "",
  cold_chain: false,
  transport_included: false,
};

function normalize(value: unknown) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

function readName(x: any) {
  return String(x?.name ?? x?.il ?? x?.city ?? x?.title ?? x ?? "");
}

function getCitiesFromLocations(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw.map(readName).filter(Boolean);
  }

  if (raw && typeof raw === "object") {
    return Object.keys(raw);
  }

  return [];
}

function findCityNode(raw: any, city: string): any {
  if (!city) return null;

  if (Array.isArray(raw)) {
    return raw.find((x) => normalize(readName(x)) === normalize(city)) ?? null;
  }

  if (raw && typeof raw === "object") {
    return raw[city] ?? raw[Object.keys(raw).find((k) => normalize(k) === normalize(city)) || ""] ?? null;
  }

  return null;
}

function getDistrictsFromLocations(raw: any, city: string): string[] {
  const cityNode = findCityNode(raw, city);
  if (!cityNode) return [];

  const districts =
    cityNode?.districts ??
    cityNode?.ilceler ??
    cityNode?.counties ??
    cityNode?.children ??
    cityNode;

  if (Array.isArray(districts)) {
    return districts.map(readName).filter(Boolean);
  }

  if (districts && typeof districts === "object") {
    return Object.keys(districts);
  }

  return [];
}

function findDistrictNode(raw: any, city: string, district: string): any {
  const cityNode = findCityNode(raw, city);
  if (!cityNode || !district) return null;

  const districts =
    cityNode?.districts ??
    cityNode?.ilceler ??
    cityNode?.counties ??
    cityNode?.children ??
    cityNode;

  if (Array.isArray(districts)) {
    return districts.find((x) => normalize(readName(x)) === normalize(district)) ?? null;
  }

  if (districts && typeof districts === "object") {
    return (
      districts[district] ??
      districts[Object.keys(districts).find((k) => normalize(k) === normalize(district)) || ""] ??
      null
    );
  }

  return null;
}

function getNeighborhoodsFromLocations(raw: any, city: string, district: string): string[] {
  const districtNode = findDistrictNode(raw, city, district);
  if (!districtNode) return [];

  const neighborhoods =
    districtNode?.neighborhoods ??
    districtNode?.mahalleler ??
    districtNode?.mahalles ??
    districtNode?.children ??
    districtNode;

  if (Array.isArray(neighborhoods)) {
    return neighborhoods.map(readName).filter(Boolean);
  }

  if (neighborhoods && typeof neighborhoods === "object") {
    return Object.keys(neighborhoods);
  }

  return [];
}

function productEmoji(productName: string) {
  return PRODUCTS.find((p) => normalize(p.name) === normalize(productName))?.emoji || "🧺";
}

export default function CreateListingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [userId, setUserId] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const cities = useMemo(() => getCitiesFromLocations(locationsRaw), []);
  const districts = useMemo(
    () => getDistrictsFromLocations(locationsRaw, form.city),
    [form.city]
  );
  const neighborhoods = useMemo(
    () => getNeighborhoodsFromLocations(locationsRaw, form.city, form.district),
    [form.city, form.district]
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const product = searchParams.get("product");
    if (!product) return;

    const found = PRODUCTS.find((p) => normalize(p.name) === normalize(product));

    setForm((prev) => ({
      ...prev,
      product_name: found?.name || product,
      product_type: found?.type || "Meyve",
      title: `${found?.emoji || "🧺"} Taze ${found?.name || product} Satılık`,
    }));
  }, [searchParams]);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    setUserId(user.id);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function selectProduct(name: string) {
    const product = PRODUCTS.find((p) => p.name === name);

    setForm((prev) => ({
      ...prev,
      product_name: product?.name || "",
      product_type: product?.type || "Meyve",
      title: product ? `${product.emoji} Taze ${product.name} Satılık` : "",
    }));
  }

  function selectCity(city: string) {
    setForm((prev) => ({
      ...prev,
      city,
      district: "",
      neighborhood: "",
    }));
  }

  function selectDistrict(district: string) {
    setForm((prev) => ({
      ...prev,
      district,
      neighborhood: "",
    }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const incoming = Array.from(files).filter((file) => {
      return file.type.startsWith("image/") || file.type.startsWith("video/");
    });

    if (incoming.length === 0) return;

    setMediaFiles((prev) => [...prev, ...incoming]);
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));

    setCoverIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  const demandScore = useMemo(() => {
    let score = 60;
    const quantity = Number(form.quantity || 0);
    const price = Number(form.price || 0);

    if (quantity > 1000) score += 8;
    if (quantity > 5000) score += 8;
    if (price > 0) score += 5;
    if (form.cold_chain) score += 6;
    if (form.transport_included) score += 6;
    if (mediaFiles.length > 0) score += 5;

    return Math.min(score, 99);
  }, [form.quantity, form.price, form.cold_chain, form.transport_included, mediaFiles.length]);

  const listingScore = useMemo(() => {
    let score = 0;

    if (form.product_name.trim()) score += 15;
    if (form.title.trim()) score += 15;
    if (form.description.trim().length > 100) score += 20;
    if (mediaFiles.length > 0) score += 20;
    if (mediaFiles.some((file) => file.type.startsWith("video/"))) score += 10;
    if (form.city.trim()) score += 10;
    if (form.price.trim()) score += 10;

    return Math.min(score, 100);
  }, [form, mediaFiles]);

  const priceAnalysis = useMemo(() => {
    const price = Number(form.price || 0);

    if (!price) return { label: "Fiyat giriniz", color: "text-zinc-500" };
    if (price < 50) return { label: "Piyasa ortalamasının altında", color: "text-orange-500" };
    if (price < 150) return { label: "Piyasa ile uyumlu", color: "text-emerald-600" };

    return { label: "Piyasa ortalamasının üzerinde", color: "text-red-500" };
  }, [form.price]);

  const premiumPackages = [
    {
      code: "boost_24h",
      title: "⭐ Boost 24 Saat",
      price: "₺499",
      desc: "24 saat boyunca üst sıralarda görün.",
    },
    {
      code: "boost_3d",
      title: "🚀 Boost 3 Gün",
      price: "₺999",
      desc: "3 gün boyunca ekstra görünürlük.",
    },
    {
      code: "featured_7d",
      title: "👑 Vitrin 7 Gün",
      price: "₺2.999",
      desc: "Ana sayfa vitrin alanında gösterim.",
    },
  ];

  function generateAITitle() {
    const product = form.product_name || "Ürün";
    update("title", `${productEmoji(product)} İhracat Kalitesinde ${product} Satılık`);
  }

  function generateAIDescription() {
    const product = form.product_name || "ürün";
    const city = form.city || "Türkiye";

    update(
      "description",
      `${city} bölgesinde bulunan yüksek kaliteli ${product}. Düzenli sevkiyat yapılabilir. İhracata ve iç piyasaya uygundur. Talebe göre özel paketleme yapılabilir. Soğuk zincir ve lojistik desteği sunulabilir.`
    );
  }

  async function uploadMediaFiles(): Promise<UploadedMediaResult> {
    if (mediaFiles.length === 0) return { mediaUrls: [], mediaTypes: [] };

    setUploadingMedia(true);

    try {
      const coverFile = mediaFiles[coverIndex] ?? mediaFiles[0];
      const orderedFiles = [
        coverFile,
        ...mediaFiles.filter((_, index) => index !== coverIndex),
      ];

      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];

      for (const file of orderedFiles) {
        const ext = file.name.split(".").pop() || "jpg";
        const randomId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        const fileName = `${Date.now()}-${randomId}.${ext}`;
        const filePath = `listings/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("listing_media")
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("listing_media").getPublicUrl(filePath);

        mediaUrls.push(data.publicUrl);
        mediaTypes.push(file.type.startsWith("video/") ? "video" : "image");
      }

      return { mediaUrls, mediaTypes };
    } finally {
      setUploadingMedia(false);
    }
  }

  async function publishListing() {
    try {
      setLoading(true);

      if (!userId) {
        alert("Oturum bulunamadı");
        return;
      }

      if (!form.product_name.trim()) {
        alert("Ürün adı zorunlu");
        return;
      }

      if (!form.title.trim()) {
        alert("Başlık zorunlu");
        return;
      }

      if (!form.city.trim()) {
        alert("Şehir zorunlu");
        return;
      }

      const uploaded = await uploadMediaFiles();

      const { data: listing, error } = await supabase
        .from("listings")
        .insert({
          seller_id: userId,
          title: form.title.trim(),
          description: form.description.trim(),
          product_type: form.product_type.trim(),
          city: form.city.trim(),
          district: form.district.trim(),
          neighborhood: form.neighborhood.trim(),
          product_name: form.product_name.trim(),
          quantity: form.quantity ? Number(form.quantity) : null,
          min_quantity: form.min_quantity ? Number(form.min_quantity) : null,
          unit: form.unit.trim(),
          price: form.price ? Number(form.price) : null,
          packaging_type: form.packaging_type.trim(),
          cold_chain: form.cold_chain,
          transport_included: form.transport_included,
          media_urls: uploaded.mediaUrls,
          media_types: uploaded.mediaTypes,
          is_active: true,
          status: "active",
          listing_source: "web",
          seller_type: "individual",
          published_at: new Date().toISOString(),
          view_count: 0,
          call_count: 0,
          message_count: 0,
          is_boosted: false,
          is_featured: false,
          showcase_plus: false,
        })
        .select("id")
        .single();

      if (error) throw error;

      const listingId = String(listing.id);

      if (uploaded.mediaUrls.length > 0) {
        const mediaRows = uploaded.mediaUrls.map((url, index) => ({
          listing_id: listingId,
          url,
          media_type: uploaded.mediaTypes[index],
          type: uploaded.mediaTypes[index],
          sort_order: index,
        }));

        const { error: mediaError } = await supabase.from("listing_media").insert(mediaRows);
        if (mediaError) console.warn("listing_media insert error:", mediaError);
      }

      const goPremium = window.confirm(
        "🚀 İlan başarıyla yayınlandı.\n\nŞimdi vitrine çıkarmak ister misin?"
      );

      if (goPremium) {
        router.push(`/payment?product_code=featured_7d&listing_id=${listingId}`);
        return;
      }

      router.push(`/listing/${listingId}`);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "İlan oluşturulamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="relative overflow-hidden rounded-[40px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-white to-green-500/10 p-8 dark:from-emerald-500/10 dark:via-zinc-950 dark:to-green-950/20">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
              HALAPP MARKET INTELLIGENCE
            </div>

            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              Akıllı İlan Oluştur
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-white/60">
              Ürününü listeden seç, adresi JSON verisinden doldur, ilanını yayınla ve vitrine çıkar.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <HeroStat label="TALEP SKORU" value={String(demandScore)} />
              <HeroStat label="KALİTE" value={`${listingScore}/100`} />
              <HeroStat label="TREND" value="Yükselişte" green />
              <HeroStat label="GÖRÜNÜRLÜK" value="Premium" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <section className="rounded-[32px] border bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <SectionHead eyebrow="ÜRÜN" title="Ürün Bilgileri" />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <SelectBox
                  value={form.product_name}
                  onChange={selectProduct}
                  placeholder="Ürün seç"
                  options={PRODUCTS.map((p) => ({
                    label: `${p.emoji} ${p.name}`,
                    value: p.name,
                  }))}
                />

                <Input
                  value={form.product_type}
                  onChange={(value) => update("product_type", value)}
                  placeholder="Ürün Tipi"
                />

                <SelectBox
                  value={form.city}
                  onChange={selectCity}
                  placeholder="İl seç"
                  options={cities.map((city) => ({ label: city, value: city }))}
                />

                <SelectBox
                  value={form.district}
                  onChange={selectDistrict}
                  placeholder="İlçe seç"
                  disabled={!form.city}
                  options={districts.map((district) => ({
                    label: district,
                    value: district,
                  }))}
                />

                <SelectBox
                  value={form.neighborhood}
                  onChange={(value) => update("neighborhood", value)}
                  placeholder="Mahalle seç"
                  disabled={!form.district}
                  className="md:col-span-2"
                  options={neighborhoods.map((neighborhood) => ({
                    label: neighborhood,
                    value: neighborhood,
                  }))}
                />
              </div>
            </section>

            <section className="rounded-[32px] border bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <SectionHead eyebrow="TİCARET" title="Ticari Bilgiler" />

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <Input type="number" value={form.quantity} onChange={(v) => update("quantity", v)} placeholder="Toplam Miktar" />
                <Input type="number" value={form.min_quantity} onChange={(v) => update("min_quantity", v)} placeholder="Minimum Sipariş" />
                <Input value={form.unit} onChange={(v) => update("unit", v)} placeholder="kg / ton / kasa" />
                <Input type="number" value={form.price} onChange={(v) => update("price", v)} placeholder="Fiyat" />
                <Input value={form.packaging_type} onChange={(v) => update("packaging_type", v)} placeholder="Paketleme Şekli" className="md:col-span-2" />
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  FİYAT ANALİZİ
                </div>
                <div className={`mt-2 text-lg font-black ${priceAnalysis.color}`}>
                  {priceAnalysis.label}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-4">
                <SectionHead eyebrow="MEDYA" title="Fotoğraf & Video" />
                <div className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-600">
                  {mediaFiles.length} Dosya
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-zinc-500">
                Kapak seçtiğin medya ilanın ana görseli olur.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`mt-8 rounded-[30px] border-2 border-dashed p-10 text-center transition ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-zinc-300 dark:border-white/15"
                }`}
              >
                <div className="text-6xl">📸</div>
                <h3 className="mt-4 text-2xl font-black">Dosyaları buraya sürükle</h3>
                <p className="mt-2 text-sm font-semibold text-zinc-500">JPG, PNG, WEBP, MP4</p>

                <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-emerald-500 px-6 py-3 font-black text-white">
                  Dosya Seç
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
              </div>

              {mediaFiles.length > 0 && (
                <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {mediaFiles.map((file, index) => {
                    const url = URL.createObjectURL(file);
                    const isVideo = file.type.startsWith("video/");
                    const isCover = coverIndex === index;

                    return (
                      <div
                        key={`${file.name}-${index}`}
                        className={`overflow-hidden rounded-[28px] border transition ${
                          isCover
                            ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "border-zinc-200 dark:border-white/10"
                        }`}
                      >
                        <div className="relative h-56 bg-zinc-100 dark:bg-zinc-900">
                          {isVideo ? (
                            <video src={url} controls className="h-full w-full object-cover" />
                          ) : (
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          )}

                          {isCover && (
                            <div className="absolute left-3 top-3 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white">
                              👑 Kapak
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="truncate font-black">{file.name}</div>
                          <div className="mt-1 text-xs font-semibold text-zinc-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => setCoverIndex(index)} className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-black text-white">
                              Kapak Yap
                            </button>
                            <button type="button" onClick={() => removeMedia(index)} className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white">
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[32px] border bg-gradient-to-br from-emerald-500/10 via-white to-green-500/10 p-8 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-green-950/20">
              <SectionHead eyebrow="HALAPP AI" title="Yapay Zeka Yardımcısı" />

              <p className="mt-3 text-sm font-semibold text-zinc-500">
                Başlık ve açıklamayı tek tıkla profesyonel hale getir.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={generateAITitle} className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white">
                  ✨ AI Başlık Oluştur
                </button>

                <button type="button" onClick={generateAIDescription} className="rounded-2xl border border-emerald-500 px-5 py-3 font-black text-emerald-600">
                  🤖 AI Açıklama Oluştur
                </button>
              </div>
            </section>

            <section className="rounded-[32px] border bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <SectionHead eyebrow="DETAY" title="Ürün Açıklaması" />

              <textarea
                rows={10}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ürün detayları, kalite bilgileri, ihracat durumu, hasat tarihi, sevkiyat bilgileri..."
                className="mt-6 w-full rounded-[24px] border p-5 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.04]"
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <CheckCard checked={form.cold_chain} onChange={(v) => update("cold_chain", v)} title="❄️ Soğuk Zincir" desc="Ürün kontrollü sıcaklıkta taşınır" />
                <CheckCard checked={form.transport_included} onChange={(v) => update("transport_included", v)} title="🚚 Nakliye Dahil" desc="Teslimat fiyatın içerisindedir" />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="sticky top-6 overflow-hidden rounded-[36px] border bg-white shadow-xl dark:border-white/10 dark:bg-zinc-950">
              <div className="h-52 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {mediaFiles.length > 0 ? (
                  mediaFiles[coverIndex]?.type.startsWith("video/") ? (
                    <video src={URL.createObjectURL(mediaFiles[coverIndex])} className="h-full w-full object-cover" />
                  ) : (
                    <img src={URL.createObjectURL(mediaFiles[coverIndex])} className="h-full w-full object-cover" alt="" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">📦</div>
                )}
              </div>

              <div className="p-6">
                <div className="text-xs font-black tracking-[0.2em] text-emerald-600">
                  CANLI ÖNİZLEME
                </div>

                <h3 className="mt-3 text-2xl font-black">
                  {form.title || "İlan Başlığı"}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black dark:bg-zinc-800">
                    {productEmoji(form.product_name)} {form.product_name || "Ürün"}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black dark:bg-zinc-800">
                    📍 {form.city || "Şehir"} {form.district ? `/ ${form.district}` : ""}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black dark:bg-zinc-800">
                    📦 {form.quantity || "0"} {form.unit}
                  </span>
                </div>

                <div className="mt-5 text-4xl font-black text-emerald-600">
                  {form.price ? `${form.price} ₺` : "--"}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {form.cold_chain && (
                    <span className="rounded-full bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-600">
                      ❄️ Soğuk Zincir
                    </span>
                  )}
                  {form.transport_included && (
                    <span className="rounded-full bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-600">
                      🚚 Nakliye Dahil
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6">
              <SectionHead eyebrow="MARKET INTELLIGENCE" title="Talep Analizi" />
              <div className="mt-5 space-y-4">
                <InfoCard label="TALEP SKORU" value={String(demandScore)} big />
                <InfoCard label="KALİTE SKORU" value={`${listingScore}/100`} big />
                <InfoCard label="FİYAT ANALİZİ" value={priceAnalysis.label} valueClass={priceAnalysis.color} />
                <InfoCard label="EN GÜÇLÜ PAZAR" value="İstanbul" />
              </div>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6">
              <SectionHead eyebrow="GELİR MOTORU" title="İlanını Öne Çıkar" />

              <p className="mt-3 text-sm font-semibold text-zinc-600 dark:text-white/60">
                Premium paketlerle daha fazla görüntülenme, daha fazla mesaj ve daha fazla satış.
              </p>

              <div className="mt-6 space-y-4">
                {premiumPackages.map((pkg) => (
                  <div key={pkg.code} className="rounded-2xl border bg-white/80 p-4 dark:bg-black/20">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-black">{pkg.title}</div>
                        <div className="mt-1 text-sm font-semibold text-zinc-500">{pkg.desc}</div>
                      </div>
                      <div className="text-xl font-black text-emerald-600">{pkg.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6">
              <SectionHead eyebrow="YAYINA HAZIR" title="Son Kontrol" />

              <div className="mt-5 space-y-3 text-sm">
                <ReadyRow label="Ürün Adı" ok={!!form.product_name.trim()} />
                <ReadyRow label="Başlık" ok={!!form.title.trim()} />
                <ReadyRow label="Şehir" ok={!!form.city.trim()} />
                <ReadyRow label="İlçe" ok={!!form.district.trim()} warn />
                <ReadyRow label="Medya" ok={mediaFiles.length > 0} warn />
              </div>

              <button
                type="button"
                disabled={loading || uploadingMedia}
                onClick={publishListing}
                className="mt-6 w-full rounded-[24px] bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-5 text-lg font-black text-white shadow-xl transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading || uploadingMedia ? "⏳ İlan Yayınlanıyor..." : "🚀 İlanı Yayınla"}
              </button>

              <p className="mt-4 text-center text-xs font-semibold text-zinc-500">
                Yayınlandıktan sonra ilanını premium paketlerle öne çıkarabilirsin.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function HeroStat({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/70 p-5 backdrop-blur-xl dark:bg-white/5">
      <div className="text-xs font-black text-zinc-500">{label}</div>
      <div className={`mt-2 text-2xl font-black ${green ? "text-emerald-600" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs font-black tracking-[0.25em] text-emerald-600">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-black">{title}</h2>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-2xl border p-4 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.04] ${className}`}
    />
  );
}

function SelectBox({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-2xl border p-4 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((x) => (
        <option key={x.value} value={x.value}>
          {x.label}
        </option>
      ))}
    </select>
  );
}

function CheckCard({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border p-4 dark:border-white/10">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div>
        <div className="font-black">{title}</div>
        <div className="text-xs font-semibold text-zinc-500">{desc}</div>
      </div>
    </label>
  );
}

function InfoCard({
  label,
  value,
  big = false,
  valueClass = "",
}: {
  label: string;
  value: string;
  big?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 dark:bg-black/20">
      <div className="text-xs font-black text-zinc-500">{label}</div>
      <div className={`mt-2 font-black ${big ? "text-5xl text-emerald-600" : `text-xl ${valueClass}`}`}>
        {value}
      </div>
    </div>
  );
}

function ReadyRow({ label, ok, warn = false }: { label: string; ok: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/70 p-3 dark:bg-black/20">
      <span>{label}</span>
      <span className="font-black">{ok ? "✅" : warn ? "⚠️" : "❌"}</span>
    </div>
  );
}