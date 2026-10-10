import { BadInput, itemList, pct } from './util.js';

export default {
  validate(data) {
    return { items: itemList(data?.items, { min: 2, max: 8, label: 'options', maxLen: 80 }) };
  },

  validatePlay(data, result) {
    if (!data.items.some((i) => i.id === result?.pick)) throw new BadInput('Pick one of the options');
    return { pick: result.pick };
  },

  aggregate(data, results) {
    const votes = Object.fromEntries(data.items.map((i) => [i.id, 0]));
    for (const r of results) if (r.pick in votes) votes[r.pick] += 1;
    const count = results.length;
    return { count, items: data.items.map((i) => ({ id: i.id, votes: votes[i.id], pct: pct(votes[i.id], count) })) };
  },

  card(game, result, stats) {
    const item = (id) => game.data.items.find((i) => i.id === id);
    const label = (id) => item(id)?.label;
    if (!stats.count) return { kicker: 'Quick poll', layout: 'list', rows: game.data.items.map((i) => ({ label: i.label, image: i.image })) };
    const rows = [...stats.items].sort((a, b) => b.votes - a.votes).map((s) => ({ label: label(s.id), image: item(s.id)?.image, pct: s.pct, mine: s.id === result?.pick }));
    return { kicker: result ? `I voted. ${stats.count.toLocaleString('en-US')} votes so far` : `${stats.count.toLocaleString('en-US')} votes so far`, layout: 'bars', rows };
  },

  summary(game, result) {
    return `I voted ${game.data.items.find((i) => i.id === result.pick)?.label}. What about you?`;
  },
};
