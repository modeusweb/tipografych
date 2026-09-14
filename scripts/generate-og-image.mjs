/**
 * Генерация OG-изображения (1200×630) для соцсетей и мессенджеров.
 *
 * Использование: node scripts/generate-og-image.mjs
 *
 * Результат:
 *   src/app/opengraph-image.png — Open Graph (Facebook, VK, Telegram и др.)
 *   src/app/twitter-image.png   — Twitter/X card
 *
 * Дизайн собирается из SVG (текст + градиенты, шрифт системный),
 * логотип — растеризованный src/app/icon.svg, композитится sharp'ом.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const appDir = path.join(root, "src", "app");

const W = 1200;
const H = 630;

const iconSvg = readFileSync(path.join(appDir, "icon.svg"));

/** SVG-макет открытки. Текст в system-ui — libvips подставит системный шрифт с кириллицей. */
function buildSvg() {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0c0c11"/>
      <stop offset="1" stop-color="#17172a"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4f46e5"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.9">
      <stop offset="0" stop-color="#6d28d9" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#6d28d9" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- верхняя градиентная полоса -->
  <rect width="${W}" height="8" fill="url(#brand)"/>

  <!-- декоративные гигантские кавычки -->
  <text x="980" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="560"
        fill="#4f46e5" fill-opacity="0.14" font-weight="bold">«»</text>

  <!-- логотип -->
  <g transform="translate(84, 96)">
    <image href="icon.png" width="112" height="112"/>
  </g>

  <!-- заголовок -->
  <text x="84" y="330" font-family="'Segoe UI', 'DejaVu Sans', Arial, sans-serif"
        font-size="96" font-weight="700" fill="#ffffff" letter-spacing="-2">Типографыч</text>
  <text x="84" y="392" font-family="'Segoe UI', 'DejaVu Sans', Arial, sans-serif"
        font-size="34" fill="#a1a1aa">Типографика русского текста онлайн</text>

  <!-- пример: до → после -->
  <g font-family="'Segoe UI', 'DejaVu Sans', Arial, sans-serif" font-size="32">
    <rect x="84" y="440" width="1032" height="76" rx="16" fill="#ffffff" fill-opacity="0.05"/>
    <rect x="84" y="440" width="6" height="76" rx="3" fill="url(#brand)"/>
    <text x="124" y="488" fill="#71717a">Он сказал - "Привет"...</text>
    <text x="640" y="490" fill="#8b5cf6" font-size="36">&#8594;</text>
    <text x="700" y="488" fill="#ffffff">${esc("Он сказал — «Привет»…")}</text>
  </g>

  <!-- подвал -->
  <text x="84" y="572" font-family="'Segoe UI', 'DejaVu Sans', Arial, sans-serif"
        font-size="26" fill="#71717a">Работает в браузере · Без отправки на сервер</text>
  <text x="${W - 84}" y="572" text-anchor="end" font-family="'Segoe UI', 'DejaVu Sans', Arial, sans-serif"
        font-size="26" fill="#818cf8">tipografych.vercel.app</text>
</svg>`;
}

/** Растеризует SVG с внешней картинкой (icon.png) через composite. */
async function render() {
  const iconPng = await sharp(iconSvg, { density: 720 })
    .resize(112, 112)
    .png()
    .toBuffer();

  const base = sharp(Buffer.from(buildSvg().replace('href="icon.png"', 'href=""')), {
    density: 72, // 1:1 к viewBox 1200×630 ( densities выше дают апскейл-растр)
  }).composite([{ input: iconPng, left: 84, top: 96 }]);

  const og = await base.clone().png({ compressionLevel: 9 }).toBuffer();
  const twitter = await base.clone().png({ compressionLevel: 9 }).toBuffer();

  writeFileSync(path.join(appDir, "opengraph-image.png"), og);
  writeFileSync(path.join(appDir, "twitter-image.png"), twitter);
  console.log(`✓ src/app/opengraph-image.png (${og.length} bytes)`);
  console.log(`✓ src/app/twitter-image.png (${twitter.length} bytes)`);
}

await render();
