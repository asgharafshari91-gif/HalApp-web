import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

const SITE_URL = "https://halapp.app";

const PRODUCT_SLUGS = [
  "elma",
  "armut",
  "portakal",
  "mandalina",
  "greyfurt",
  "limon",
  "muz",
  "karpuz",
  "kavun",
  "uzum",
  "cilek",
  "ahududu",
  "bogurtlen",
  "blueberry",
  "yaban-mersini",
  "kiraz",
  "visne",
  "seftali",
  "kayisi",
  "nektarin",
  "erik",
  "nar",
  "ayva",
  "incir",
  "kivi",
  "ananas",
  "mango",
  "avokado",
  "hindistan-cevizi",
  "hurma",
  "dut",
  "altin-cilek",

  "domates",
  "biber",
  "patlican",
  "salatalik",
  "hiyar",
  "kabak",
  "patates",
  "sogan",
  "sarimsak",
  "havuc",
  "turp",
  "pancar",
  "brokoli",
  "karnabahar",
  "lahana",
  "marul",
  "ispanak",
  "pazi",
  "kereviz",
  "pirasa",
  "enginar",
  "bamya",
  "fasulye",
  "bezelye",
  "bakla",
  "misir",
  "mantar",
  "kuskonmaz",

  "roka",
  "nane",
  "maydanoz",
  "dereotu",
  "feslegen",
  "tere",

  "ceviz",
  "badem",
  "findik",
  "antep-fistigi",
];

const CITY_SLUGS = [
  "adana",
  "adiyaman",
  "afyonkarahisar",
  "agri",
  "amasya",
  "ankara",
  "antalya",
  "artvin",
  "aydin",
  "balikesir",
  "bilecik",
  "bingol",
  "bitlis",
  "bolu",
  "burdur",
  "bursa",
  "canakkale",
  "cankiri",
  "corum",
  "denizli",
  "diyarbakir",
  "edirne",
  "elazig",
  "erzincan",
  "erzurum",
  "eskisehir",
  "gaziantep",
  "giresun",
  "gumushane",
  "hakkari",
  "hatay",
  "isparta",
  "mersin",
  "istanbul",
  "izmir",
  "kars",
  "kastamonu",
  "kayseri",
  "kirklareli",
  "kirsehir",
  "kocaeli",
  "konya",
  "kutahya",
  "malatya",
  "manisa",
  "kahramanmaras",
  "mardin",
  "mugla",
  "mus",
  "nevsehir",
  "nigde",
  "ordu",
  "rize",
  "sakarya",
  "samsun",
  "siirt",
  "sinop",
  "sivas",
  "tekirdag",
  "tokat",
  "trabzon",
  "tunceli",
  "sanliurfa",
  "usak",
  "van",
  "yozgat",
  "zonguldak",
  "aksaray",
  "bayburt",
  "karaman",
  "kirikkale",
  "batman",
  "sirnak",
  "bartin",
  "ardahan",
  "igdir",
  "yalova",
  "karabuk",
  "kilis",
  "osmaniye",
  "duzce",
];

type ListingSitemapRow = {
  id: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
};

async function getListingUrls(): Promise<MetadataRoute.Sitemap> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, updated_at, published_at, created_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(1000);

  if (error) {
    console.error("sitemap listings error:", error.message);
    return [];
  }

  const rows = Array.isArray(data)
    ? (data as unknown as ListingSitemapRow[])
    : [];

  return rows.map((item) => ({
    url: `${SITE_URL}/listing/${item.id}`,
    lastModified:
      item.updated_at ||
      item.published_at ||
      item.created_at ||
      new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/listings`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/signals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/premium`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/meyve-sebze-ilanlari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/hal-fiyatlari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/ureticiden-satilik`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/ihracatlik-meyve-sebze`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const productPages: MetadataRoute.Sitemap = PRODUCT_SLUGS.map((slug) => ({
    url: `${SITE_URL}/urun/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map((city) => ({
    url: `${SITE_URL}/sehir/${city}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.78,
  }));

  const productCityPages: MetadataRoute.Sitemap = PRODUCT_SLUGS.flatMap(
    (product) =>
      CITY_SLUGS.map((city) => ({
        url: `${SITE_URL}/urun/${product}/${city}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.65,
      }))
  );

  const listingPages = await getListingUrls();

  return [
    ...staticPages,
    ...productPages,
    ...cityPages,
    ...productCityPages,
    ...listingPages,
  ];
}