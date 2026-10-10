import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid, customAlphabet } from 'nanoid';
import { db, dataPath } from './db.js';
import { formats } from './formats/index.js';
import { BadInput, text, image } from './formats/util.js';
import { renderCard } from './card.js';
import { imageStore, searchImages } from './images.js';
import { keyMatches, newEditKey } from './editKeys.js';
import { BRAND, CATEGORIES, FORMATS, LIMITS, REGIONS, SITE_NAME } from '../shared/meta.js';

const app = express();
const PORT = Number(process.env.PORT) || 4317;
const isProd = process.env.NODE_ENV === 'production';
const root = fileURLToPath(new URL('..', import.meta.url));
const uploadDir = path.join(dataPath, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const shortId = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 6);
const DAY = 24 * 60 * 60 * 1000;

app.set('trust proxy', true);
app.use(express.json({ limit: '200kb' }));

// ---------- helpers ----------

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '');

// Pictures used inside a game, in order, for the tile collage.
function gameImages(value, out = []) {
  if (!value || typeof value !== 'object' || out.length >= 4) return out;
  if (typeof value.image === 'string' && value.image && !out.includes(value.image)) out.push(value.image);
  for (const v of Object.values(value)) gameImages(v, out);
  return out;
}

// A few item names to tease on tiles that have no picture.
function peekLabels(data) {
  if (data.pairs) return data.pairs.slice(0, 3).map((p) => `${p.a.label} or ${p.b.label}`);
  const list = data.items ?? data.results ?? data.questions ?? [];
  return list.slice(0, 3).map((i) => i.label ?? i.text).filter(Boolean);
}

function rowToGame(row, { full = false } = {}) {
  const data = JSON.parse(row.data);
  const game = {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: row.title,
    blurb: row.blurb,
    category: row.category,
    region: row.region ?? 'global',
    creator: row.creator,
    // a cover wins; otherwise a collage of up to four pictures from the game itself
    thumbs: row.cover ? [row.cover] : gameImages(data).slice(0, 4),
    peek: peekLabels(data),
    plays: row.plays,
    createdAt: row.created_at,
  };
  if (full) {
    game.cover = row.cover;
    game.data = data;
  }
  if (row.week !== undefined) game.week = row.week;
  return game;
}

const findGame = db.prepare('SELECT * FROM games WHERE slug = ?');
const recentResults = db.prepare('SELECT result FROM plays WHERE game_id = ? ORDER BY created_at DESC LIMIT 5000');

function crowdStats(game) {
  const results = recentResults.all(game.id).map((r) => JSON.parse(r.result));
  return formats[game.type].aggregate(game.data, results);
}

const siteUrl = (process.env.PUBLIC_URL || (isProd ? BRAND.url : '')).replace(/\/$/, '');
const baseUrl = (req) => siteUrl || `${req.protocol}://${req.get('host')}`;

// Tiny in-memory limiter. Nothing is written to disk about who you are.
const hits = new Map();
function limit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key) ?? { n: 0, reset: now + windowMs };
    if (now > entry.reset) Object.assign(entry, { n: 0, reset: now + windowMs });
    entry.n += 1;
    hits.set(key, entry);
    if (entry.n > max) return res.status(429).json({ error: 'Whoa, slow down a sec and try again.' });
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
}, 60_000).unref();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------- api ----------

const weekPlays = db.prepare('SELECT COUNT(*) AS n FROM plays WHERE created_at > ? AND demo = 0');
const gameCount = db.prepare('SELECT COUNT(*) AS n FROM games');
const trendingQ = db.prepare(`
  SELECT g.*, COUNT(p.id) AS week FROM games g
  JOIN plays p ON p.game_id = g.id AND p.created_at > ? AND p.demo = 0
  GROUP BY g.id ORDER BY week DESC, g.plays DESC LIMIT ?`);
const newestQ = db.prepare('SELECT * FROM games ORDER BY created_at DESC LIMIT ?');
const catCounts = db.prepare('SELECT category, COUNT(*) AS n FROM games GROUP BY category');
const regionCounts = db.prepare('SELECT region, COUNT(*) AS n FROM games GROUP BY region');

