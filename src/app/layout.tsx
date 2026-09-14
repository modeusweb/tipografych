import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tipografych.vercel.app"),
  title: "Типографыч — типографика русского текста онлайн",
  description:
    "Типографыч приведёт русский текст к нормам типографики: кавычки-ёлочки, тире, неразрывные пробелы, многоточия, пунктуация и числа. Всё обрабатывается локально в браузере.",
  keywords: [
    "типографыч",
    "типограф",
    "типографика",
    "русский текст",
    "кавычки",
    "тире",
    "неразрывные пробелы",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://tipografych.vercel.app/",
    title: "Типографыч — типографика русского текста онлайн",
    description:
      "Типографыч: вставьте текст, нажмите «Типографировать» и получите аккуратную типографику — кавычки, тире, пробелы, многоточия. Без отправки на сервер.",
    siteName: "Типографыч",
    // Изображение подключается файлом src/app/opengraph-image.png (конвенция Next).
  },
  twitter: {
    card: "summary_large_image",
    title: "Типографыч — типографика русского текста онлайн",
    description:
      "Типографыч: вставьте текст, нажмите «Типографировать» и получите аккуратную типографику — кавычки, тире, пробелы, многоточия. Без отправки на сервер.",
    // Изображение подключается файлом src/app/twitter-image.png (конвенция Next).
  },
  robots: { index: true, follow: true },
  verification: {
    google: "w_s1YAdGDmNMm19tV4F6fl_4o15nDgnZGLM8ledX-f8",
    yandex: "d2c91541d905b87c",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

/**
 * Inline-скрипт выставляет класс тёмной темы до первого кадра,
 * чтобы не было мигания. suppressHydrationWarning на <html> —
 * класс может быть добавлен до гидрации.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("typograph.theme.v1")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var el=document.documentElement;el.classList.toggle("dark",d);el.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

const SITE_URL = "https://tipografych.vercel.app";

/** JSON-LD: разметка веб-приложения для поисковых систем. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Типографыч",
  url: `${SITE_URL}/`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  inLanguage: "ru-RU",
  description:
    "Онлайн-типограф для русского текста: кавычки-ёлочки, тире, неразрывные пробелы, многоточия, пунктуация и числа. Обработка выполняется локально в браузере.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
  browserRequirements: "Требуется современный браузер с поддержкой JavaScript.",
  isAccessibleForFree: true,
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}

