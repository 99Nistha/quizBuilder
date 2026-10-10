import { Link } from 'react-router-dom';
import { FORMATS, categoryById } from '../../../shared/meta.js';
import { plural, swatch } from '../lib/util.js';

export default function GameTile({ game, rank }) {
  const fmt = FORMATS[game.type];
  return (
    <Link to={`/play/${game.slug}`} className="tile">
      <div className="tile-thumb" style={{ '--c': game.thumbs?.length ? fmt?.color : swatch(game.title) }}>
        {game.thumbs?.length ? (
          <div className={`collage collage-${game.thumbs.length}`}>
            {game.thumbs.map((src) => (
              <img key={src} src={src} alt="" loading="lazy" />
            ))}
          </div>
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
        {game.week !== undefined ? `${plural(game.week, 'play')} this week` : plural(game.plays, 'play')}
        <span className="dot">·</span>
        {categoryById(game.category)?.name}
      </p>
    </Link>
  );
}
