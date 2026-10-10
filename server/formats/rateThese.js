import { BadInput, itemList } from './util.js';

const round1 = (n) => Math.round(n * 10) / 10;

export default {
  validate(data) {
    return { items: itemList(data?.items, { min: 3, max: 15, label: 'things to rate' }) };
  },

  validatePlay(data, result) {
    const given = result?.ratings ?? {};
    const ratings = {};
    for (const item of data.items) {
      const v = given[item.id];
      if (!Number.isInteger(v) || v < 1 || v > 10) throw new BadInput('Rate everything from 1 to 10');
      ratings[item.id] = v;
    }
    return { ratings };
  },

  aggregate(data, results) {
    const count = results.length;
    return {
      count,
      items: data.items.map((item) => ({ id: item.id, avg: count ? round1(results.reduce((s, r) => s + (r.ratings[item.id] ?? 0), 0) / count) : null })),
    };
  },

  card(game, result, stats) {
    const item = (id) => game.data.items.find((i) => i.id === id);
    const label = (id) => item(id)?.label;
    if (result) {
      const rows = Object.entries(result.ratings)
        .sort((a, b) => b[1] - a[1])
        .map(([id, v]) => ({ label: label(id), image: item(id)?.image, right: `${v}/10` }));
      return { kicker: 'My ratings', layout: 'list', rows };
    }
    if (stats.count >= 3) {
      const rows = [...stats.items].sort((a, b) => b.avg - a.avg).map((s) => ({ label: label(s.id), image: item(s.id)?.image, right: `${s.avg}` }));
      return { kicker: `Average ratings from ${stats.count.toLocaleString('en-US')} people`, layout: 'list', rows };
    }
    return { kicker: 'Rate these out of 10', layout: 'list', marks: 'checks', rows: game.data.items.map((i) => ({ label: i.label, image: i.image })) };
  },

  summary(game, result) {
    const [id, v] = Object.entries(result.ratings).sort((a, b) => b[1] - a[1])[0];
    return `${game.data.items.find((i) => i.id === id)?.label} got a ${v}/10 from me. How would you rate them?`;
  },
};
