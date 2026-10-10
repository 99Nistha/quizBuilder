// Talks to Supabase over plain HTTP. The database only exposes Playbee's own
// functions (see supabase/schema.sql), so the public key can't do anything else.
import { BRAND } from '../../../shared/brand.js';

const { url, anonKey } = BRAND.supabase;
const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

export const configured = Boolean(url && anonKey);

export async function rpc(fn, args = {}) {
  if (!configured) throw new Error('Playbee isn’t connected to its database yet (shared/brand.js → supabase).');
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // our own friendly messages come through as-is; anything else gets a generic one
    const msg = body?.message ?? '';
    throw new Error(msg && !/violates|syntax|permission|function/i.test(msg) ? msg : 'Something went wrong. Try again?');
  }
  return body;
}

export async function uploadPicture(blob, ext) {
  const name = `u/${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}.${ext}`;
  const res = await fetch(`${url}/storage/v1/object/pictures/${name}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': blob.type, 'cache-control': '31536000' },
    body: blob,
  });
  if (!res.ok) throw new Error('That picture didn’t upload. Try a smaller one?');
  return `${url}/storage/v1/object/public/pictures/${name}`;
}
