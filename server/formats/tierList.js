import { CROWD_MIN } from '../../shared/meta.js';
import { BadInput, itemList, pct, text } from './util.js';

export const DEFAULT_TIERS = ['S', 'A', 'B', 'C', 'D'];

function crowdTiers(data, stats) {
  return data.tiers.map((tier, t) => ({ tier, items: stats.items.filter((i) => i.tier === t).map((i) => data.items.find((x) => x.id === i.id).label) }));
}

export default {
  validate(data) {
    const tiers = (Array.isArray(data?.tiers) ? data.tiers : DEFAULT_TIERS).map((t) => text(t, 12, { required: false })).filter(Boolean);
    if (tiers.length < 3 || tiers.length > 6) throw new BadInput('Use between 3 and 6 tiers');
    return { tiers, items: itemList(data?.items, { min: 4, max: 24, label: 'things to sort' }) };
  },

  validatePlay(data, result) {
    const given = result?.tiers ?? {};
    const tiers = {};
    for (const item of data.items) {
      const t = given[item.id];
      if (!Number.isInteger(t) || t < 0 || t >= data.tiers.length) throw new BadInput('Put every item in a tier first');
      tiers[item.id] = t;
    }
    return { tiers };
  },

  aggregate(data, results) {
    const count = results.length;
    const items = data.items.map((item) => {
      let sum = 0;
      const per = Array(data.tiers.length).fill(0);
      for (const r of results) {
        const t = r.tiers[item.id] ?? 0;
        sum += t;
        if (per[t] !== undefined) per[t] += 1;
      }
      const avg = count ? sum / count : null;
      return { id: item.id, avg, tier: count ? Math.min(data.tiers.length - 1, Math.round(avg)) : null, tiers: per.map((c) => pct(c, count)) };
    });
    return { count, items };
  },

  card(game, result, stats) {
    const { data } = game;
    if (result) {
      const rows = data.tiers.map((tier, t) => ({ tier, items: data.items.filter((i) => result.tiers[i.id] === t).map((i) => i.label) }));
      return { kicker: 'My tier list', layout: 'tiers', rows };
    }
    if (stats.count >= CROWD_MIN) return { kicker: `The crowd's tier list (${stats.count.toLocaleString('en-US')} people)`, layout: 'tiers', rows: crowdTiers(data, stats) };
    return { kicker: 'Make your tier list', layout: 'tiers', rows: data.tiers.map((tier, t) => ({ tier, items: t === 0 ? ['?'] : [] })) };
  },

  summary(game, result) {
    const top = game.data.items.filter((i) => result.tiers[i.id] === 0).map((i) => i.label);
    return top.length ? `${top.slice(0, 3).join(', ')} made my ${game.data.tiers[0]} tier. Agree?` : `My ${game.data.tiers[0]} tier is empty. Nobody deserved it.`;
  },
};
