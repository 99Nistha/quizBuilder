import { CROWD_MIN } from '../meta.js';
import { BadInput, itemList, pct } from './util.js';

export default {
  validate(data) {
    return {
      items: itemList(data?.items, { min: 3, max: 12, label: 'things to rank' }),
      shuffle: data?.shuffle !== false,
    };
  },

  validatePlay(data, result) {
    const order = result?.order;
    const ids = data.items.map((i) => i.id);
    if (!Array.isArray(order) || order.length !== ids.length || new Set(order).size !== ids.length || !order.every((id) => ids.includes(id))) {
      throw new BadInput("That ranking doesn't add up");
    }
    return { order };
  },

  aggregate(data, results) {
    const n = data.items.length;
    const sums = Object.fromEntries(data.items.map((i) => [i.id, { sum: 0, top: 0, pos: Array(n).fill(0) }]));
    for (const r of results) {
      r.order.forEach((id, idx) => {
        if (!sums[id]) return;
        sums[id].sum += idx + 1;
        sums[id].pos[idx] += 1;
        if (idx === 0) sums[id].top += 1;
      });
    }
    const count = results.length;
    const items = data.items
      .map((i) => ({ id: i.id, avg: count ? sums[i.id].sum / count : null, top: sums[i.id].top, pos: sums[i.id].pos.map((c) => pct(c, count)) }))
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));
    return { count, items };
  },

  card(game, result, stats) {
    const item = (id) => game.data.items.find((i) => i.id === id);
    const row = (id) => ({ label: item(id)?.label ?? '?', image: item(id)?.image });
    if (result) {
      const posOf = Object.fromEntries(stats.items.map((i) => [i.id, i.pos]));
      return {
        kicker: stats.count >= CROWD_MIN ? 'My blind ranking (% who agreed)' : 'My blind ranking',
        layout: 'list',
        rows: result.order.map((id, i) => ({ ...row(id), right: stats.count >= CROWD_MIN ? `${posOf[id][i]}%` : '' })),
      };
    }
    if (stats.count >= CROWD_MIN) {
      return { kicker: `How ${stats.count.toLocaleString('en-US')} people ranked it`, layout: 'list', rows: stats.items.map((i) => row(i.id)) };
    }
    return { kicker: 'Blind ranking: can you do it?', layout: 'list', rows: game.data.items.map((i) => '???'), mystery: true };
  },

  summary(game, result) {
    const first = game.data.items.find((i) => i.id === result.order[0])?.label;
    return `My #1 was ${first}. Rank them blind and see how yours compares.`;
  },
};
