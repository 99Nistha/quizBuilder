// "This or that" and "would you rather" are the same game underneath:
// a list of two-way choices, and the fun is seeing how the crowd split.
import { nanoid } from 'nanoid';
import { CROWD_MIN } from '../../shared/meta.js';
import { BadInput, image, pct, text } from './util.js';

export function pairsFormat({ min = 3, max = 20, maxLen = 60, noun = 'pair', kicker, summaryVerb }) {
  const side = (s, field) => ({ label: text(s?.label, maxLen, { field }), image: image(s?.image) });

  return {
    validate(data) {
      if (!Array.isArray(data?.pairs)) throw new BadInput(`Add some ${noun}s`);
      const pairs = data.pairs
        .filter((p) => p?.a?.label?.trim() || p?.b?.label?.trim())
        .map((p, i) => ({
          id: typeof p.id === 'string' && /^[\w-]{1,24}$/.test(p.id) ? p.id : nanoid(8),
          a: side(p.a, `Option A in ${noun} ${i + 1}`),
          b: side(p.b, `Option B in ${noun} ${i + 1}`),
        }));
      if (pairs.length < min) throw new BadInput(`You need at least ${min} ${noun}s`);
      if (pairs.length > max) throw new BadInput(`Keep it to ${max} ${noun}s max`);
      if (new Set(pairs.map((p) => p.id)).size !== pairs.length) throw new BadInput('Two pairs share the same id');
      return { pairs };
    },

    validatePlay(data, result) {
      const picks = result?.picks;
      if (!picks || typeof picks !== 'object') throw new BadInput('No picks in there');
      const clean = {};
      for (const p of data.pairs) {
        if (picks[p.id] !== 'a' && picks[p.id] !== 'b') throw new BadInput('You skipped one');
        clean[p.id] = picks[p.id];
      }
      return { picks: clean };
    },

    aggregate(data, results) {
      const counts = Object.fromEntries(data.pairs.map((p) => [p.id, { a: 0, b: 0 }]));
      for (const r of results) for (const [id, side] of Object.entries(r.picks)) if (counts[id]) counts[id][side] += 1;
      return {
        count: results.length,
        pairs: Object.fromEntries(Object.entries(counts).map(([id, c]) => [id, { ...c, aPct: pct(c.a, c.a + c.b) }])),
      };
    },

    card(game, result, stats) {
      if (result) {
        return {
          kicker,
          layout: 'list',
          marks: 'checks',
          rows: game.data.pairs.slice(0, 10).map((p) => {
            const mine = result.picks[p.id];
            const s = stats.pairs[p.id];
            const share = mine === 'a' ? s.aPct : 100 - s.aPct;
            return { label: `${p[mine].label} over ${p[mine === 'a' ? 'b' : 'a'].label}`, image: p[mine].image, right: stats.count >= CROWD_MIN ? `${share}%` : '' };
          }),
        };
      }
      return {
        kicker: stats.count >= CROWD_MIN ? `${stats.count.toLocaleString('en-US')} people have picked` : 'Pick one. Then the next.',
        layout: 'list',
        marks: 'numbers',
        rows: game.data.pairs.slice(0, 10).map((p) => `${p.a.label}  or  ${p.b.label}`),
      };
    },

    summary(game, result) {
      const p = game.data.pairs[0];
      return `${summaryVerb} ${p[result.picks[p.id]].label}. What would you pick?`;
    },
  };
}
