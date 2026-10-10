// Picture handling: resizing uploads, searching free image sources, and
// copying a picked search result onto our own disk so it never breaks.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { BadInput } from './formats/util.js';

// Wikimedia asks for a User-Agent with a way to contact the operator.
// Set IMAGE_SEARCH_CONTACT to your site URL or email when you deploy.
const UA = `Quizbop/0.1 (${process.env.IMAGE_SEARCH_CONTACT || 'https://github.com/99Nistha/quizBuilder'}) image search for user-made quizzes`;
const MAX_BYTES = 8 * 1024 * 1024;

export function imageStore(uploadDir) {
  // Everything gets shrunk to something sensible. GIFs stay as they are so they keep moving.
  async function save(buffer, mimetype) {
    if (mimetype === 'image/gif') {
      const name = `${nanoid(14)}.gif`;
      await fs.promises.writeFile(path.join(uploadDir, name), buffer);
      return `/uploads/${name}`;
    }
    const img = sharp(buffer, { failOn: 'none' }).rotate();
    const meta = await img.metadata();
    if (!meta.width) throw new BadInput("That doesn't look like a picture.");
    const name = `${nanoid(14)}.${meta.hasAlpha ? 'png' : 'jpg'}`;
    const resized = img.resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true });
    await (meta.hasAlpha ? resized.png({ compressionLevel: 9 }) : resized.jpeg({ quality: 82, mozjpeg: true })).toFile(path.join(uploadDir, name));
    return `/uploads/${name}`;
  }

  // Only fetch from the image sources we search ourselves, never arbitrary URLs.
  const ALLOWED = [/^upload\.wikimedia\.org$/, /^thumb\.wikimedia\.org$/, /^api\.openverse\.org$/, /^is\d-ssl\.mzstatic\.com$/];

  async function importRemote(url) {
    let u;
    try {
      u = new URL(url);
    } catch {
      throw new BadInput('Bad image link');
    }
    if (u.protocol !== 'https:' || !ALLOWED.some((re) => re.test(u.hostname))) throw new BadInput("We can't grab pictures from there");
    const res = await fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new BadInput("Couldn't load that picture, try another one");
    const type = res.headers.get('content-type')?.split(';')[0] ?? '';
    if (!type.startsWith('image/')) throw new BadInput("That link isn't a picture");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new BadInput('That picture is huge, try another one');
    return save(buf, type);
  }

  // Small square-ish JPEG for share cards, cached on disk next to the upload.
  async function cardThumb(src, size = 160) {
    if (!src?.startsWith('/uploads/')) return null;
    const file = path.join(uploadDir, path.basename(src));
    const thumb = `${file}.card${size}.jpg`;
    try {
      return await fs.promises.readFile(thumb);
    } catch {
      /* not made yet */
    }
    try {
      const buf = await sharp(file, { animated: false }).resize(size, size, { fit: 'cover' }).flatten({ background: '#ffffff' }).jpeg({ quality: 80 }).toBuffer();
      await fs.promises.writeFile(thumb, buf);
      return buf;
    } catch {
      return null;
    }
  }

  return { save, importRemote, cardThumb };
}

// ---------- search ----------

// If a source says "slow down", leave it alone for a minute.
const coolingUntil = new Map();

async function getJson(url) {
  const host = new URL(url).hostname;
  if ((coolingUntil.get(host) ?? 0) > Date.now()) return null;
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, 'api-user-agent': UA }, signal: AbortSignal.timeout(8000) });
    if (res.status === 429) {
      coolingUntil.set(host, Date.now() + 60_000);
      console.warn(`image search: ${host} is rate limiting us, backing off for a minute`);
    }
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const WIKI = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages|pageprops&ppprop=disambiguation&piprop=thumbnail&pithumbsize=640&pilicense=any';
const wikiHit = (p) => ({ thumb: p.thumbnail.source, url: p.thumbnail.source, title: p.title, source: 'Wikipedia' });

// "Black Widow" in Movies should find the film, not the spider.
const HINTS = { movies: 'film', tv: 'TV series' };

async function wikipedia(q, category, { limit = 10 } = {}) {
  const hint = HINTS[category];
  const search = (term, n) => getJson(`${WIKI}&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=${n}`);
  // The page titled exactly what was typed is usually the right picture
  // (Iron Man the character, not a theme park ride), so look that up too.
  const [hinted, exact, general] = await Promise.all([hint ? search(`${q} ${hint}`, 2) : null, getJson(`${WIKI}&redirects=1&titles=${encodeURIComponent(q)}`), search(q, limit)]);
  const usable = (p) => p.thumbnail?.source && !p.pageprops?.hasOwnProperty('disambiguation');
  const pages = (data) =>
    Object.values(data?.query?.pages ?? {})
      .filter(usable)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return [...pages(hinted).slice(0, 1), ...pages(exact), ...pages(general)].map(wikiHit);
}

async function openverse(q) {
  // commercial-friendly Creative Commons licences only
  const data = await getJson(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=12&license_type=commercial&mature=false`);
  return (data?.results ?? []).map((r) => {
    const thumb = `https://api.openverse.org/v1/images/${r.id}/thumb/`;
    return { thumb, url: thumb, title: r.title || q, source: 'Openverse', credit: r.attribution };
  });
}

async function itunes(q, category) {
  const kind = { music: 'media=music&entity=album', movies: 'media=movie&entity=movie', tv: 'media=tvShow&entity=tvSeason' }[category];
  if (!kind) return [];
  const data = await getJson(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&${kind}&limit=8`);
  return (data?.results ?? [])
    .filter((r) => r.artworkUrl100)
    .map((r) => {
      const big = r.artworkUrl100.replace(/\/\d+x\d+bb\./, '/600x600bb.');
      return { thumb: big, url: big, title: r.collectionName || r.trackName, source: 'iTunes' };
    });
}

const cache = new Map();

// quick: just the best guess, for "find pictures for me".
export async function searchImages(q, category, { quick = false } = {}) {
  const key = `${quick ? 'q' : 'f'}:${category}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && hit.at > Date.now() - 3600_000) return hit.results;

  let [wiki, art, cc] = await Promise.all([wikipedia(q, category, { limit: quick ? 3 : 10 }), itunes(q, category), quick ? [] : openverse(q)]);
  if (quick && !wiki.length && !art.length) cc = await openverse(q);
  // Wikipedia's top hit is usually exactly the person/thing typed, so it goes first.
  const seen = new Set();
  const results = [...wiki.slice(0, 1), ...art.slice(0, 4), ...wiki.slice(1, 6), ...cc]
    .filter((r) => !seen.has(r.url) && seen.add(r.url))
    .slice(0, 18);

  // don't remember empty answers, they're usually a timeout
  if (results.length) cache.set(key, { at: Date.now(), results });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return results;
}
