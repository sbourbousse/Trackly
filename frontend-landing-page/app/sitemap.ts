import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arrivo.pro";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = { lastModified: new Date(), changeFrequency: "monthly" as const };
  return [
    { url: SITE_URL, ...base, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/mentions-legales`, ...base, priority: 0.5 },
    { url: `${SITE_URL}/cgu`, ...base, priority: 0.5 },
    { url: `${SITE_URL}/confidentialite`, ...base, priority: 0.5 },
  ];
}
