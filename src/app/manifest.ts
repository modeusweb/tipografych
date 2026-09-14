import type { MetadataRoute } from "next";

/** Манифест PWA: /manifest.webmanifest (генерируется Next по конвенции). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Типографыч — типографика русского текста онлайн",
    short_name: "Типографыч",
    description:
      "Типографыч приведёт русский текст к нормам типографики: кавычки-ёлочки, тире, неразрывные пробелы, многоточия, пунктуация и числа. Всё обрабатывается локально в браузере.",
    lang: "ru",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
