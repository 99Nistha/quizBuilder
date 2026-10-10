// Runs after `vite build` (on GitHub, see .github/workflows/deploy.yml).
// GitHub Pages can only serve files, so for every game this writes:
//   dist/play/<slug>/index.html  - the app, with that game's link-preview tags
//   dist/cards/<slug>.png        - the picture WhatsApp/X/iMessage show for the link
// plus 404.html so links like /r/abc123 still open the app.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BRAND } from '../shared/brand.js';
import { formats } from '../shared/formats/index.js';
import { FORMATS } from '../shared/meta.js';
import { renderCard } from './renderCard.js';

const dist = path.resolve('dist');
const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const site = BRAND.url.replace(/\/$/, '');
const { url: supaUrl, anonKey } = BRAND.supabase;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page({ title, description, image, url }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta property="og:site_name" content="${esc(BRAND.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join('\n    ');
  return shell.replace(/<title>.*?<\/title>/s, tags);
}

const write = (file, contents) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
};

// ---------- the homepage, and the fallback for every other link ----------

const homeCard = renderCard({
  game: { type: 'blind_ranking', title: `${BRAND.name}: ${BRAND.tagline}` },
  card: { kicker: 'Play, rank, argue', layout: 'big', big: 'Make the quiz. Start the argument.', sub: BRAND.description, color: BRAND.colors.honey },
  url: site.replace(/^https?:\/\//, ''),
});
write(path.join(dist, 'og.png'), homeCard);
const home = page({ title: `${BRAND.name}: ${BRAND.tagline}`, description: BRAND.description, image: `${site}/og.png`, url: site });
write(path.join(dist, 'index.html'), home);
write(path.join(dist, '404.html'), home);
write(path.join(dist, '.nojekyll'), '');

if (!supaUrl || !anonKey) {
  console.log('Supabase not set up yet (shared/brand.js), so no per-game pages this time.');
  process.exit(0);
}

// ---------- one page + one card per game ----------

async function rpc(fn, args) {
  const res = await fetch(`${supaUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fn}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function thumb(src, size) {
  try {
    const buf = Buffer.from(await (await fetch(src)).arrayBuffer());
    const jpg = await sharp(buf, { animated: false }).resize(size, size, { fit: 'cover' }).flatten({ background: '#fff' }).jpeg({ quality: 80 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString('base64')}`;
  } catch {
    return null;
  }
}

const games = [];
for (let page = 0; ; page++) {
  const r = await rpc('list_games', { p_page: page, p_sort: 'new' });
  games.push(...r.games);
  if (!r.more || page > 40) break;
}

let done = 0;
async function build(game) {
  const { results } = await rpc('get_game', { p_slug: game.slug });
  const stats = formats[game.type].aggregate(game.data, results);
  const card = formats[game.type].card(game, null, stats);
  if (card.image) card.image = await thumb(card.image, 320);
  if (Array.isArray(card.rows)) {
    card.rows = await Promise.all(card.rows.map(async (row) => (row && typeof row === 'object' && row.image ? { ...row, image: await thumb(row.image, 120) } : row)));
  }
  const gameUrl = `${site}/play/${game.slug}`;
  write(path.join(dist, 'cards', `${game.slug}.png`), renderCard({ game, card, url: gameUrl.replace(/^https?:\/\//, '') }));
  write(
    path.join(dist, 'play', game.slug, 'index.html'),
    page({
      title: `${game.title} | ${BRAND.name}`,
      description: game.blurb || `A ${FORMATS[game.type].name.toLowerCase()} on ${BRAND.name}. ${game.plays.toLocaleString('en-US')} plays so far.`,
      image: `${site}/cards/${game.slug}.png?v=${game.plays}-${game.updatedAt ?? 0}`,
      url: gameUrl,
    }),
  );
  done += 1;
}

// a few at a time
const queue = [...games];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let g = queue.shift(); g; g = queue.shift()) {
      try {
        await build(g);
      } catch (err) {
        console.warn(`skipped ${g.slug}: ${err.message}`);
      }
    }
  }),
);
console.log(`Built link previews for ${done} of ${games.length} games.`);
