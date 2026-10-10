import { useEffect, useState } from 'react';
import ImagePicker from '../components/ImagePicker.jsx';
import ItemFace from '../components/ItemFace.jsx';
import { newItem } from '../components/ItemsEditor.jsx';

// Shared by "this or that" and "would you rather".
export function pairsFormat({ min, max, maxLen, noun, placeholders, prompt, big, ...copy }) {
  const newPair = () => ({ id: newItem().id, a: { label: '', image: null }, b: { label: '', image: null } });

  function Editor({ data, setData }) {
    const update = (id, side, patch) => setData({ ...data, pairs: data.pairs.map((p) => (p.id === id ? { ...p, [side]: { ...p[side], ...patch } } : p)) });
    const remove = (id) => setData({ ...data, pairs: data.pairs.filter((p) => p.id !== id) });
    const filled = data.pairs.filter((p) => p.a.label.trim() && p.b.label.trim()).length;

    return (
      <fieldset className="card-box">
        <legend className="card-legend">
          The {noun}s
          <span className={`count ${filled < min ? 'count-low' : ''}`}>
            {filled}/{max}
          </span>
        </legend>
        <ol className="pairs-edit">
          {data.pairs.map((p, i) => (
            <li key={p.id} className="pair-edit">
              <span className="item-n">{i + 1}</span>
              {['a', 'b'].map((side, j) => (
                <div key={side} className="pair-side">
                  {j === 1 && <span className="pair-or">or</span>}
                  <input
                    type="text"
                    className="q-input"
                    value={p[side].label}
                    maxLength={maxLen}
                    placeholder={i === 0 ? placeholders[j] : ''}
                    onChange={(e) => update(p.id, side, { label: e.target.value })}
                  />
                  <ImagePicker compact value={p[side].image} onChange={(image) => update(p.id, side, { image })} label="pic" />
                </div>
              ))}
              <button type="button" className="item-x" onClick={() => remove(p.id)} disabled={data.pairs.length <= min} aria-label="Remove">
                ×
              </button>
            </li>
          ))}
        </ol>
        {data.pairs.length < max && (
          <button type="button" className="btn btn-outline btn-small" onClick={() => setData({ ...data, pairs: [...data.pairs, newPair()] })}>
            + Add another
          </button>
        )}
        <p className="hint">
          {min} to {max} {noun}s.
        </p>
      </fieldset>
    );
  }

  function Option({ option, onPick, picked, share, reveal, disabled }) {
    return (
      <button className={`pick ${big ? 'pick-big' : ''} ${picked ? 'pick-on' : ''} ${reveal && !picked ? 'pick-off' : ''}`} onClick={onPick} disabled={disabled}>
        {option.image ? <ItemFace item={option} size="pick" /> : <span className="pick-text">{option.label}</span>}
        {reveal && <span className="pick-pct">{share}%</span>}
      </button>
    );
  }

  function Player({ game, stats, onDone, saving }) {
    const { pairs } = game.data;
    const [i, setI] = useState(0);
    const [picks, setPicks] = useState({});
    const [reveal, setReveal] = useState(false);
    const pair = pairs[i];
    const crowd = stats?.pairs?.[pair?.id];
    const canReveal = stats?.count >= 3 && crowd;
    const done = Object.keys(picks).length === pairs.length;

    useEffect(() => {
      if (!reveal) return;
      const t = setTimeout(next, 1300);
      return () => clearTimeout(t);
    });

    function next() {
      setReveal(false);
      setI((n) => n + 1);
    }

    function pick(side) {
      if (reveal || picks[pair.id]) return;
      setPicks((p) => ({ ...p, [pair.id]: side }));
      if (canReveal) setReveal(true);
      else setI((n) => n + 1);
    }

    if (done && !reveal) {
      return (
        <div className="br-stage">
          <div className="br-done">
            <strong>Done!</strong>
            <span>That's all {pairs.length}. Ready to see how you compare?</span>
            <button className="btn btn-red btn-big" disabled={saving} onClick={() => onDone({ picks })}>
              {saving ? 'Saving…' : 'Show me'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pairs-play">
        <p className="br-count">
          {i + 1} of {pairs.length}
          {prompt && <> · {prompt}</>}
        </p>
        <div className="progress">
          <span style={{ width: `${(i / pairs.length) * 100}%` }} />
        </div>
        <div className={`pick-row ${big ? 'pick-row-stack' : ''}`} key={pair.id}>
          <Option option={pair.a} onPick={() => pick('a')} picked={picks[pair.id] === 'a'} share={crowd?.aPct} reveal={reveal} />
          <span className="pick-vs">or</span>
          <Option option={pair.b} onPick={() => pick('b')} picked={picks[pair.id] === 'b'} share={100 - (crowd?.aPct ?? 0)} reveal={reveal} />
        </div>
        {reveal && (
          <p className="center">
            <button className="link-btn" onClick={next}>
              next →
            </button>
          </p>
        )}
      </div>
    );
  }

  function Result({ game, result, stats, yours }) {
    const enough = stats.count >= 3;
    let withMajority = 0;
    let lonely = null;
    for (const p of game.data.pairs) {
      const mine = result.picks[p.id];
      const share = mine === 'a' ? stats.pairs[p.id].aPct : 100 - stats.pairs[p.id].aPct;
      if (share >= 50) withMajority += 1;
      if (!lonely || share < lonely.share) lonely = { p, mine, share };
    }

    return (
      <section className="result">
        <h2 className="result-heading">{yours ? 'Your picks' : 'Their picks'}</h2>
        <ul className="split-list">
          {game.data.pairs.map((p) => {
            const mine = result.picks[p.id];
            const aPct = stats.pairs[p.id].aPct;
            return (
              <li key={p.id} className="split">
                <div className="split-labels">
                  <span className={mine === 'a' ? 'split-mine' : ''}>{p.a.label}</span>
                  <span className={mine === 'b' ? 'split-mine' : ''}>{p.b.label}</span>
                </div>
                {enough ? (
                  <div className="split-bar" aria-label={`${aPct}% vs ${100 - aPct}%`}>
                    <span className={mine === 'a' ? 'on' : ''} style={{ width: `${Math.max(aPct, 8)}%` }}>
                      {aPct}%
                    </span>
                    <span className={mine === 'b' ? 'on' : ''} style={{ width: `${Math.max(100 - aPct, 8)}%` }}>
                      {100 - aPct}%
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {enough ? (
          <div className="verdict">
            <p>
              <strong>
                {withMajority} of {game.data.pairs.length}
              </strong>{' '}
              times you went with the majority.
            </p>
            {lonely && lonely.share < 40 && (
              <p>
                <strong>Rarest pick:</strong> {lonely.p[lonely.mine].label}. Only {lonely.share}% agreed.
              </p>
            )}
          </div>
        ) : (
          <p className="verdict">You're one of the first here, so there's no crowd to compare with yet. Check back soon.</p>
        )}
      </section>
    );
  }

  return {
    blank: () => ({ pairs: [newPair(), newPair(), newPair()] }),
    check: (data) => (data.pairs.filter((p) => p.a.label.trim() && p.b.label.trim()).length < min ? `Fill in at least ${min} ${noun}s (both sides).` : null),
    Editor,
    Player,
    Result,
    ...copy,
  };
}