app.get('/api/home', (req, res) => {
  const since = Date.now() - 7 * DAY;
  const counts = Object.fromEntries(catCounts.all().map((r) => [r.category, r.n]));
  res.json({
    stats: { playsThisWeek: weekPlays.get(since).n, games: gameCount.get().n },
    trending: trendingQ.all(since, 12).map((r) => rowToGame(r)),
    fresh: newestQ.all(12).map((r) => rowToGame(r)),
    categories: CATEGORIES.map((c) => ({ ...c, count: counts[c.id] ?? 0 })),
    regions: Object.fromEntries(regionCounts.all().map((r) => [r.region, r.n])),
  });
});

app.get('/api/games', (req, res) => {
  const where = [];
  const args = [];
  if (req.query.category) {
    where.push('category = ?');
    args.push(String(req.query.category));
  }
  if (req.query.type) {
    where.push('type = ?');
    args.push(String(req.query.type));
  }
  if (req.query.region) {
    where.push('region = ?');
    args.push(String(req.query.region));
  }
  const order = req.query.sort === 'top' ? 'plays DESC' : 'created_at DESC';
  const page = Math.max(0, Number(req.query.page) || 0);
  const rows = db
    .prepare(`SELECT * FROM games ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT 25 OFFSET ?`)
    .all(...args, page * 24);
  res.json({ games: rows.slice(0, 24).map((r) => rowToGame(r)), more: rows.length > 24 });
});

app.get('/api/games/:slug', (req, res) => {
  const row = findGame.get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Couldn't find that one" });
  const game = rowToGame(row, { full: true });
  res.json({ game, stats: crowdStats(game) });
});

const insertGame = db.prepare(`
  INSERT INTO games (id, slug, type, title, blurb, category, region, cover, creator, data, created_at, edit_key_hash)
  VALUES (@id, @slug, @type, @title, @blurb, @category, @region, @cover, @creator, @data, @created_at, @edit_key_hash)`);

// Title, category etc. are shared by create and edit.
function gameFields(body) {
  if (!CATEGORIES.some((c) => c.id === body.category)) throw new BadInput('Pick a category');
  return {
    title: text(body.title, LIMITS.title, { field: 'The title' }),
    blurb: text(body.blurb, LIMITS.blurb, { required: false }),
    category: body.category,
    region: REGIONS.some((r) => r.id === body.region) ? body.region : 'global',
    cover: image(body.cover),
    creator: text(body.creator, LIMITS.creator, { required: false }),
  };
}

// The skeleton of a game: every id and every "which one is right" link,
// without the words and pictures. Once people have played, this can't change,
// or their results would point at things that no longer exist.
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (['label', 'image', 'desc', 'note', 'text', 'shuffle'].includes(k)) continue;
    out[k] = k === 'tiers' && Array.isArray(v) ? v.length : shape(v);
  }
  return out;
}

app.post(
  '/api/games',
  limit(20, 60 * 60 * 1000),
  wrap((req, res) => {
    const body = req.body ?? {};
    const format = formats[body.type];
    if (!format) throw new BadInput('Pick a game type');
    const fields = gameFields(body);
    const data = format.validate(body.data);
    const id = nanoid(12);
    const slug = `${slugify(fields.title) || 'game'}-${shortId()}`;
    const { key, hash } = newEditKey();
    insertGame.run({ id, slug, type: body.type, ...fields, data: JSON.stringify(data), created_at: Date.now(), edit_key_hash: hash });
    res.status(201).json({ slug, editKey: key });
  }),
);

// ---------- editing (needs the game's edit key) ----------

function ownedGame(req) {
  const row = findGame.get(req.params.slug);
  if (!row) throw Object.assign(new Error("Couldn't find that one"), { status: 404 });
  if (!keyMatches(row, req.get('x-edit-key'))) throw Object.assign(new Error("That edit link doesn't work for this game."), { status: 403 });
  return row;
}

app.get('/api/games/:slug/edit', limit(200, 60 * 60 * 1000), (req, res) => {
  const row = ownedGame(req);
  res.json({ game: rowToGame(row, { full: true }), locked: row.plays > 0 });
});

const updateGame = db.prepare(`
  UPDATE games SET title = @title, blurb = @blurb, category = @category, region = @region, cover = @cover,
    creator = @creator, data = @data, updated_at = @updated_at WHERE id = @id`);

app.put(
  '/api/games/:slug',
  limit(120, 60 * 60 * 1000),
  wrap((req, res) => {
    const row = ownedGame(req);
    const body = req.body ?? {};
    const fields = gameFields(body);
    const data = formats[row.type].validate(body.data);
    if (row.plays > 0 && JSON.stringify(shape(data)) !== JSON.stringify(shape(JSON.parse(row.data)))) {
      throw new BadInput("People have already played this, so you can change names, pictures and details but not add or remove things.");
    }
    updateGame.run({ id: row.id, ...fields, data: JSON.stringify(data), updated_at: Date.now() });
    res.json({ slug: row.slug });
  }),
);

