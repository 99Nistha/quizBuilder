import { Link, useLocation, useParams } from 'react-router-dom';
import { FORMATS } from '../../../shared/meta.js';
import ShareBox from '../components/ShareBox.jsx';
import { formatUI } from '../formats/index.js';
import { api } from '../lib/api.js';
import { mine, useAsync, useTitle } from '../lib/util.js';
import NotFound from './NotFound.jsx';
import { GameHeader } from './Play.jsx';

export default function Result() {
  const { id } = useParams();
  const { state } = useLocation();
  const { data, error } = useAsync(() => api.result(id), [id]);
  useTitle(data?.game.title);

  if (error) return <NotFound />;
  if (!data) return <div className="wrap loading">Loading…</div>;

  const { game, result, stats } = data;
  const ui = formatUI[game.type];
  const yours = state?.justPlayed || mine.isMine(id);
  const url = `${location.origin}/r/${id}`;

  return (
    <div className="wrap narrow" style={{ '--fc': FORMATS[game.type].color }}>
      <GameHeader game={game} />
      {!yours && (
        <div className="callout callout-turn">
          <span>Someone sent you their result. Think you'd do it differently?</span>
          <Link to={`/play/${game.slug}`} className="btn btn-red">
            Your turn
          </Link>
        </div>
      )}
      <ui.Result game={game} result={result} stats={stats} yours={yours} />
      {yours && (
        <ShareBox url={url} cardUrl={`/card/r/${id}.png`} text={ui.shareText(game, result)} heading="Show everyone" />
      )}
      <div className="result-foot">
        {yours ? (
          <>
            <Link to={`/play/${game.slug}`} className="btn btn-outline">
              Play again
            </Link>
            <Link to={`/make/${game.type}`} className="btn btn-red">
              Make your own
            </Link>
          </>
        ) : (
          <Link to="/" className="btn btn-outline">
            See what else is on
          </Link>
        )}
      </div>
    </div>
  );
}
