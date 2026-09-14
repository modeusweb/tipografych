import type { MetadataRoute } from "next";

const SITE_URL = "https://tipografych.vercel.app";

/** Сайтмап для поисковых систем: /sitemap.xml (с изображением). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      images: [`${SITE_URL}/opengraph-image.png`],
    },
  ];
}