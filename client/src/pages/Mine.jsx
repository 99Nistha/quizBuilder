import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FORMATS } from '../../../shared/meta.js';
import { api } from '../lib/api.js';
import { editKeys, editLink } from '../lib/editing.js';
import { plural, useTitle } from '../lib/util.js';

export default function Mine() {
  useTitle('My games');
  const [params] = useSearchParams();
  const [games, setGames] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const keys = editKeys.all();
    Promise.all(
      Object.keys(keys).map((slug) =>
        api
          .game(slug)
          .then((r) => r.game)
          .catch(() => null),
      ),
    ).then((list) => setGames(list.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt)));
  }, []);

  async function copy(slug) {
    const link = editLink(slug, editKeys.get(slug));
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt('Your private edit link:', link);
    }
    setCopied(slug);
    setTimeout(() => setCopied(''), 1800);
  }

  return (
    <div className="wrap narrow section">
      <h1 className="page-title">My games</h1>
      <p className="page-sub">Games made in this browser. To edit on another device, copy the private edit link and open it there.</p>
      {params.get('deleted') && <p className="callout">Deleted. It's gone for good.</p>}
      {games === null ? (
        <p className="loading">Loading…</p>
      ) : games.length ? (
        <ul className="mine-list">
          {games.map((g) => (
            <li key={g.slug}>
              <Link to={`/play/${g.slug}`} className="mine-title">
                {g.title}
              </Link>
              <span className="mine-meta">
                {FORMATS[g.type]?.name} · {plural(g.plays, 'play')}
              </span>
              <span className="mine-actions">
                <Link to={`/edit/${g.slug}`} className="btn btn-small btn-outline">
                  Edit
                </Link>
                <button className="link-btn" onClick={() => copy(g.slug)}>
                  {copied === g.slug ? 'Copied!' : 'Copy edit link'}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">
          Nothing yet. <Link to="/make">Make your first game →</Link>
        </p>
      )}
    </div>
  );
}
