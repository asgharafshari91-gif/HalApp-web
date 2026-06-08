import type { MetadataRoute } from "next";

const SITE_URL = "https://halapp.app";

const PRODUCT_SLUGS = [
  "elma",
  "armut",
  "portakal",
  "mandalina",
  "limon",
  "muz",
  "karpuz",
  "kavun",
  "uzum",
  "cilek",
  "kiraz",
  "seftali",
  "kayisi",
  "erik",
  "nar",
  "incir",
  "kivi",
  "ananas",
  "mango",
  "avokado",
  "domates",
  "biber",
  "patlican",
  "salatalik",
  "kabak",
  "patates",
  "sogan",
  "sarimsak",
  "havuc",
  "brokoli",
  "lahana",
  "marul",
  "ispanak",
  "enginar",
  "fasulye",
  "misir",
  "mantar",
  "kuskonmaz",
  "roka",
  "nane",
  "maydanoz",
  "ceviz",
  "badem",
  "findik",
  "antep-fistigi",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
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
      priority: 0.9,
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
      priority: 0.7,
    },
    ...PRODUCT_SLUGS.map((slug) => ({
      url: `${SITE_URL}/urun/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
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
}