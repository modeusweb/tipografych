import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
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
  openGraph: {
    type: "website",
    locale: "ru_RU",
    title: "Типографыч — типографика русского текста онлайн",
    description:
      "Типографыч: вставьте текст, нажмите «Типографировать» и получите аккуратную типографику — кавычки, тире, пробелы, многоточия. Без отправки на сервер.",
    siteName: "Типографыч",
  },
  robots: { index: true, follow: true },
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
        {children}
      </body>
    </html>
  );
}

