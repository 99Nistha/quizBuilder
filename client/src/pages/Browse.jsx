import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CATEGORIES, categoryById, formatList } from '../../../shared/meta.js';
import GameTile from '../components/GameTile.jsx';
import { api } from '../lib/api.js';
import { useTitle } from '../lib/util.js';

export default function Browse() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') === 'top' ? 'top' : 'new';
  const type = params.get('type') || '';
  const cat = categoryById(category);
  useTitle(cat ? cat.name : 'Browse');

  const [games, setGames] = useState(null);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);

  useEffect(() => {
    let live = true;
    const q = { sort, page };
    if (category) q.category = category;
    if (type) q.type = type;
    api.games(q).then((res) => {
      if (!live) return;
      setGames((g) => (page === 0 ? res.games : [...(g ?? []), ...res.games]));
      setMore(res.more);
    });
    return () => {
      live = false;
    };
  }, [category, sort, type, page]);

  useEffect(() => {
    setPage(0);
  }, [category, sort, type]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="wrap section">
      <h1 className="page-title" style={cat ? { color: cat.color } : undefined}>
        {cat ? cat.name : 'Everything'}
      </h1>
      <div className="browse-bar">
        <div className="cat-pick">
          <Link to={`/browse${params.size ? '?' + params : ''}`} className={`chip ${!cat ? 'chip-on' : ''}`}>
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/browse/${c.id}${params.size ? '?' + params : ''}`} className={`chip ${c.id === category ? 'chip-on' : ''}`} style={{ '--c': c.color }}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="browse-filters">
          <div className="seg">
            <button className={sort === 'new' ? 'on' : ''} onClick={() => setParam('sort', '')}>
              Newest
            </button>
            <button className={sort === 'top' ? 'on' : ''} onClick={() => setParam('sort', 'top')}>
              Most played
            </button>
          </div>
          <select value={type} onChange={(e) => setParam('type', e.target.value)} className="select" aria-label="Format">
            <option value="">All formats</option>
            {formatList().map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {games === null ? (
        <p className="loading">Loading…</p>
      ) : games.length ? (
        <>
          <div className="grid">
            {games.map((g) => (
              <GameTile key={g.id} game={g} />
            ))}
          </div>
          {more && (
            <p className="center">
              <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)}>
                Load more
              </button>
            </p>
          )}
        </>
      ) : (
        <p className="empty">
          Nothing in here yet. That's a gap in the market. <Link to="/make">Make the first one →</Link>
        </p>
      )}
    </div>
  );
}
