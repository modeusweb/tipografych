import type { MetadataRoute } from "next";

/** robots.txt для поисковых систем + ссылка на sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: "https://tipografych.vercel.app/sitemap.xml",
  };
}