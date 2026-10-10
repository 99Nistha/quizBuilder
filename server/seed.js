// Starter games so the homepage isn't empty on day one.
//   npm run seed                 -> games only
//   npm run seed -- --demo-plays -> also fake some plays, for local testing only
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { formats } from './formats/index.js';
import { seeds } from './seeds.js';

const demoPlays = process.argv.includes('--demo-plays');
const insert = db.prepare(`INSERT OR IGNORE INTO games (id, slug, type, title, blurb, category, cover, creator, data, created_at)
  VALUES (@id, @slug, @type, @title, @blurb, @category, NULL, @creator, @data, @created_at)`);
const insertPlay = db.prepare('INSERT INTO plays (id, game_id, result, created_at) VALUES (?, ?, ?, ?)');

const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

let added = 0;
db.transaction(() => {
  seeds.forEach((s, n) => {
    const fmt = formats[s.type];
    if (!fmt) return;
    const data = fmt.validate(s.data);
    const id = `seed-${s.slug}`;
    const info = insert.run({ id, slug: s.slug, type: s.type, title: s.title, blurb: s.blurb ?? '', category: s.category, creator: s.creator ?? '', data: JSON.stringify(data), created_at: Date.now() - n * 3_600_000 });
    if (!info.changes) return;
    added += 1;
    if (demoPlays && s.fakePlay) {
      const count = 5 + Math.floor(Math.random() * 120);
      for (let i = 0; i < count; i++) {
        insertPlay.run(nanoid(10), id, JSON.stringify(s.fakePlay(data, shuffle)), Date.now() - Math.floor(Math.random() * 6 * 86_400_000));
      }
      db.prepare('UPDATE games SET plays = ? WHERE id = ?').run(count, id);
    }
  });
})();

console.log(`Added ${added} games${demoPlays ? ' (with demo plays)' : ''}.`);
