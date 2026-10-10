import { useEffect, useState } from 'react';
import ItemFace from '../components/ItemFace.jsx';
import ItemsEditor, { newItem } from '../components/ItemsEditor.jsx';
import { api } from '../lib/api.js';
import { n } from '../lib/util.js';

function Editor({ data, setData }) {
  return <ItemsEditor items={data.items} onChange={(items) => setData({ ...data, items })} min={2} max={8} noun="option" placeholder="e.g. Folklore" heading="The options" />;
}

function Player({ game, onDone, saving }) {
  const [pick, setPick] = useState(null);
  const pics = game.data.items.some((i) => i.image);

  function vote(id) {
    if (saving) return;
    setPick(id);
    onDone({ pick: id });
  }

  return (
    <div className={`poll ${pics ? 'poll-pics' : ''}`}>
      {game.data.items.map((item) => (
        <button key={item.id} className={`poll-option ${pick === item.id ? 'poll-on' : ''}`} onClick={() => vote(item.id)} disabled={saving}>
          {pics && <ItemFace item={item} size="pick" />}
          <span>{item.label}</span>
        </button>
      ))}
      <p className="hint center">Tap to vote. You'll see the results straight after.</p>
    </div>
  );
}

export function Bars({ items, mineId, labelOf, mineTag = 'your pick' }) {
  const max = Math.max(...items.map((i) => i.pct), 1);
  return (
    <ul className="bars">
      {[...items]
        .sort((a, b) => b.pct - a.pct)
        .map((s) => (
          <li key={s.id} className={s.id === mineId ? 'bar-mine' : ''}>
            <div className="bar-top">
              <span>
                {labelOf(s.id)}
                {s.id === mineId && <em> {mineTag}</em>}
              </span>
              <strong>{s.pct}%</strong>
            </div>
            <div className="bar-track">
              <span style={{ width: `${(s.pct / max) * 100}%` }} />
            </div>
          </li>
        ))}
    </ul>
  );
}

function Result({ game, result, stats: initial, yours }) {
  const [stats, setStats] = useState(initial);

  // Polls are live: keep the numbers moving while the page is open.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      api.game(game.slug).then((res) => setStats(res.stats)).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [game.slug]);

  const labelOf = (id) => game.data.items.find((i) => i.id === id)?.label;
  const mine = stats.items.find((i) => i.id === result.pick);
  const top = [...stats.items].sort((a, b) => b.votes - a.votes)[0];

  return (
    <section className="result">
      <h2 className="result-heading">{yours ? 'You voted' : 'They voted'}: {labelOf(result.pick)}</h2>
      <Bars items={stats.items} mineId={result.pick} labelOf={labelOf} />
      <p className="verdict">
        {stats.count < 3
          ? "You're one of the first votes in. Check back in a bit, the numbers update live."
          : top.id === result.pick
            ? `${yours ? "You're" : "They're"} with the majority. ${mine.pct}% agree.`
            : `${yours ? 'You' : 'They'} went against the grain. Only ${mine.pct}% picked that.`}{' '}
        <span className="live-dot">{n(stats.count)} votes, live</span>
      </p>
    </section>
  );
}

export default {
  blank: () => ({ items: [newItem(), newItem(), newItem()] }),
  check: (data) => (data.items.filter((i) => i.label.trim()).length < 2 ? 'A poll needs at least 2 options.' : null),
  makerHint: 'Ask one question, give a few options. Results update live, so it works great for streams.',
  titlePlaceholder: "What's the best Taylor Swift album?",
  shareText: (game, result) => `I voted ${game.data.items.find((i) => i.id === result.pick)?.label}. "${game.title}" Vote here:`,
  Editor,
  Player,
  Result,
};
