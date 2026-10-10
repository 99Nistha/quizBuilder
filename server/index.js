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
import { CATEGORIES, FORMATS, LIMITS, SITE_NAME } from '../shared/meta.js';

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

function firstImage(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.image === 'string' && value.image) return value.image;
  for (const v of Object.values(value)) {
    const found = firstImage(v);
    if (found) return found;
  }
  return null;
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
    creator: row.creator,
    thumb: row.cover || firstImage(data),
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

const baseUrl = (req) => process.env.PUBLIC_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;

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

const weekPlays = db.prepare('SELECT COUNT(*) AS n FROM plays WHERE created_at > ?');
const gameCount = db.prepare('SELECT COUNT(*) AS n FROM games');
const trendingQ = db.prepare(`
  SELECT g.*, COUNT(p.id) AS week FROM games g
  JOIN plays p ON p.game_id = g.id AND p.created_at > ?
  GROUP BY g.id ORDER BY week DESC, g.plays DESC LIMIT ?`);
const newestQ = db.prepare('SELECT * FROM games ORDER BY created_at DESC LIMIT ?');
const catCounts = db.prepare('SELECT category, COUNT(*) AS n FROM games GROUP BY category');

app.get('/api/home', (req, res) => {
  const since = Date.now() - 7 * DAY;
  const counts = Object.fromEntries(catCounts.all().map((r) => [r.category, r.n]));
  res.json({
    stats: { playsThisWeek: weekPlays.get(since).n, games: gameCount.get().n },
    trending: trendingQ.all(since, 8).map((r) => rowToGame(r)),
    fresh: newestQ.all(8).map((r) => rowToGame(r)),
    categories: CATEGORIES.map((c) => ({ ...c, count: counts[c.id] ?? 0 })),
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
  INSERT INTO games (id, slug, type, title, blurb, category, cover, creator, data, created_at)
  VALUES (@id, @slug, @type, @title, @blurb, @category, @cover, @creator, @data, @created_at)`);

app.post(
  '/api/games',
  limit(20, 60 * 60 * 1000),
  wrap((req, res) => {
    const body = req.body ?? {};
    const format = formats[body.type];
    if (!format) throw new BadInput('Pick a game type');
    if (!CATEGORIES.some((c) => c.id === body.category)) throw new BadInput('Pick a category');
    const title = text(body.title, LIMITS.title, { field: 'The title' });
    const data = format.validate(body.data);
    const id = nanoid(12);
    const slug = `${slugify(title) || 'game'}-${shortId()}`;
    insertGame.run({
      id,
      slug,
      type: body.type,
      title,
      blurb: text(body.blurb, LIMITS.blurb, { required: false }),
      category: body.category,
      cover: image(body.cover),
      creator: text(body.creator, LIMITS.creator, { required: false }),
      data: JSON.stringify(data),
      created_at: Date.now(),
    });
    res.status(201).json({ slug });
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

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${nanoid(14)}.${{ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' }[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.mimetype)),
});

app.post('/api/uploads', limit(80, 60 * 60 * 1000), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'That file type isn’t supported. Try a JPG, PNG, GIF or WebP.' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

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

app.get('/card/play/:slug.png', (req, res) => {
  const row = findGame.get(req.params.slug);
  if (!row) return res.sendStatus(404);
  const game = rowToGame(row, { full: true });
  const png = cachedCard(`g:${game.id}:${game.plays}`, () => {
    const stats = crowdStats(game);
    return renderCard({ game, card: formats[game.type].card(game, null, stats), url: displayUrl(req, `/play/${game.slug}`) });
  });
  res.type('png').set('Cache-Control', 'public, max-age=600').send(png);
});

app.get('/card/r/:id.png', (req, res) => {
  const row = findPlay.get(req.params.id);
  if (!row) return res.sendStatus(404);
  const game = rowToGame(row, { full: true });
  const png = cachedCard(`r:${row.play_id}`, () => {
    const stats = crowdStats(game);
    return renderCard({ game, card: formats[game.type].card(game, JSON.parse(row.result), stats), url: displayUrl(req, `/play/${game.slug}`) });
  });
  res.type('png').set('Cache-Control', 'public, max-age=86400').send(png);
});

// ---------- errors ----------

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'That image is too big. 5 MB max.' });
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
    if (!row) return page(res.status(404), { title: SITE_NAME, description: 'Make and play silly quizzes.', url: base });
    page(res, {
      title: `${row.title} | ${SITE_NAME}`,
      description: row.blurb || `A ${FORMATS[row.type].name.toLowerCase()} on ${SITE_NAME}. ${row.plays.toLocaleString('en-US')} plays so far.`,
      image: `${base}/card/play/${row.slug}.png?v=${row.plays}`,
      url: `${base}/play/${row.slug}`,
    });
  });

  app.get('/r/:id', (req, res) => {
    const row = findPlay.get(req.params.id);
    const base = baseUrl(req);
    if (!row) return page(res.status(404), { title: SITE_NAME, description: 'Make and play silly quizzes.', url: base });
    const game = rowToGame(row, { full: true });
    page(res, {
      title: `${row.title} | ${SITE_NAME}`,
      description: formats[row.type].summary(game, JSON.parse(row.result)),
      image: `${base}/card/r/${row.play_id}.png`,
      url: `${base}/r/${row.play_id}`,
    });
  });

  app.get('/{*splat}', (req, res) =>
    page(res, { title: `${SITE_NAME}: make the quiz, start the argument`, description: 'Blind rankings, quizzes, this-or-that and more. Made by people, for people with opinions.', url: baseUrl(req) }),
  );
}

app.listen(PORT, () => console.log(`${SITE_NAME} api on http://localhost:${PORT}`));
