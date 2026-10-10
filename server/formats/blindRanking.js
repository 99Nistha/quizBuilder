import { BadInput, itemList } from './util.js';

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
    const sums = Object.fromEntries(data.items.map((i) => [i.id, { sum: 0, top: 0 }]));
    for (const r of results) {
      r.order.forEach((id, idx) => {
        if (!sums[id]) return;
        sums[id].sum += idx + 1;
        if (idx === 0) sums[id].top += 1;
      });
    }
    const count = results.length;
    const items = data.items
      .map((i) => ({ id: i.id, avg: count ? sums[i.id].sum / count : null, top: sums[i.id].top }))
      .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));
    return { count, items };
  },

  card(game, result, stats) {
    const label = (id) => game.data.items.find((i) => i.id === id)?.label ?? '?';
    if (result) {
      return { kicker: 'My blind ranking', layout: 'list', rows: result.order.map(label) };
    }
    if (stats.count >= 3) {
      return { kicker: `How ${stats.count.toLocaleString('en-US')} people ranked it`, layout: 'list', rows: stats.items.map((i) => label(i.id)) };
    }
    return { kicker: 'Blind ranking: can you do it?', layout: 'list', rows: game.data.items.map((i) => '???'), mystery: true };
  },

  summary(game, result) {
    const first = game.data.items.find((i) => i.id === result.order[0])?.label;
    return `My #1 was ${first}. Rank them blind and see how yours compares.`;
  },
};
