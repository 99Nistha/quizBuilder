// One-off: copies everything from the old local database (data/app.db) and its
// pictures (data/uploads) into Supabase. Safe to run more than once.
//
//   SUPABASE_SERVICE_KEY=... node tools/migrate-to-supabase.js
//
// The service key is secret (Supabase -> Settings -> API -> service_role).
// Only use it on your own computer; never put it in the code or on GitHub.
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { BRAND } from '../shared/brand.js';

const { url } = BRAND.supabase;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url) throw new Error('Fill in BRAND.supabase.url in shared/brand.js first.');
if (!key) throw new Error('Run with SUPABASE_SERVICE_KEY=... (Supabase -> Settings -> API -> service_role key).');

const dataDir = path.resolve(process.argv[2] ?? 'data');
const db = new Database(path.join(dataDir, 'app.db'), { readonly: true });
const auth = { apikey: key, Authorization: `Bearer ${key}` };

async function call(method, route, body, extra = {}) {
  const res = await fetch(`${url}${route}`, { method, headers: { ...auth, ...extra }, body });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${await res.text()}`);
  return res;
}

// 1. pictures: /uploads/abc.jpg -> https://<project>.supabase.co/storage/v1/object/public/pictures/seed/abc.jpg
const games = db.prepare('SELECT * FROM games').all();
const used = new Set();
for (const g of games) for (const m of `${g.cover ?? ''} ${g.data}`.matchAll(/\/uploads\/([\w.-]+)/g)) used.add(m[1]);

const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
let n = 0;
for (const name of used) {
  const file = path.join(dataDir, 'uploads', name);
  if (!fs.existsSync(file)) continue;
  await call('POST', `/storage/v1/object/pictures/seed/${name}`, fs.readFileSync(file), { 'content-type': types[name.split('.').pop()] ?? 'application/octet-stream', 'x-upsert': 'true', 'cache-control': '31536000' });
  if (++n % 25 === 0) console.log(`  ${n}/${used.size} pictures`);
}
console.log(`Uploaded ${n} pictures.`);

const publicUrl = (name) => `${url}/storage/v1/object/public/pictures/seed/${name}`;
const fix = (s) => s?.replace(/\/uploads\/([\w.-]+)/g, (_, name) => publicUrl(name)) ?? null;
const iso = (ms) => (ms ? new Date(ms).toISOString() : null);

// 2. games (edit keys come along, so old edit links keep working)
const rows = games.map((g) => ({
  id: g.id,
  slug: g.slug,
  type: g.type,
  title: g.title,
  blurb: g.blurb,
  category: g.category,
  region: g.region ?? 'global',
  cover: fix(g.cover),
  creator: g.creator,
  data: JSON.parse(fix(g.data)),
  plays: g.plays,
  edit_key_hash: g.edit_key_hash ?? null,
  created_at: iso(g.created_at),
  updated_at: iso(g.updated_at),
}));
await call('POST', '/rest/v1/games?on_conflict=id', JSON.stringify(rows), { 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates' });
console.log(`Copied ${rows.length} games.`);

// 3. real plays only (never the made-up demo ones)
const plays = db.prepare('SELECT * FROM plays WHERE demo = 0').all().map((p) => ({ id: p.id, game_id: p.game_id, result: JSON.parse(p.result), demo: false, created_at: iso(p.created_at) }));
if (plays.length) await call('POST', '/rest/v1/plays?on_conflict=id', JSON.stringify(plays), { 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates' });
console.log(`Copied ${plays.length} plays. Done!`);
