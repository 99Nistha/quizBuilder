import { nanoid } from 'nanoid';

export class BadInput extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export function text(value, max, { field = 'text', required = true } = {}) {
  const v = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!v && required) throw new BadInput(`${field} can't be empty`);
  return v.slice(0, max);
}

// Images are either our own uploads or a plain https link.
export function image(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function itemList(items, { min, max, label = 'items', maxLen = 60 }) {
  if (!Array.isArray(items)) throw new BadInput(`Add some ${label}`);
  const out = items
    .map((it) => ({
      id: typeof it?.id === 'string' && /^[\w-]{1,24}$/.test(it.id) ? it.id : nanoid(8),
      label: text(it?.label, maxLen, { required: false }),
      image: image(it?.image),
    }))
    .filter((it) => it.label);
  if (out.length < min) throw new BadInput(`You need at least ${min} ${label}`);
  if (out.length > max) throw new BadInput(`That's a lot! Keep it to ${max} ${label}`);
  const ids = new Set(out.map((i) => i.id));
  if (ids.size !== out.length) throw new BadInput('Two items share the same id');
  return out;
}

export const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
