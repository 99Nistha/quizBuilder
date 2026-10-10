// Small helpers for showing a game in lists (tiles), shared by the site and the build.

// Pictures used inside a game, in order, for the tile collage.
export function gameImages(value, out = []) {
  if (!value || typeof value !== 'object' || out.length >= 4) return out;
  if (typeof value.image === 'string' && value.image && !out.includes(value.image)) out.push(value.image);
  for (const v of Object.values(value)) gameImages(v, out);
  return out;
}

// A few item names to tease on tiles that have no picture.
export function peekLabels(data) {
  if (data.pairs) return data.pairs.slice(0, 3).map((p) => `${p.a.label} or ${p.b.label}`);
  const list = data.items ?? data.results ?? data.questions ?? [];
  return list.slice(0, 3).map((i) => i.label ?? i.text).filter(Boolean);
}

// Adds the tile extras to a game as it comes out of the database.
export function withView(game) {
  return {
    ...game,
    thumbs: game.cover ? [game.cover] : gameImages(game.data).slice(0, 4),
    peek: peekLabels(game.data),
  };
}
