// Draws a share card in the browser: the same SVG the build uses, painted onto
// a canvas and turned into a PNG people can save or share.
import { cardSvg } from '../../../shared/card.js';
import { formats } from '../../../shared/formats/index.js';

const FONTS = [
  ['Rubik', 400, 'Rubik-400.ttf'],
  ['Rubik', 500, 'Rubik-500.ttf'],
  ['Rubik', 700, 'Rubik-700.ttf'],
  ['Rubik', 800, 'Rubik-800.ttf'],
  ['Archivo Black', 400, 'ArchivoBlack-Regular.ttf'],
];

const toBase64 = (buf) => {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

// An SVG drawn as an image can't see the page's fonts, so they go inside it.
let fontCss;
async function fontRules() {
  fontCss ??= Promise.all(
    FONTS.map(async ([family, weight, file]) => {
      const buf = await fetch(`/fonts/${file}`).then((r) => r.arrayBuffer());
      return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/ttf;base64,${toBase64(buf)}) format('truetype');}`;
    }),
  ).then((rules) => rules.join(''));
  return fontCss;
}

// Pictures go inside the SVG too, as small square JPEGs.
async function thumb(src, size) {
  try {
    const blob = await fetch(src).then((r) => (r.ok ? r.blob() : Promise.reject()));
    const bmp = await createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const s = Math.min(bmp.width, bmp.height);
    c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.8);
  } catch {
    return null; // no picture is better than no card
  }
}

export async function renderCard({ game, result, stats, url }) {
  const card = formats[game.type].card(game, result, stats);
  if (card.image) card.image = await thumb(card.image, 320);
  if (Array.isArray(card.rows)) {
    card.rows = await Promise.all(card.rows.map(async (row) => (row && typeof row === 'object' && row.image ? { ...row, image: await thumb(row.image, 120) } : row)));
  }
  const svg = cardSvg({ game, card, url, fontCss: await fontRules() });
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  canvas.getContext('2d').drawImage(img, 0, 0);
  const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return URL.createObjectURL(png);
}
