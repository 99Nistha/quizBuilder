import { Link } from 'react-router-dom';
import { FORMATS, categoryById } from '../../../shared/meta.js';
import { n, swatch } from '../lib/util.js';

export default function GameTile({ game, rank }) {
  const fmt = FORMATS[game.type];
  return (
    <Link to={`/play/${game.slug}`} className="tile">
      <div className="tile-thumb" style={{ '--c': game.thumb ? fmt?.color : swatch(game.title) }}>
        {game.thumb ? (
          <img src={game.thumb} alt="" loading="lazy" />
        ) : (
          <span className="tile-peek" aria-hidden>
            {(game.peek?.length ? game.peek : [fmt?.name]).map((label, i) => (
              <span key={i} className="sticker">
                {label}
              </span>
            ))}
          </span>
        )}
        {rank && <span className="tile-rank">#{rank}</span>}
        <span className="tile-badge" style={{ background: fmt?.color }}>
          {fmt?.name ?? game.type}
        </span>
      </div>
      <h3 className="tile-title">{game.title}</h3>
      <p className="tile-meta">
        {game.week !== undefined ? `${n(game.week)} plays this week` : `${n(game.plays)} plays`}
        <span className="dot">·</span>
        {categoryById(game.category)?.name}
      </p>
    </Link>
  );
}
