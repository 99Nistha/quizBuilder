import { Fragment, useMemo, useState } from 'react';
import ItemFace from '../components/ItemFace.jsx';
import ItemsEditor, { newItem } from '../components/ItemsEditor.jsx';
import { shuffle } from '../lib/util.js';
import { CrowdNote, crowdReady } from '../components/Same.jsx';
import { Bars } from './poll.jsx';

const roundName = (size) => ({ 2: 'Final', 4: 'Semifinals', 8: 'Quarterfinals' })[size] ?? `Round of ${size}`;

function Editor({ data, setData }) {
  const filled = data.items.filter((i) => i.label.trim()).length;
  return (
    <>
      <ItemsEditor items={data.items} onChange={(items) => setData({ ...data, items })} min={4} max={16} noun="contender" placeholder="e.g. Bohemian Rhapsody" heading="Contenders" />
      <p className={`hint maker-tip ${[4, 8, 16].includes(filled) ? '' : 'count-low'}`}>
        Brackets need exactly 4, 8 or 16. You've got {filled}.
      </p>
      <label className="toggle">
        <input type="checkbox" checked={data.shuffle} onChange={(e) => setData({ ...data, shuffle: e.target.checked })} />
        <span>Random matchups for every player (otherwise it goes 1 vs 2, 3 vs 4…)</span>
      </label>
    </>
  );
}

function Player({ game, onDone, saving }) {
  const byId = useMemo(() => Object.fromEntries(game.data.items.map((i) => [i.id, i])), [game]);
  const [rounds, setRounds] = useState(() => [(game.data.shuffle ? shuffle(game.data.items) : game.data.items).map((i) => i.id)]);
  const current = rounds[rounds.length - 1];
  const [winners, setWinners] = useState([]);
  const done = current.length === 1;
  const match = winners.length;
  const a = current[match * 2];
  const b = current[match * 2 + 1];

  function pick(id) {
    const next = [...winners, id];
    if (next.length === current.length / 2) {
      setRounds([...rounds, next]);
      setWinners([]);
    } else setWinners(next);
  }

  if (done) {
    return (
      <div className="br-stage">
        <div className="br-done">
          <span className="crown" aria-hidden>
            ♛
          </span>
          <strong>{byId[current[0]].label} wins it all</strong>
          <span>Happy with that?</span>
          <button className="btn btn-red btn-big" disabled={saving} onClick={() => onDone({ rounds })}>
            {saving ? 'Saving…' : 'Crown them'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pairs-play">
      <p className="br-count">
        <strong>{roundName(current.length)}</strong>
        {current.length > 2 && (
          <>
            {' '}
            · match {match + 1} of {current.length / 2}
          </>
        )}
      </p>
      <div className="pick-row" key={`${rounds.length}-${match}`}>
        {[a, b].map((id, j) => (
          <Fragment key={id}>
            {j === 1 && <span className="pick-vs">vs</span>}
            <button className="pick" onClick={() => pick(id)}>
              {byId[id].image ? <ItemFace item={byId[id]} size="pick" /> : <span className="pick-text">{byId[id].label}</span>}
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function BracketView({ rounds, byId }) {
  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {rounds.slice(0, -1).map((round, r) => (
          <div key={r} className="bracket-col">
            <span className="bracket-round">{roundName(round.length)}</span>
            {Array.from({ length: round.length / 2 }, (_, m) => (
              <div key={m} className="bracket-match">
                {[round[m * 2], round[m * 2 + 1]].map((id) => (
                  <span key={id} className={rounds[r + 1][m] === id ? 'won' : 'lost'}>
                    {byId[id]?.label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div className="bracket-col bracket-champ">
          <span className="bracket-round">Champion</span>
          <div className="bracket-match">
            <span className="won">♛ {byId[rounds[rounds.length - 1][0]]?.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Result({ game, result, stats, yours }) {
  const byId = Object.fromEntries(game.data.items.map((i) => [i.id, i]));
  const champ = byId[result.rounds[result.rounds.length - 1][0]];
  const share = stats.items.find((s) => s.id === champ.id)?.pct;
  return (
    <section className="result">
      <p className="you-got">{yours ? 'Your champion' : 'Their champion'}</p>
      <div className="outcome">
        {champ.image && <img src={champ.image} alt="" />}
        <h2 className="outcome-name">{champ.label}</h2>
      </div>
      <BracketView rounds={result.rounds} byId={byId} />
      {crowdReady(stats) ? (
        <>
          <p className="verdict">
            <strong>{share}%</strong> of people crowned {champ.label} too.
          </p>
          <h3 className="sub-heading">Who everyone else crowned</h3>
          <Bars items={stats.items.filter((s) => s.votes > 0)} mineId={champ.id} mineTag={yours ? 'yours' : 'theirs'} labelOf={(id) => byId[id]?.label} />
        </>
      ) : (
        <p className="verdict">You're the first to finish this bracket! Once others do, you'll see who the crowd crowns.</p>
      )}
      <CrowdNote stats={stats} />
    </section>
  );
}

export default {
  blank: () => ({ items: Array.from({ length: 8 }, () => newItem()), shuffle: true }),
  check: (data) => {
    const n = data.items.filter((i) => i.label.trim()).length;
    return [4, 8, 16].includes(n) ? null : `Brackets need exactly 4, 8 or 16 contenders. You have ${n}.`;
  },
  makerHint: 'Head to head, winner goes through, until one is left standing. Perfect for "best song" debates.',
  titlePlaceholder: 'Best Beyoncé song: the bracket',
  shareText: (game, result) => `My champion of "${game.title}": ${game.data.items.find((i) => i.id === result.rounds[result.rounds.length - 1][0])?.label}. Who wins yours?`,
  Editor,
  Player,
  Result,
};
