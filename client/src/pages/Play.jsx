import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FORMATS, categoryById, regionById } from '../../../shared/meta.js';
import ShareBox from '../components/ShareBox.jsx';
import { formatUI } from '../formats/index.js';
import { api } from '../lib/api.js';
import { editKeys, editLink } from '../lib/editing.js';
import { mine, n, plural, timeAgo, useAsync, useTitle } from '../lib/util.js';
import NotFound from './NotFound.jsx';

export function GameHeader({ game }) {
  const fmt = FORMATS[game.type];
  const cat = categoryById(game.category);
  return (
    <header className="game-head">
      <p className="game-kicker">
        <span className="pill" style={{ background: fmt.color }}>
          {fmt.name}
        </span>
        <Link to={`/browse/${cat.id}`} className="pill pill-outline">
          {cat.name}
        </Link>
        {game.region && game.region !== 'global' && (
          <Link to={`/browse?region=${game.region}`} className="pill pill-outline">
            {regionById(game.region)?.short}
          </Link>
        )}
      </p>
      <h1 className="game-title">{game.title}</h1>
      {game.blurb && <p className="game-blurb">{game.blurb}</p>}
      <p className="game-meta">
        {game.creator ? <>by {game.creator} · </> : null}
        {timeAgo(game.createdAt)} · {plural(game.plays, 'play')}
      </p>
    </header>
  );
}

export default function Play() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data, error } = useAsync(() => api.game(slug), [slug]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [round, setRound] = useState(0);
  useTitle(data?.game.title);

  if (error) return <NotFound />;
  if (!data) return <div className="wrap loading">Loading…</div>;

  const { game } = data;
  const ui = formatUI[game.type];
  const previous = mine.playOf(slug);
  const isNew = params.get('new') === '1';
  const myKey = editKeys.get(slug);
  const url = `${location.origin}/play/${game.slug}`;

  async function finish(result) {
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.play(slug, result);
      mine.add(slug, res.id);
      navigate(`/r/${res.id}`, { state: { justPlayed: true } });
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="wrap narrow play-page">
      {isNew && (
        <div className="callout callout-yay">
          <strong>It's live!</strong> Play it yourself first, then send the link around. Every result someone shares links back here.
          <ShareBox url={url} cardUrl={null} text={game.title} heading="Your link" />
          {myKey && (
            <p className="edit-note">
              <strong>Your private edit link</strong> (don't share this one, it lets anyone edit): <code>{editLink(slug, myKey)}</code>
              <br />
              This browser remembers it too. Find it any time under <Link to="/mine">My games</Link>.
            </p>
          )}
        </div>
      )}
      {params.get('saved') && <p className="callout callout-yay">Saved! Changes are live.</p>}
      {myKey && !isNew && (
        <p className="owner-bar">
          You made this. <Link to={`/edit/${slug}`}>Edit it</Link>
        </p>
      )}
      <GameHeader game={game} />
      {previous && !isNew && (
        <p className="callout">
          You've played this one. <Link to={`/r/${previous}`}>See your result</Link> or go again below.
        </p>
      )}
      {ui ? (
        <ui.Player key={round} game={game} stats={data.stats} onDone={finish} saving={saving} />
      ) : (
        <p className="empty">This game type isn't playable yet.</p>
      )}
      {saveError && (
        <p className="form-error">
          {saveError}{' '}
          <button className="link-btn" onClick={() => setRound((r) => r + 1)}>
            Start over
          </button>
        </p>
      )}
      <p className="play-foot">
        {game.plays ? `${plural(game.plays, 'person', 'people')} played this so far.` : 'Nobody has played this yet. You could be first.'} <Link to={`/make/${game.type}`}>Make your own {FORMATS[game.type].name.toLowerCase()} →</Link>
      </p>
    </div>
  );
}
