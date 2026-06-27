import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

const SITE_URL = "https://halapp.app";

const PRODUCT_SLUGS = [
  "elma",
  "elma-golden",
  "elma-granny-smith",
  "elma-starking",
  "armut",
  "ayva",
  "portakal",
  "portakal-sikmalik",
  "portakal-valencia-pak",
  "mandalina",
  "mandarin",
  "mandarin-paket",
  "greyfurt",
  "limon",
  "lime-limon",
  "muz",
  "muz-yerli",
  "muz-ithal",
  "karpuz",
  "kavun",
  "kavun-kirkagac",
  "uzum",
  "uzum-beyaz",
  "uzum-siyah",
  "cilek",
  "altin-cilek",
  "ahududu",
  "bogurtlen",
  "blueberry",
  "yaban-mersini",
  "dut",
  "kiraz",
  "visne",
  "seftali",
  "kayisi",
  "nektarin",
  "erik",
  "nar",
  "incir",
  "kivi",
  "ananas",
  "mango",
  "avokado",
  "hindistan-cevizi",
  "hurma",
  "amme-cennet-meyvesi",

  "domates",
  "domates-ceri",
  "domates-pembe",
  "domates-kokteyl",
  "biber",
  "biber-carli",
  "biber-kapya",
  "biber-sivri",
  "biber-ucburun",
  "patlican",
  "patlican-topak",
  "salatalik",
  "hiyar",
  "kabak",
  "kabak-bal",
  "kabak-sakiz",
  "patates",
  "patates-baby",
  "patates-kumpirlik",
  "sogan",
  "sogan-kuru",
  "sogan-arpacik",
  "sogan-kirmizi",
  "sogan-yesil-bag",
  "sarimsak",
  "sarimsak-taze",
  "havuc",
  "turp",
  "turp-kirmizi",
  "turp-findik",
  "pancar",
  "brokoli",
  "karnabahar",
  "lahana",
  "lahana-beyaz",
  "lahana-kirmizi",
  "marul",
  "marul-aysberk",
  "marul-duz",
  "marul-kivircik",
  "ispanak",
  "pazi",
  "pazi-bag",
  "kereviz",
  "pirasa",
  "karadeniz-yapragi",
  "kuzu-kulagi",
  "semizotu",
  "semizotu-bag",
  "enginar",
  "bamya",
  "fasulye",
  "bezelye",
  "bakla",
  "misir",
  "mantar",
  "kuskonmaz",

  "roka",
  "roka-bag",
  "nane",
  "maydanoz",
  "maydonoz",
  "dereotu",
  "feslegen",
  "tere",
  "tere-bag",
  "tere-su",

  "ceviz",
  "badem",
  "findik",
  "antep-fistigi",
  "zencefil",
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

type SeoArticleRow = {
  slug: string;
  updated_at: string | null;
  created_at: string | null;
};

function safeDate(...values: Array<string | Date | null | undefined>) {
  for (const value of values) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return new Date();
}

async function getListingUrls(): Promise<MetadataRoute.Sitemap> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, updated_at, published_at, created_at")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(3000);

  if (error) {
    console.error("sitemap listings error:", error.message);
    return [];
  }

  const rows = Array.isArray(data)
    ? (data as unknown as ListingSitemapRow[])
    : [];

  return rows.map((item) => ({
    url: `${SITE_URL}/pazar/${item.id}`,
    lastModified: safeDate(item.updated_at, item.published_at, item.created_at),
    changeFrequency: "daily" as const,
    priority: 0.72,
  }));
}

async function getBlogUrls(): Promise<MetadataRoute.Sitemap> {
  const { data, error } = await supabase
    .from("seo_articles")
    .select("slug, updated_at, created_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(3000);

  if (error) {
    console.error("sitemap seo_articles error:", error.message);
    return [];
  }

  const rows = Array.isArray(data) ? (data as unknown as SeoArticleRow[]) : [];

  return rows
    .filter((item) => item.slug)
    .map((item) => ({
      url: `${SITE_URL}/blog/${item.slug}`,
      lastModified: safeDate(item.updated_at, item.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.74,
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
      url: `${SITE_URL}/pazar`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.96,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.82,
    },
    {
      url: `${SITE_URL}/market-intelligence`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/signals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.82,
    },
    {
      url: `${SITE_URL}/premium`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/academy`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.55,
    },
    {
      url: `${SITE_URL}/meyve-sebze-ilanlari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.86,
    },
    {
      url: `${SITE_URL}/hal-fiyatlari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.86,
    },
    {
      url: `${SITE_URL}/ureticiden-satilik`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.82,
    },
    {
      url: `${SITE_URL}/ihracatlik-meyve-sebze`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.82,
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
    priority: 0.82,
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
        priority: 0.64,
      }))
  );

  const [listingPages, blogPages] = await Promise.all([
    getListingUrls(),
    getBlogUrls(),
  ]);

  return [
    ...staticPages,
    ...productPages,
    ...cityPages,
    ...productCityPages,
    ...blogPages,
    ...listingPages,
  ];
}