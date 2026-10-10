import { BadInput, itemList, pct } from './util.js';

export const roundName = (size) => ({ 2: 'Final', 4: 'Semifinals', 8: 'Quarterfinals' })[size] ?? `Round of ${size}`;

export default {
  validate(data) {
    const items = itemList(data?.items, { min: 4, max: 16, label: 'contenders' });
    if (![4, 8, 16].includes(items.length)) throw new BadInput('Brackets need exactly 4, 8 or 16 contenders');
    return { items, shuffle: data?.shuffle !== false };
  },

  // rounds[0] is the seeding, every later round is the winners of the one before.
  validatePlay(data, result) {
    const rounds = result?.rounds;
    const ids = data.items.map((i) => i.id);
    if (!Array.isArray(rounds) || !Array.isArray(rounds[0])) throw new BadInput('That bracket is incomplete');
    const seed = rounds[0];
    if (seed.length !== ids.length || new Set(seed).size !== ids.length || !seed.every((id) => ids.includes(id))) throw new BadInput('That bracket is off');
    if (!data.shuffle && seed.some((id, i) => id !== ids[i])) throw new BadInput('That bracket is off');
    for (let r = 1; r < rounds.length; r++) {
      const prev = rounds[r - 1];
      const cur = rounds[r];
      if (!Array.isArray(cur) || cur.length !== prev.length / 2) throw new BadInput('That bracket is incomplete');
      cur.forEach((id, m) => {
        if (id !== prev[m * 2] && id !== prev[m * 2 + 1]) throw new BadInput('That bracket is off');
      });
    }
    if (rounds[rounds.length - 1].length !== 1) throw new BadInput('That bracket is incomplete');
    return { rounds };
  },

  aggregate(data, results) {
    const champs = Object.fromEntries(data.items.map((i) => [i.id, 0]));
    for (const r of results) {
      const c = r.rounds[r.rounds.length - 1][0];
      if (c in champs) champs[c] += 1;
    }
    const count = results.length;
    return { count, items: data.items.map((i) => ({ id: i.id, votes: champs[i.id], pct: pct(champs[i.id], count) })) };
  },

  card(game, result, stats) {
    const item = (id) => game.data.items.find((i) => i.id === id);
    const label = (id) => item(id)?.label;
    if (result) {
      const { rounds } = result;
      const champ = rounds[rounds.length - 1][0];
      // who the champ beat on the way, latest round first
      const beaten = [];
      for (let r = rounds.length - 2; r >= 0 && beaten.length < 3; r--) {
        const idx = rounds[r].indexOf(champ);
        beaten.push(label(rounds[r][idx % 2 ? idx - 1 : idx + 1]));
      }
      const share = stats.items.find((i) => i.id === champ)?.pct;
      return {
        kicker: stats.count >= 5 ? `My champion (${share}% agree)` : 'My champion',
        layout: 'big',
        big: label(champ),
        image: item(champ)?.image,
        sub: `Beat ${beaten[0]} in the final${beaten[1] ? `, ${beaten[1]} in the semis` : ''}${beaten[2] ? ` and ${beaten[2]} before that` : ''}.`,
      };
    }
    if (stats.count >= 5) {
      const rows = [...stats.items].sort((a, b) => b.votes - a.votes).slice(0, 5).map((s) => ({ label: label(s.id), image: item(s.id)?.image, pct: s.pct }));
      return { kicker: 'Who people crowned', layout: 'bars', rows };
    }
    return { kicker: `${game.data.items.length}-way knockout`, layout: 'list', marks: 'checks', rows: game.data.items.slice(0, 8).map((i) => ({ label: i.label, image: i.image })) };
  },

  summary(game, result) {
    const champ = result.rounds[result.rounds.length - 1][0];
    return `My champion: ${game.data.items.find((i) => i.id === champ)?.label}. Who wins yours?`;
  },
};
