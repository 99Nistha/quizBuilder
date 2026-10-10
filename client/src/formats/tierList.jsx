import { useMemo, useState } from 'react';
import ItemFace from '../components/ItemFace.jsx';
import ItemsEditor, { newItem } from '../components/ItemsEditor.jsx';
import Same, { CrowdNote, crowdReady } from '../components/Same.jsx';
import { shuffle } from '../lib/util.js';

const TIER_COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#8ce99a', '#74c0fc', '#b197fc'];
const DEFAULT_TIERS = ['S', 'A', 'B', 'C', 'D'];

function Editor({ data, setData }) {
  const setTier = (i, value) => setData({ ...data, tiers: data.tiers.map((t, j) => (j === i ? value : t)) });
  return (
    <>
      <ItemsEditor items={data.items} onChange={(items) => setData({ ...data, items })} min={4} max={24} noun="thing" placeholder="e.g. Shrek 2" heading="Things to sort" />
      <fieldset className="card-box">
        <legend className="card-legend">Tiers</legend>
        <div className="tier-names">
          {data.tiers.map((t, i) => (
            <input key={i} value={t} maxLength={12} onChange={(e) => setTier(i, e.target.value)} style={{ background: TIER_COLORS[i] }} aria-label={`Tier ${i + 1} name`} />
          ))}
          {data.tiers.length < 6 && (
            <button type="button" className="chip" onClick={() => setData({ ...data, tiers: [...data.tiers, 'F'] })}>
              + tier
            </button>
          )}
          {data.tiers.length > 3 && (
            <button type="button" className="chip" onClick={() => setData({ ...data, tiers: data.tiers.slice(0, -1) })}>
              − tier
            </button>
          )}
        </div>
        <p className="hint">Classic S to D works, or go with something like "Iconic / Fine / Who?".</p>
      </fieldset>
    </>
  );
}

export function TierBoard({ tiers, items, placement, selected, onTier, onItem, dropProps }) {
  return (
    <div className="tiers">
      {tiers.map((tier, t) => (
        <div key={t} className={`tier ${onTier && selected ? 'tier-target' : ''}`} onClick={() => onTier?.(t)} {...(dropProps?.(t) ?? {})}>
          <span className="tier-label" style={{ background: TIER_COLORS[t] }}>
            {tier}
          </span>
          <div className="tier-items">
            {items
              .filter((i) => placement[i.id] === t)
              .map((i) => (
                <button
                  key={i.id}
                  type="button"
                  className={`tier-chip ${selected === i.id ? 'tier-chip-on' : ''}`}
                  onClick={(e) => {
                    if (!onItem) return;
                    e.stopPropagation();
                    onItem(i.id);
                  }}
                  draggable={Boolean(onItem)}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', i.id)}
                  title={i.label}
                >
                  <ItemFace item={i} size="tier" />
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Player({ game, onDone, saving }) {
  const { tiers } = game.data;
  const items = useMemo(() => shuffle(game.data.items), [game]);
  const [placement, setPlacement] = useState({});
  const [selected, setSelected] = useState(items[0]?.id);
  const pool = items.filter((i) => placement[i.id] === undefined);

  function place(t, id = selected) {
    if (!id) return;
    const next = { ...placement, [id]: t };
    setPlacement(next);
    setSelected(items.find((i) => next[i.id] === undefined)?.id ?? null);
  }

  const dropProps = (t) => ({
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => {
      e.preventDefault();
      place(t, e.dataTransfer.getData('text/plain'));
    },
  });

  return (
    <div className="tierplay">
      <p className="br-count center">{pool.length ? 'Tap a tier to drop the highlighted one in. Tap anything placed to move it.' : 'All sorted. Tap one to move it, or lock it in.'}</p>
      <TierBoard tiers={tiers} items={items} placement={placement} selected={selected} onTier={place} onItem={(id) => setSelected(id === selected ? null : id)} dropProps={dropProps} />
      {pool.length > 0 ? (
        <div className="pool">
          {pool.map((i) => (
            <button key={i.id} type="button" className={`tier-chip ${selected === i.id ? 'tier-chip-on' : ''}`} onClick={() => setSelected(i.id)} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', i.id)}>
              <ItemFace item={i} size="tier" />
            </button>
          ))}
        </div>
      ) : (
        <p className="center">
          <button className="btn btn-red btn-big" disabled={saving} onClick={() => onDone({ tiers: placement })}>
            {saving ? 'Saving…' : 'Lock it in'}
          </button>
        </p>
      )}
    </div>
  );
}

function Result({ game, result, stats, yours }) {
  const { tiers, items } = game.data;
  const enough = crowdReady(stats);
  const tiersOf = Object.fromEntries(stats.items.map((s) => [s.id, s.tiers]));
  const crowd = Object.fromEntries(stats.items.map((s) => [s.id, s.tier]));
  const avg = Object.fromEntries(stats.items.map((s) => [s.id, s.avg]));
  const takes = enough
    ? items
        .map((i) => ({ i, diff: result.tiers[i.id] - avg[i.id] }))
        .filter((x) => Math.abs(x.diff) >= 1.2)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
        .slice(0, 2)
    : [];

  return (
    <section className="result">
      <h2 className="result-heading">{yours ? 'Your tier list' : 'Their tier list'}</h2>
      <TierBoard tiers={tiers} items={items} placement={result.tiers} />
      {enough ? (
        <>
          {takes.length > 0 && (
            <div className="verdict">
              {takes.map(({ i, diff }) => (
                <p key={i.id}>
                  <strong>Hot take:</strong> {i.label} in {tiers[result.tiers[i.id]]}. Most people put it {diff < 0 ? 'lower' : 'higher'}, around {tiers[crowd[i.id]]}.
                </p>
              ))}
            </div>
          )}
          <h3 className="sub-heading">Who agreed with you</h3>
          <ul className="agree-list">
            {[...items]
              .sort((x, y) => result.tiers[x.id] - result.tiers[y.id])
              .map((i) => (
                <li key={i.id}>
                  <span className="agree-tier">{tiers[result.tiers[i.id]]}</span>
                  <span className="ranked-label">{i.label}</span>
                  <Same pct={tiersOf[i.id]?.[result.tiers[i.id]]} stats={stats} label="same tier" />
                </li>
              ))}
          </ul>
          <h3 className="sub-heading">Everyone's tier list ({stats.count.toLocaleString('en-US')} people)</h3>
          <TierBoard tiers={tiers} items={items} placement={crowd} />
        </>
      ) : (
        <p className="verdict">You're the first! Once someone else sorts these, you'll see what % put each one in the same tier as you.</p>
      )}
      <CrowdNote stats={stats} />
    </section>
  );
}

export default {
  blank: () => ({ tiers: [...DEFAULT_TIERS], items: Array.from({ length: 6 }, () => newItem()) }),
  check: (data) => {
    if (data.items.filter((i) => i.label.trim()).length < 4) return 'Add at least 4 things to sort.';
    if (data.tiers.some((t) => !t.trim())) return 'Give every tier a name.';
    return null;
  },
  makerHint: 'Give people a pile of things and some tiers. They sort, you all argue. Pictures make these way more fun.',
  titlePlaceholder: 'Tier list: every Shrek character',
  shareText: (game) => `Here's my tier list for "${game.title}". Fight me:`,
  Editor,
  Player,
  Result,
};
