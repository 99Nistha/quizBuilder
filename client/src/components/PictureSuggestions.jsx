import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { usePictureContext } from '../lib/pictures.js';

// A strip of picture ideas under whatever is being typed. Tap one to use it.
// Same search as the camera dialog, just without opening anything.
export default function PictureSuggestions({ query, onPick }) {
  const { category } = usePictureContext();
  const term = query.trim();
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (term.length < 2) {
      setResults(null);
      return;
    }
    let live = true;
    // wait until they pause typing, so we don't search for "Iro", "Iron", "Iron M"…
    const t = setTimeout(() => {
      api
        .imageSearch(term, category)
        .then((res) => live && setResults(res.results.slice(0, 6)))
        .catch(() => live && setResults([]));
    }, 600);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [term, category]);

  if (!results?.length) return null;

  async function pick(r) {
    setBusy(r.url);
    try {
      const { url } = await api.importImage(r.url);
      onPick(url);
    } catch {
      setBusy(null);
    }
  }

  return (
    <div className="suggest" aria-label={`Picture ideas for ${term}`}>
      <span className="suggest-label">Pick a picture?</span>
      <div className="suggest-strip">
        {results.map((r) => (
          <button
            key={r.url}
            type="button"
            className={`suggest-pic ${busy === r.url ? 'pic-busy' : ''}`}
            disabled={Boolean(busy)}
            // keep focus in the text box so the strip doesn't vanish mid-tap
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(r)}
            title={`${r.title} (${r.source})`}
          >
            <img src={r.thumb} alt={r.title} loading="lazy" referrerPolicy="no-referrer" />
          </button>
        ))}
      </div>
    </div>
  );
}
