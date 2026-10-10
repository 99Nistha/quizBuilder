import { CROWD_MIN } from '../../../shared/meta.js';

// "34% same": how many people made the same call. Hidden until someone else has played.
export default function Same({ pct, stats, label = 'same' }) {
  if (!stats || stats.count < CROWD_MIN || pct === undefined || pct === null) return null;
  return (
    <span className={`same ${pct >= 50 ? 'same-lots' : pct <= 15 ? 'same-few' : ''}`} title={`Out of ${stats.count.toLocaleString('en-US')} people`}>
      {pct}% {label}
    </span>
  );
}

export const crowdReady = (stats) => stats?.count >= CROWD_MIN;

export function CrowdNote({ stats }) {
  if (!crowdReady(stats)) return null;
  return <p className="crowd-note">Based on {stats.count.toLocaleString('en-US')} people so far (including you).</p>;
}