app.delete(
  '/api/games/:slug',
  limit(60, 60 * 60 * 1000),
  wrap((req, res) => {
    const row = ownedGame(req);
    db.prepare('DELETE FROM games WHERE id = ?').run(row.id);
    res.json({ deleted: true });
  }),
);

const insertPlay = db.prepare('INSERT INTO plays (id, game_id, result, created_at) VALUES (?, ?, ?, ?)');
const bumpPlays = db.prepare('UPDATE games SET plays = plays + 1 WHERE id = ?');
const savePlay = db.transaction((id, gameId, result) => {
  insertPlay.run(id, gameId, JSON.stringify(result), Date.now());
  bumpPlays.run(gameId);
});

app.post(
  '/api/games/:slug/plays',
  limit(120, 60 * 60 * 1000),
  wrap((req, res) => {
    const row = findGame.get(req.params.slug);
    if (!row) return res.status(404).json({ error: "Couldn't find that one" });
    const game = rowToGame(row, { full: true });
    const result = formats[game.type].validatePlay(game.data, req.body?.result);
    const id = nanoid(10);
    savePlay(id, game.id, result);
    res.status(201).json({ id, stats: crowdStats(game), plays: game.plays + 1 });
  }),
);

const findPlay = db.prepare('SELECT p.id AS play_id, p.result, g.* FROM plays p JOIN games g ON g.id = p.game_id WHERE p.id = ?');

app.get('/api/results/:id', (req, res) => {
  const row = findPlay.get(req.params.id);
  if (!row) return res.status(404).json({ error: "That result doesn't exist (anymore?)" });
  const game = rowToGame(row, { full: true });
  res.json({ id: row.play_id, result: JSON.parse(row.result), game, stats: crowdStats(game) });
});

const images = imageStore(uploadDir);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif'].includes(file.mimetype)),
});

app.post(
  '/api/uploads',
  limit(150, 60 * 60 * 1000),
  upload.single('image'),
  wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'That file type isn’t supported. Try a JPG, PNG, GIF or WebP.' });
    res.status(201).json({ url: await images.save(req.file.buffer, req.file.mimetype) });
  }),
);

// Free picture search (Wikipedia, iTunes artwork, Openverse). No API keys needed.
app.get(
  '/api/image-search',
  limit(300, 60 * 60 * 1000),
  wrap(async (req, res) => {
    const q = String(req.query.q ?? '').trim().slice(0, 100);
    if (q.length < 2) return res.json({ results: [] });
    res.json({ results: await searchImages(q, String(req.query.category ?? ''), { quick: req.query.quick === '1' }) });
  }),
);

// Copy a search result onto our disk so it can't disappear or get hotlink-blocked later.
app.post(
  '/api/images/import',
  limit(300, 60 * 60 * 1000),
  wrap(async (req, res) => {
    res.status(201).json({ url: await images.importRemote(String(req.body?.url ?? '')) });
  }),
);

app.use('/uploads', express.static(uploadDir, { maxAge: '30d', immutable: true }));

// ---------- share cards ----------

const cardCache = new Map();
function cachedCard(key, make) {
  if (cardCache.has(key)) return cardCache.get(key);
  const png = make();
  cardCache.set(key, png);
  if (cardCache.size > 300) cardCache.delete(cardCache.keys().next().value);
  return png;
}

const displayUrl = (req, p) => `${baseUrl(req).replace(/^https?:\/\//, '')}${p}`;

// Swap image paths on a card for small inline JPEGs the renderer can draw.
async function withPictures(card) {
  const toData = async (src, size) => {
    const buf = await images.cardThumb(src, size);
    return buf ? `data:image/jpeg;base64,${buf.toString('base64')}` : null;
  };
  if (card.image) card.image = await toData(card.image, 320);
  if (Array.isArray(card.rows)) {
    card.rows = await Promise.all(card.rows.map(async (row) => (row && typeof row === 'object' && row.image ? { ...row, image: await toData(row.image, 120) } : row)));
  }
  return card;
}

