// Turns a share card into a PNG with resvg (used by the GitHub Pages build).
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cardSvg } from '../shared/card.js';

const fontDir = fileURLToPath(new URL('./fonts', import.meta.url));
const fontFiles = fs.readdirSync(fontDir).filter((f) => f.endsWith('.ttf')).map((f) => path.join(fontDir, f));

export function renderCard(args) {
  const resvg = new Resvg(cardSvg(args), {
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Rubik' },
    fitTo: { mode: 'width', value: 1200 },
  });
  return resvg.render().asPng();
}
