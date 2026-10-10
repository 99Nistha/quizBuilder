import { useEffect, useState } from 'react';
import { SITE_NAME } from '../../../shared/meta.js';

export const n = (x) => Number(x || 0).toLocaleString('en-US');

export function plural(count, one, many = one + 's') {
  return `${n(count)} ${count === 1 ? one : many}`;
}

export function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Stable, cheerful colour for things without a picture.
const SWATCHES = ['#ff5a8a', '#ffb000', '#7b61ff', '#1db954', '#ff7a1a', '#2f7bff', '#00b3c7', '#e040fb', '#ee3322'];
export function swatch(seed = '') {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SWATCHES[h % SWATCHES.length];
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME}: make the quiz, start the argument`;
  }, [title]);
}

export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => live && setState({ data }))
      .catch((error) => live && setState({ error }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

// Remembers which results are yours, so a result page can say "you" vs "they".
// Lives only in this browser.
const KEY = 'qb:mine';
export const mine = {
  all() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  },
  add(slug, playId) {
    try {
      const all = mine.all();
      all[slug] = playId;
      all[`r:${playId}`] = 1;
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* private mode, whatever */
    }
  },
  playOf: (slug) => mine.all()[slug],
  isMine: (playId) => Boolean(mine.all()[`r:${playId}`]),
};

export const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
