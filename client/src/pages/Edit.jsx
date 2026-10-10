import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { editKeys } from '../lib/editing.js';
import { useTitle } from '../lib/util.js';
import { GameForm } from './Create.jsx';

export default function Edit() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  useTitle(state.game ? `Edit: ${state.game.title}` : 'Edit');

  // The key comes from the private link (#key) or from this browser.
  const key = hash.slice(1) || editKeys.get(slug);

  useEffect(() => {
    if (!key) return setState({ error: 'nokey' });
    api
      .forEdit(slug, key)
      .then(({ game, locked }) => {
        editKeys.set(slug, key); // remember it so the link isn't needed next time
        if (hash) navigate(`/edit/${slug}`, { replace: true }); // don't leave the key in the address bar
        setState({ game, locked });
      })
      .catch((error) => setState({ error: error.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (state.loading) return <div className="wrap loading">Loading…</div>;
  if (state.error) {
    return (
      <div className="wrap narrow section">
        <h1 className="page-title">Can't edit this one</h1>
        <p className="page-sub">
          {state.error === 'nokey'
            ? "This browser doesn't have the edit key for this game. Open the private edit link you got when you made it."
            : state.error}
        </p>
        <Link to={`/play/${slug}`} className="btn btn-outline">
          Go to the game
        </Link>
      </div>
    );
  }

  async function save(game) {
    await api.update(slug, key, game);
    navigate(`/play/${slug}?saved=1`);
  }

  async function remove() {
    if (!window.confirm(`Delete "${state.game.title}"? This can't be undone, and its share links will stop working.`)) return;
    await api.remove(slug, key);
    editKeys.remove(slug);
    navigate('/mine?deleted=1');
  }

  return <GameForm type={state.game.type} initial={state.game} locked={state.locked} onSave={save} onDelete={remove} />;
}
