// Free picture search: Wikipedia first, iTunes artwork for music/film/TV,
// then Creative Commons photos from Openverse. No API keys. Runs in the
// browser (all three allow it) and in Node for the build tools.
import { BRAND } from './brand.js';

const inBrowser = typeof window !== 'undefined';
// Wikimedia asks callers to say who they are. Browsers can't change User-Agent,
// so the browser sends Api-User-Agent instead (Wikipedia's own convention).
const UA = `${BRAND.name.replace(/\W/g, '')}/1.0 (${BRAND.url}) picture search for user-made quizzes`;

// If a source says "slow down", leave it alone for a minute.
const coolingUntil = new Map();

async function getJson(url) {
  const host = new URL(url).hostname;
  if ((coolingUntil.get(host) ?? 0) > Date.now()) return null;
  try {
    const wiki = host.endsWith('wikipedia.org');
    const headers = inBrowser ? (wiki ? { 'Api-User-Agent': UA } : {}) : { 'user-agent': UA };
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (res.status === 429) {
      coolingUntil.set(host, Date.now() + 60_000);
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
