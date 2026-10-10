import { useEffect, useMemo, useState } from 'react';
import ItemFace from '../components/ItemFace.jsx';
import ItemsEditor, { newItem } from '../components/ItemsEditor.jsx';
import { shuffle } from '../lib/util.js';

function Editor({ data, setData }) {
  return (
    <>
      <ItemsEditor items={data.items} onChange={(items) => setData({ ...data, items })} min={3} max={12} noun="thing" placeholder="e.g. Pepperoni" heading="Things to rank" />
      <label className="toggle">
        <input type="checkbox" checked={data.shuffle} onChange={(e) => setData({ ...data, shuffle: e.target.checked })} />
        <span>Mix up the order for every player</span>
      </label>
    </>
  );
}

function Player({ game, onDone, saving }) {
  const queue = useMemo(() => (game.data.shuffle ? shuffle(game.data.items) : game.data.items), [game]);
  const [slots, setSlots] = useState(() => Array(queue.length).fill(null));
  const placed = slots.filter(Boolean).length;
  const current = queue[placed];
  const done = placed === queue.length;

  function place(i) {
    if (!current || slots[i]) return;
    setSlots((s) => s.map((v, j) => (j === i ? current : v)));
  }

  useEffect(() => {
    const onKey = (e) => {
      const k = Number(e.key === '0' ? 10 : e.key);
      if (k >= 1 && k <= slots.length) place(k - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="br">
      <div className="br-stage">
        {done ? (
          <div className="br-done">
            <strong>That's all of them.</strong>
            <span>No take-backs in blind ranking. That's the whole point.</span>
            <button className="btn btn-red btn-big" disabled={saving} onClick={() => onDone({ order: slots.map((s) => s.id) })}>
              {saving ? 'Saving…' : 'Lock it in'}
            </button>
          </div>
        ) : (
          <>
            <p className="br-count">
              {placed + 1} of {queue.length} · where does this go?
            </p>
            <ItemFace key={current.id} item={current} size="lg" className="br-current" />
          </>
        )}
      </div>
      <ol className="br-slots">
        {slots.map((item, i) => (
          <li key={i}>
            <button className={`br-slot ${item ? 'br-filled' : ''}`} onClick={() => place(i)} disabled={Boolean(item) || done}>
              <span className="br-n">{i + 1}</span>
              {item ? (
                <>
                  <ItemFace item={item} size="xs" />
                  <span className="br-label">{item.label}</span>
                </>
              ) : (
                <span className="br-empty">{done ? '' : 'put it here'}</span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Result({ game, result, stats, yours }) {
  const byId = Object.fromEntries(game.data.items.map((i) => [i.id, i]));
  const crowdRank = Object.fromEntries(stats.items.map((it, i) => [it.id, i + 1]));
  const enough = stats.count >= 3;

  let agreed = 0;
  let spicy = null;
  result.order.forEach((id, i) => {
    const diff = crowdRank[id] - (i + 1);
    if (diff === 0) agreed += 1;
    if (!spicy || Math.abs(diff) > Math.abs(spicy.diff)) spicy = { id, diff, mine: i + 1 };
  });

  return (
    <section className="result">
      <h2 className="result-heading">{yours ? 'Your ranking' : 'Their ranking'}</h2>
      <ol className="ranked">
        {result.order.map((id, i) => {
          const c = crowdRank[id];
          const diff = c - (i + 1);
          return (
            <li key={id} className="ranked-row">
              <span className="br-n">{i + 1}</span>
              <ItemFace item={byId[id]} size="xs" />
              <span className="ranked-label">{byId[id]?.label}</span>
              {enough && (
                <span className={`crowd ${diff === 0 ? 'crowd-same' : ''}`} title="Where everyone else put it, on average">
                  {diff === 0 ? 'same as crowd' : `crowd: #${c}`}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {enough ? (
        <div className="verdict">
          <p>
            <strong>
              {agreed} of {result.order.length}
            </strong>{' '}
            spots matched the crowd ({stats.count.toLocaleString('en-US')} rankings so far).
          </p>
          {spicy && Math.abs(spicy.diff) >= 2 && (
            <p>
              <strong>Hottest take:</strong> {byId[spicy.id].label} at #{spicy.mine}. Everyone else has it at #{crowdRank[spicy.id]}.
            </p>
          )}
        </div>
      ) : (
        <p className="verdict">You're one of the first to play this. Check back once a few more people have ranked it to see where you land.</p>
      )}
    </section>
  );
}

export default {
  blank: () => ({ items: [newItem(), newItem(), newItem(), newItem(), newItem()], shuffle: true }),
  check: (data) => (data.items.filter((i) => i.label.trim()).length < 3 ? 'Add at least 3 things to rank.' : null),
  makerHint: 'Players see one thing at a time and have to pick its spot before seeing the next. Chaos guaranteed.',
  titlePlaceholder: 'Blind rank these Pixar movies',
  shareText: (game, result) => `I blind ranked "${game.title}" and put ${game.data.items.find((i) => i.id === result.order[0])?.label} at #1. Your turn:`,
  Editor,
  Player,
  Result,
};
