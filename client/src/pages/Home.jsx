import { Link } from 'react-router-dom';
import { formatList } from '../../../shared/meta.js';
import FormatArt from '../components/FormatArt.jsx';
import GameTile from '../components/GameTile.jsx';
import { api } from '../lib/api.js';
import { n, useAsync, useTitle } from '../lib/util.js';

// The real number of games finished in the last 7 days, plus what's actually hot.
function Pulse({ stats, top }) {
  if (!stats) return <div className="pulse pulse-loading" />;
  const n_ = stats.playsThisWeek;
  return (
    <div className="pulse">
      <span className="pulse-num">{n(n_)}</span>
      <span className="pulse-text">
        {n_ === 1 ? 'game' : 'games'} played this week.
        <br />
        {top ? (
          <>
            Most played right now: <Link to={`/play/${top.slug}`}>{top.title}</Link>
          </>
        ) : (
          'Early days. Make something and get the ball rolling.'
        )}
      </span>
    </div>
  );
}

export default function Home() {
  useTitle();
  const { data } = useAsync(() => api.home(), []);
  const trending = data?.trending?.length ? data.trending : data?.fresh ?? [];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <h1 className="hero-title">
              Make the quiz.
              <br />
              <span className="squiggle">Start the argument.</span>
            </h1>
            <p className="hero-sub">Blind rankings, tier lists, brackets, quizzes and more. Make one in a few minutes, send it to the group chat, watch the chaos.</p>
          </div>
          <Pulse stats={data?.stats} top={data?.trending?.[0]} />
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Make something</h2>
          <span className="section-note">Free, no account needed</span>
        </div>
        <div className="formats">
          {formatList().map((f) => (
            <Link key={f.id} to={`/make/${f.id}`} className="format" style={{ '--c': f.color }}>
              <FormatArt type={f.id} />
              <strong>{f.name}</strong>
              <span>{f.pitch}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>{data?.trending?.length ? 'Trending this week' : 'Fresh ones'}</h2>
          <Link to="/browse?sort=top" className="section-more">
            See more →
          </Link>
        </div>
        {data ? (
          trending.length ? (
            <div className="grid">
              {trending.map((g, i) => (
                <GameTile key={g.id} game={g} rank={data.trending.length ? i + 1 : undefined} />
              ))}
            </div>
          ) : (
            <p className="empty">
              Nothing here yet. <Link to="/make">Be the first →</Link>
            </p>
          )
        ) : (
          <div className="grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="tile tile-ghost" />
            ))}
          </div>
        )}
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>Browse by vibe</h2>
        </div>
        <div className="cats">
          {(data?.categories ?? []).map((c) => (
            <Link key={c.id} to={`/browse/${c.id}`} className="cat" style={{ '--c': c.color }}>
              <span className="cat-name">{c.name}</span>
              <span className="cat-count">{c.count ? (c.count === 1 ? '1 game' : `${n(c.count)} games`) : 'empty, go!'}</span>
            </Link>
          ))}
        </div>
      </section>

      {data?.trending?.length > 0 && data.fresh.length > 0 && (
        <section className="wrap section">
          <div className="section-head">
            <h2>Just made</h2>
            <Link to="/browse" className="section-more">
              All new →
            </Link>
          </div>
          <div className="grid">
            {data.fresh.slice(0, 4).map((g) => (
              <GameTile key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