async function cardFor(key, game, result, req) {
  if (cardCache.has(key)) return cardCache.get(key);
  const stats = crowdStats(game);
  const card = await withPictures(formats[game.type].card(game, result, stats));
  return cachedCard(key, () => renderCard({ game, card, url: displayUrl(req, `/play/${game.slug}`) }));
}

app.get(
  '/card/play/:slug.png',
  wrap(async (req, res) => {
    const row = findGame.get(req.params.slug);
    if (!row) return res.sendStatus(404);
    const game = rowToGame(row, { full: true });
    const png = await cardFor(`g:${game.id}:${game.plays}:${row.updated_at ?? 0}`, game, null, req);
    res.type('png').set('Cache-Control', 'public, max-age=600').send(png);
  }),
);

app.get(
  '/card/r/:id.png',
  wrap(async (req, res) => {
    const row = findPlay.get(req.params.id);
    if (!row) return res.sendStatus(404);
    const game = rowToGame(row, { full: true });
    const png = await cardFor(`r:${row.play_id}:${row.updated_at ?? 0}`, game, JSON.parse(row.result), req);
    res.type('png').set('Cache-Control', 'public, max-age=86400').send(png);
  }),
);

// ---------- errors ----------

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'That image is too big. 8 MB max.' });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something broke on our end. Try again?' });
});

// ---------- pages (production) ----------
// The SPA handles rendering; the server only fills in link-preview tags so
// shared links unfurl with the right title and card image.

if (isProd) {
  const dist = path.join(root, 'dist');
  const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const page = (res, { title, description, image, url }) => {
    const tags = [
      `<title>${escAttr(title)}</title>`,
      `<meta name="description" content="${escAttr(description)}">`,
      `<meta property="og:site_name" content="${SITE_NAME}">`,
      `<meta property="og:title" content="${escAttr(title)}">`,
      `<meta property="og:description" content="${escAttr(description)}">`,
      `<meta property="og:url" content="${escAttr(url)}">`,
      `<meta property="og:type" content="website">`,
      image && `<meta property="og:image" content="${escAttr(image)}">`,
      image && `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    ]
      .filter(Boolean)
      .join('\n    ');
    res.send(shell.replace(/<title>.*?<\/title>/s, tags));
  };

  app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true }));

  app.get('/play/:slug', (req, res) => {
    const row = findGame.get(req.params.slug);
    const base = baseUrl(req);
    if (!row) return page(res.status(404), { title: SITE_NAME, description: BRAND.description, url: base });
    page(res, {
      title: `${row.title} | ${SITE_NAME}`,
      description: row.blurb || `A ${FORMATS[row.type].name.toLowerCase()} on ${SITE_NAME}. ${row.plays.toLocaleString('en-US')} plays so far.`,
      image: `${base}/card/play/${row.slug}.png?v=${row.plays}-${row.updated_at ?? 0}`,
      url: `${base}/play/${row.slug}`,
    });
  });

  app.get('/r/:id', (req, res) => {
    const row = findPlay.get(req.params.id);
    const base = baseUrl(req);
    if (!row) return page(res.status(404), { title: SITE_NAME, description: BRAND.description, url: base });
    const game = rowToGame(row, { full: true });
    page(res, {
      title: `${row.title} | ${SITE_NAME}`,
      description: formats[row.type].summary(game, JSON.parse(row.result)),
      image: `${base}/card/r/${row.play_id}.png`,
      url: `${base}/r/${row.play_id}`,
    });
  });

  app.get('/{*splat}', (req, res) =>
    page(res, { title: `${SITE_NAME}: ${BRAND.tagline}`, description: BRAND.description, url: baseUrl(req) }),
  );
}

// Express 5 hands listen errors to this callback, so check before claiming we're up.
// A brand-new live site starts with the starter games (and their pictures).
// Runs in the background so the site is up straight away.
if (isProd && gameCount.get().n === 0) {
  const { spawn } = await import('node:child_process');
  console.log('Empty database: adding the starter games in the background…');
  spawn(process.execPath, [path.join(root, 'server/seed.js')], { stdio: 'inherit', env: process.env });
}

app.listen(PORT, (err) => {
  if (err) {
    console.error(
      err.code === 'EADDRINUSE'
        ? `Port ${PORT} is already in use, probably another copy of this server. Stop it, or run with PORT=<other port>.`
        : `Couldn't start the server: ${err.message}`,
    );
    process.exit(1);
  }
  console.log(`${SITE_NAME} api on http://localhost:${PORT}`);
});
