import { CROWD_MIN } from '../../../shared/meta.js';

// "34% same": how many people made the same call.
// Before anyone else has played, it says so instead of showing a lonely 100%.
// `during` = shown while playing, when the stats don't include this player yet.
export default function Same({ pct, stats, label = 'same', during = false }) {
  if (!stats || pct === undefined || pct === null) return null;
  if (stats.count < (during ? 1 : CROWD_MIN)) return <span className="same same-first">first pick!</span>;
  // a little personality for the extremes
  const vibe = pct === 0 ? 'nobody else!' : pct <= 10 ? 'rebel' : pct >= 80 ? 'crowd fave' : pct >= 50 ? 'popular' : null;
  return (
    <span className={`same ${pct >= 50 ? 'same-lots' : pct <= 15 ? 'same-few' : ''}`} title={`Out of ${stats.count.toLocaleString('en-US')} people`}>
      {pct}% {label}
      {vibe && <b> · {vibe}</b>}
    </span>
  );
}

export const crowdReady = (stats) => stats?.count >= CROWD_MIN;
// while playing, one earlier player is enough to compare with
export const crowdBefore = (stats) => stats?.count >= 1;

export function CrowdNote({ stats }) {
  if (!stats) return null;
  if (!crowdReady(stats)) return <p className="crowd-note">Nobody else has played yet. Share it and the percentages fill in as people answer.</p>;
  return <p className="crowd-note">Based on {stats.count.toLocaleString('en-US')} people so far (including you).</p>;
}
