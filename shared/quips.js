// What we say about a trivia score. Shared so the card and the page agree.
export function scoreQuip(score, total) {
  const p = total ? score / total : 0;
  if (p === 1) return 'Flawless. Suspiciously flawless.';
  if (p >= 0.8) return 'Okay, show-off.';
  if (p >= 0.6) return 'Solid. Respectable. Not legendary.';
  if (p >= 0.4) return 'Middle of the pack. It happens.';
  if (p >= 0.2) return "Rough one. We won't tell anyone.";
  return 'Did you… read the questions?';
}

// Share of other players who scored lower.
export function beatPct(dist, score, count) {
  if (!count) return 0;
  let lower = 0;
  for (const [s, n] of Object.entries(dist)) if (Number(s) < score) lower += n;
  return Math.round((lower / count) * 100);
}
