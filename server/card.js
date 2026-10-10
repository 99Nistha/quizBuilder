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

function listRows(rows, color, top, mystery) {
  const twoCols = rows.length > 6;
  const perCol = twoCols ? Math.ceil(rows.length / 2) : rows.length;
  const avail = 470 - top;
  const rowH = Math.min(54, Math.floor(avail / perCol));
  const size = Math.min(28, rowH - 16);
  const colW = twoCols ? 520 : 1040;
  return rows
    .map((label, i) => {
      const col = twoCols && i >= perCol ? 1 : 0;
      const x = 80 + col * 540;
      const y = top + (i - col * perCol) * rowH;
      const r = Math.round(rowH * 0.38);
      return `
        <circle cx="${x + r}" cy="${y + rowH / 2}" r="${r}" fill="${i === 0 && !mystery ? color : INK}"/>
        <text x="${x + r}" y="${y + rowH / 2 + size * 0.36}" text-anchor="middle" font-family="Rubik" font-weight="800" font-size="${Math.round(size * 0.85)}" fill="#fff">${i + 1}</text>
        <text x="${x + r * 2 + 16}" y="${y + rowH / 2 + size * 0.36}" font-family="Rubik" font-weight="${i === 0 ? 700 : 500}" font-size="${size}" fill="${mystery ? '#b5b0a8' : INK}">${esc(fit(label, size, colW - r * 2 - 40))}</text>`;
    })
    .join('');
}

function barRows(rows, color, top) {
  const rowH = Math.min(70, Math.floor((470 - top) / rows.length));
  const size = Math.min(26, rowH - 30);
  return rows
    .map((row, i) => {
      const y = top + i * rowH;
      const w = Math.max(6, Math.round((row.pct / 100) * 1040));
      return `
        <text x="80" y="${y + size}" font-family="Rubik" font-weight="${row.mine ? 800 : 500}" font-size="${size}" fill="${INK}">${esc(fit((row.mine ? '✓ ' : '') + row.label, size, 880))}</text>
        <text x="1120" y="${y + size}" text-anchor="end" font-family="Rubik" font-weight="800" font-size="${size}" fill="${INK}">${row.pct}%</text>
        <rect x="80" y="${y + size + 8}" width="1040" height="12" rx="6" fill="#ece7df"/>
        <rect x="80" y="${y + size + 8}" width="${w}" height="12" rx="6" fill="${row.mine || i === 0 ? color : '#8a857d'}"/>`;
    })
    .join('');
}

function bigBlock(card, color, top) {
  const bigSize = card.big.length > 22 ? 56 : 72;
  const bigLines = wrap(card.big, bigSize, 1040, 2);
  let y = top + bigSize;
  let out = bigLines.map((l, i) => `<text x="80" y="${y + i * bigSize * 1.05}" font-family="Archivo Black" font-size="${bigSize}" fill="${color}">${esc(l)}</text>`).join('');
  y += (bigLines.length - 1) * bigSize * 1.05 + 52;
  if (card.sub) {
    out += wrap(card.sub, 28, 1040, 3)
      .map((l, i) => `<text x="80" y="${y + i * 38}" font-family="Rubik" font-weight="500" font-size="28" fill="${INK}">${esc(l)}</text>`)
      .join('');
  }
  return out;
}

export function cardSvg({ game, card, url }) {
  const color = FORMATS[game.type]?.color ?? '#ee3322';
  const titleLines = wrap(game.title, 44, 1040, 2);
  const kicker = clean(card.kicker).toUpperCase();
  const kickerW = widthOf(kicker, 18) * 1.12 + 36;
  const bodyTop = 150 + titleLines.length * 50;

  let body = '';
  if (card.layout === 'list') body = listRows(card.rows, color, bodyTop, card.mystery);
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
