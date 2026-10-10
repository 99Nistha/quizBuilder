// Draws the 1200x630 share image as SVG, then rasterises it with resvg.
// Plain text layout, so no headless browser needed.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORMATS, SITE_NAME } from '../shared/meta.js';

const fontDir = fileURLToPath(new URL('./fonts', import.meta.url));
const fontFiles = fs.readdirSync(fontDir).filter((f) => f.endsWith('.ttf')).map((f) => path.join(fontDir, f));

const W = 1200;
const H = 630;
const INK = '#161616';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// The card fonts have no emoji, so drop them rather than draw empty boxes.
const clean = (s) => String(s ?? '').replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();

// Rough width guess for Rubik. Good enough to decide where to cut.
const widthOf = (s, size) => [...s].reduce((w, ch) => w + (/[A-Z0-9MW]/.test(ch) ? 0.66 : /[il.,'| ]/.test(ch) ? 0.3 : 0.54), 0) * size;

function fit(s, size, maxW) {
  s = clean(s);
  if (widthOf(s, size) <= maxW) return s;
  while (s.length > 1 && widthOf(s + '…', size) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

function wrap(s, size, maxW, maxLines) {
  const words = clean(s).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (widthOf(next, size) > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fit(kept[maxLines - 1] + ' ' + lines.slice(maxLines).join(' '), size, maxW);
    return kept;
  }
  return lines;
}

// rows: strings, or { label, right } when there's a score to show on the right.
function listRows(rows, color, top, { mystery, marks = 'numbers' } = {}) {
  const twoCols = rows.length > 6;
  const perCol = twoCols ? Math.ceil(rows.length / 2) : rows.length;
  const avail = 500 - top;
  const rowH = Math.min(54, Math.floor(avail / perCol));
  const size = Math.min(28, rowH - 16);
  const colW = twoCols ? 500 : 1040;
  return rows
    .map((row, i) => {
      const { label, right, image } = typeof row === 'string' ? { label: row } : row;
      const col = twoCols && i >= perCol ? 1 : 0;
      const x = 80 + col * 540;
      const y = top + (i - col * perCol) * rowH;
      const cy = y + rowH / 2;
      const r = Math.round(rowH * 0.38);
      const base = cy + size * 0.36;
      const hot = i === 0 && marks === 'numbers' && !mystery;
      const mark =
        marks === 'checks'
          ? `<circle cx="${x + r}" cy="${cy}" r="${r}" fill="${color}"/><path d="M${x + r * 0.5} ${cy} l${r * 0.35} ${r * 0.38} l${r * 0.68} -${r * 0.75}" fill="none" stroke="#fff" stroke-width="${Math.max(3, r / 4)}" stroke-linecap="round" stroke-linejoin="round"/>`
          : `<circle cx="${x + r}" cy="${cy}" r="${r}" fill="${hot ? color : INK}"/><text x="${x + r}" y="${base}" text-anchor="middle" font-family="Rubik" font-weight="800" font-size="${Math.round(size * 0.85)}" fill="#fff">${i + 1}</text>`;
      const rightW = right ? widthOf(String(right), size) + 24 : 0;
      const pic = image && !mystery ? rowH - 10 : 0;
      const textX = x + r * 2 + 16 + (pic ? pic + 12 : 0);
      return `${mark}
        ${pic ? picture(image, x + r * 2 + 14, y + 5, pic, 8) : ''}
        <text x="${textX}" y="${base}" font-family="Rubik" font-weight="${hot ? 700 : 500}" font-size="${size}" fill="${mystery ? '#b5b0a8' : INK}">${esc(fit(label, size, colW - (textX - x) - rightW))}</text>
        ${right ? `<text x="${x + colW}" y="${base}" text-anchor="end" font-family="Rubik" font-weight="800" font-size="${size}" fill="${color}">${esc(right)}</text>` : ''}`;
    })
    .join('');
}

// A picture clipped to a rounded square. href is a data: URI.
let clipN = 0;
function picture(href, x, y, size, radius) {
  const id = `c${clipN++}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}"/></clipPath>
    <image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="none" stroke="${INK}" stroke-width="2"/>`;
}

const TIER_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#8ce99a', '#74c0fc', '#b197fc'];

function tierRows(rows, top) {
  const rowH = Math.min(62, Math.floor((500 - top) / rows.length));
  const size = Math.min(24, rowH - 22);
  return rows
    .map((row, i) => {
      const y = top + i * rowH;
      const h = rowH - 8;
      return `
        <rect x="80" y="${y}" width="${h}" height="${h}" rx="8" fill="${TIER_COLORS[i % TIER_COLORS.length]}" stroke="${INK}" stroke-width="2.5"/>
        <text x="${80 + h / 2}" y="${y + h / 2 + size * 0.4}" text-anchor="middle" font-family="Archivo Black" font-size="${Math.round(size * 1.15)}" fill="${INK}">${esc(clean(row.tier).slice(0, 3))}</text>
        <text x="${80 + h + 18}" y="${y + h / 2 + size * 0.36}" font-family="Rubik" font-weight="600" font-size="${size}" fill="${row.items.length ? INK : '#b5b0a8'}">${esc(fit(row.items.length ? row.items.join(', ') : 'nothing', size, 1040 - h - 20))}</text>`;
    })
    .join('');
}

function barRows(rows, color, top) {
  const rowH = Math.min(70, Math.floor((500 - top) / rows.length));
  const size = Math.max(16, Math.min(26, Math.round(rowH * 0.48)));
  const max = Math.max(...rows.map((r) => r.pct), 1);
  return rows
    .map((row, i) => {
      const y = top + i * rowH;
      const pic = row.image ? rowH - 8 : 0;
      const x0 = 80 + (pic ? pic + 14 : 0);
      const barW = 1040 - (x0 - 80);
      const w = Math.max(6, Math.round((row.pct / max) * barW));
      return `${pic ? picture(row.image, 80, y, pic, 8) : ''}
        ${row.mine ? `<circle cx="${x0 + 8}" cy="${y + size * 0.62}" r="8" fill="${color}"/>` : ''}
        <text x="${row.mine ? x0 + 26 : x0}" y="${y + size}" font-family="Rubik" font-weight="${row.mine ? 800 : 500}" font-size="${size}" fill="${INK}">${esc(fit(row.label + (row.mine ? ' (me)' : ''), size, barW - 180))}</text>
        <text x="1120" y="${y + size}" text-anchor="end" font-family="Rubik" font-weight="800" font-size="${size}" fill="${INK}">${row.pct}%</text>
        <rect x="${x0}" y="${y + size + 7}" width="${barW}" height="10" rx="5" fill="#ece7df"/>
        <rect x="${x0}" y="${y + size + 7}" width="${w}" height="10" rx="5" fill="${row.mine || i === 0 ? color : '#8a857d'}"/>`;
    })
    .join('');
}

function bigBlock(card, color, top) {
  const pic = card.image ? Math.min(300, 500 - top) : 0;
  const textW = pic ? 1040 - pic - 40 : 1040;
  const bigSize = card.big.length > (pic ? 14 : 22) ? 56 : 72;
  const bigLines = wrap(card.big, bigSize, textW, 2);
  const subLines = card.sub ? wrap(card.sub, 28, textW, 3) : [];
  const height = bigSize + (bigLines.length - 1) * bigSize * 1.05 + (subLines.length ? 52 + (subLines.length - 1) * 38 : 0);
  // sit the block in the middle of the space under the title
  let y = top + Math.max(0, (500 - top - height) / 2) + bigSize * 0.8;
  let out = pic ? picture(card.image, 1120 - pic, top + Math.max(0, (500 - top - pic) / 2), pic, 18) : '';
  out += bigLines.map((l, i) => `<text x="80" y="${y + i * bigSize * 1.05}" font-family="Archivo Black" font-size="${bigSize}" fill="${color}">${esc(l)}</text>`).join('');
  y += (bigLines.length - 1) * bigSize * 1.05 + 52;
  if (subLines.length) {
    out += subLines
      .map((l, i) => `<text x="80" y="${y + i * 38}" font-family="Rubik" font-weight="500" font-size="28" fill="${INK}">${esc(l)}</text>`)
      .join('');
  }
  return out;
}

export function cardSvg({ game, card, url }) {
  const color = FORMATS[game.type]?.cardColor ?? FORMATS[game.type]?.color ?? '#ee3322';
  const titleLines = wrap(game.title, 44, 1040, 2);
  const kicker = clean(card.kicker).toUpperCase();
  const kickerW = widthOf(kicker, 18) * 1.12 + 36;
  const bodyTop = 150 + titleLines.length * 50;

  let body = '';
  if (card.layout === 'list') body = listRows(card.rows, color, bodyTop, card);
  else if (card.layout === 'tiers') body = tierRows(card.rows, bodyTop);
  else if (card.layout === 'bars') body = barRows(card.rows, color, bodyTop);
  else if (card.layout === 'big') body = bigBlock(card, color, bodyTop - 10);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2.2" fill="#000" fill-opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${color}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68 - 56}" rx="26" fill="#fffdf8" stroke="${INK}" stroke-width="4"/>
  <rect x="80" y="70" width="${kickerW}" height="38" rx="19" fill="${INK}"/>
  <text x="${80 + 18}" y="96" font-family="Rubik" font-weight="800" font-size="18" letter-spacing="1.5" fill="#fff">${esc(kicker)}</text>
  ${titleLines.map((l, i) => `<text x="80" y="${158 + i * 50}" font-family="Rubik" font-weight="800" font-size="44" fill="${INK}">${esc(l)}</text>`).join('')}
  ${body}
  <text x="44" y="${H - 22}" font-family="Archivo Black" font-size="34" fill="#fff">${esc(SITE_NAME.toLowerCase())}</text>
  <text x="${W - 44}" y="${H - 26}" text-anchor="end" font-family="Rubik" font-weight="700" font-size="24" fill="#fff">${esc(fit('Your turn: ' + url, 24, 820))}</text>
</svg>`;
}

export function renderCard(args) {
  const svg = cardSvg(args);
  const resvg = new Resvg(svg, {
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Rubik' },
    fitTo: { mode: 'width', value: W },
  });
  return resvg.render().asPng();
}
