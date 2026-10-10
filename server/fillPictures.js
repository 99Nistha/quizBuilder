// Finds pictures for starter games that don't have them yet.
//   npm run pictures            -> starter games only
//   npm run pictures -- --force -> redo starter pictures even if they have some
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, dataPath } from './db.js';
import { imageStore, searchImages } from './images.js';
import { seeds } from './seeds.js';

const images = imageStore(path.join(dataPath, 'uploads'));

// Every place a picture can go in a game, by format.
// `queries` is the seed's label -> search term map. Sentences (questions,
// would-you-rather options) only get a picture when they have a hand-picked term,
// because searching a whole sentence finds nonsense.
export function pictureSlots(type, data, queries = {}) {
  // hand-picked terms are exact page names, so they skip the category hint ("film", "TV series")
  const slot = (obj, label = obj.label) => ({ label, query: queries[label] ?? label, exact: Boolean(queries[label]), has: () => Boolean(obj.image), set: (url) => (obj.image = url) });
  switch (type) {
    case 'this_or_that':
      return data.pairs.flatMap((p) => [slot(p.a), slot(p.b)]);
    case 'personality':
      return data.results.map((r) => slot(r));
    case 'would_you_rather':
      // both sides or neither, so the two cards stay matched
      return data.pairs.filter((p) => queries[p.a.label] && queries[p.b.label]).flatMap((p) => [slot(p.a), slot(p.b)]);
    case 'trivia':
      return data.questions.filter((q) => queries[q.text]).map((q) => slot(q, q.text));
    default:
      return (data.items ?? []).map((i) => slot(i));
  }
}

async function findOne(query, category) {
  const results = await searchImages(query, category, { quick: true });
  for (const r of results.slice(0, 2)) {
    try {
      return await images.importRemote(r.url);
    } catch {
      /* try the next one */
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fillStarterPictures({ force = false, log = console.log } = {}) {
  const getGame = db.prepare('SELECT * FROM games WHERE slug = ?');
  const save = db.prepare('UPDATE games SET data = ?, cover = ? WHERE id = ?');
  let found = 0;
  let missed = [];

  for (const seed of seeds) {
    const row = getGame.get(seed.slug);
    if (!row) continue;
    const data = JSON.parse(row.data);
    let cover = row.cover;
    const todo = pictureSlots(row.type, data, seed.pictures).filter((s) => force || !s.has());

    for (const s of todo) {
      const url = await findOne(s.query, s.exact ? '' : row.category);
      if (url) {
        s.set(url);
        found += 1;
      } else missed.push(`${seed.slug}: ${s.label}`);
      await sleep(250); // be gentle with Wikipedia
    }
    if (seed.cover && (force || !cover)) {
      cover = (await findOne(seed.cover, row.category)) ?? cover;
      if (cover) found += 1;
    }
    save.run(JSON.stringify(data), cover, row.id);
    log(`${seed.slug}: ${todo.length ? `${todo.length} slots` : 'nothing to do'}${seed.cover ? ' + cover' : ''}`);
  }
  log(`Found ${found} pictures.${missed.length ? ` No luck for: ${missed.join(', ')}` : ''}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await fillStarterPictures({ force: process.argv.includes('--force') });
}
