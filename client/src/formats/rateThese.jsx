import { useEffect, useState } from 'react';
import ItemFace from '../components/ItemFace.jsx';
import ItemsEditor, { newItem } from '../components/ItemsEditor.jsx';
import Same, { CrowdNote, crowdReady } from '../components/Same.jsx';

const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function Editor({ data, setData }) {
  return <ItemsEditor items={data.items} onChange={(items) => setData({ ...data, items })} min={3} max={15} noun="thing" placeholder="e.g. Crocs" heading="Things to rate" />;
}

function Player({ game, onDone, saving }) {
  const { items } = game.data;
  const [i, setI] = useState(0);
  const [ratings, setRatings] = useState({});
  const item = items[i];

  function rate(v) {
    const next = { ...ratings, [item.id]: v };
    setRatings(next);
    setI(i + 1);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (!item) return;
      const v = e.key === '0' ? 10 : Number(e.key);
      if (v >= 1 && v <= 10) rate(v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!item) {
    return (
      <div className="br-stage">
        <div className="br-done">
          <strong>All rated.</strong>
          <span>Let's see if you're a harsh critic or a softie.</span>
          <button className="btn btn-red btn-big" disabled={saving} onClick={() => onDone({ ratings })}>
            {saving ? 'Saving…' : 'Show me'}
          </button>
          <button className="link-btn" onClick={() => setI(i - 1)}>
            ← change the last one
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rate">
      <p className="br-count center">
        {i + 1} of {items.length}
      </p>
      <div className="progress">
        <span style={{ width: `${(i / items.length) * 100}%` }} />
      </div>
      <div className="br-stage">
        <ItemFace key={item.id} item={item} size="lg" className="br-current" />
      </div>
      <div className="scale" role="group" aria-label="Your rating">
        {SCALE.map((v) => (
          <button key={v} className={`scale-btn ${ratings[item.id] === v ? 'on' : ''}`} onClick={() => rate(v)} style={{ '--h': `${(v - 1) * 13}` }}>
            {v}
          </button>
        ))}
      </div>
      <div className="scale-ends">
        <span>nope</span>
        <span>perfect</span>
      </div>
      {i > 0 && (
        <p className="center">
          <button className="link-btn" onClick={() => setI(i - 1)}>
            ← back
          </button>
        </p>
      )}
    </div>
  );
}

function Result({ game, result, stats, yours }) {
  const byId = Object.fromEntries(game.data.items.map((i) => [i.id, i]));
  const avg = Object.fromEntries(stats.items.map((s) => [s.id, s.avg]));
  const enough = crowdReady(stats);
  const scoresOf = Object.fromEntries(stats.items.map((s) => [s.id, s.scores]));
  const ids = Object.keys(result.ratings).sort((a, b) => result.ratings[b] - result.ratings[a]);
  const mean = (list) => list.reduce((s, x) => s + x, 0) / list.length;
  const diff = enough ? mean(ids.map((id) => result.ratings[id] - avg[id])) : 0;
  const fight = enough ? ids.reduce((best, id) => (Math.abs(result.ratings[id] - avg[id]) > Math.abs(result.ratings[best] - avg[best]) ? id : best), ids[0]) : null;

  return (
    <section className="result">
      <h2 className="result-heading">{yours ? 'Your ratings' : 'Their ratings'}</h2>
      <ul className="rated">
        {ids.map((id) => (
          <li key={id}>
            <ItemFace item={byId[id]} size="xs" />
            <span className="ranked-label">{byId[id].label}</span>
            <Same pct={scoresOf[id]?.[result.ratings[id]]} stats={stats} label={`gave ${result.ratings[id]}`} />
            {enough && <span className="crowd">avg {avg[id]}</span>}
            <span className="rated-score">{result.ratings[id]}</span>
          </li>
        ))}
      </ul>
      {enough ? (
        <div className="verdict">
          <p>
            {Math.abs(diff) < 0.5 ? (
              <>Right in line with everyone else. Very diplomatic.</>
            ) : diff < 0 ? (
              <>
                <strong>Tough crowd.</strong> {yours ? 'You' : 'They'} rated {Math.abs(diff).toFixed(1)} points lower than average.
              </>
            ) : (
              <>
                <strong>Big softie.</strong> {yours ? 'You' : 'They'} rated {diff.toFixed(1)} points higher than average.
              </>
            )}
          </p>
          {fight && Math.abs(result.ratings[fight] - avg[fight]) >= 2.5 && (
            <p>
              <strong>Biggest disagreement:</strong> {byId[fight].label}. {result.ratings[fight]}/10 vs the crowd's {avg[fight]}.
            </p>
          )}
        </div>
      ) : (
        <p className="verdict">You're the first! Once someone else rates these you'll see the averages and who gave the same scores.</p>
      )}
      <CrowdNote stats={stats} />
    </section>
  );
}

export default {
  blank: () => ({ items: Array.from({ length: 5 }, () => newItem()) }),
  check: (data) => (data.items.filter((i) => i.label.trim()).length < 3 ? 'Add at least 3 things to rate.' : null),
  makerHint: 'Players score each thing out of 10, then see how their scores stack up against everyone else.',
  titlePlaceholder: 'Rate these questionable fashion trends',
  shareText: (game) => `I rated everything in "${game.title}". Bet you disagree:`,
  Editor,
  Player,
  Result,
};
