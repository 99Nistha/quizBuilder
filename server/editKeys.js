// Games have no accounts behind them, so each one gets a secret edit key.
// We only store a hash of it; whoever has the key can edit or delete the game.
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { db } from './db.js';

export const hashKey = (key) => crypto.createHash('sha256').update(String(key)).digest('hex');

export function newEditKey() {
  const key = nanoid(24);
  return { key, hash: hashKey(key) };
}

export function keyMatches(row, key) {
  if (!row?.edit_key_hash || typeof key !== 'string' || !key) return false;
  const a = Buffer.from(row.edit_key_hash, 'hex');
  const b = Buffer.from(hashKey(key), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// For games made before edit keys existed, or a lost key:
//   npm run edit-link -- <slug>
// Prints a fresh private edit link (any old key stops working).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  const row = slug && db.prepare('SELECT id, title FROM games WHERE slug = ?').get(slug);
  if (!row) {
    console.error(slug ? `No game with slug "${slug}"` : 'Usage: npm run edit-link -- <slug>');
    process.exit(1);
  }
  const { key, hash } = newEditKey();
  db.prepare('UPDATE games SET edit_key_hash = ? WHERE id = ?').run(hash, row.id);
  const base = (process.env.PUBLIC_URL || 'http://localhost:5317').replace(/\/$/, '');
  console.log(`Edit link for "${row.title}" (keep it private):\n${base}/edit/${slug}#${key}`);
}
