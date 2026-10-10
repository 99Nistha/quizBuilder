import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { usePictureContext } from '../lib/pictures.js';

// A small button that opens the picture dialog. Calls onChange(url | null).
// `query` is whatever the person typed for this thing, used to pre-fill the search.
export default function ImagePicker({ value, onChange, label = 'Add pic', compact = false, query = '' }) {
  const [open, setOpen] = useState(false);

  if (value) {
    return (
      <div className={`picker picker-has ${compact ? 'picker-compact' : ''}`}>
        <button type="button" className="picker-thumb" onClick={() => setOpen(true)} title="Change picture">
          <img src={value} alt="" />
        </button>
        <button type="button" className="picker-x" onClick={() => onChange(null)} aria-label="Remove picture">
          ×
        </button>
        {open && <PictureDialog query={query} onPick={onChange} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div className={`picker ${compact ? 'picker-compact' : ''}`}>
      <button type="button" className="picker-btn" onClick={() => setOpen(true)} title="Add a picture">
        {compact ? <CameraIcon /> : label}
      </button>
      {open && <PictureDialog query={query} onPick={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PictureDialog({ query, onPick, onClose }) {
  const { category } = usePictureContext();
  const [q, setQ] = useState(query);
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const file = useRef(null);
  const dialog = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // search as you type, with a little pause
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    let live = true;
    setResults((r) => r ?? 'loading');
    const t = setTimeout(() => {
      api
        .imageSearch(term, category)
        .then((res) => live && setResults(res.results))
        .catch(() => live && setResults([]));
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, category]);

  async function run(key, fn) {
    setBusy(key);
    setError('');
    try {
      onPick(await fn());
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  }

  function pickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) run('upload', () => api.upload(f).then((r) => r.url));
  }

  function useLink(e) {
    e.preventDefault();
    const url = link.trim();
    if (!/^https:\/\//i.test(url)) return setError('Links need to start with https://');
    onPick(url);
    onClose();
  }

  return (
    <div className="dialog-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" ref={dialog} role="dialog" aria-modal="true" aria-label="Add a picture">
        <div className="dialog-head">
          <h2>Add a picture</h2>
          <button type="button" className="item-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <input className="q-input dialog-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a person, thing, album, film…" autoFocus />

        <div className="dialog-results">
          {results === null && <p className="hint">Type something and we'll look for pictures.</p>}
          {results === 'loading' && <p className="hint">Looking…</p>}
          {Array.isArray(results) && results.length === 0 && <p className="hint">Nothing found. Try different words, or upload your own.</p>}
          {Array.isArray(results) && results.length > 0 && (
            <div className="pic-grid">
              {results.map((r) => (
                <button key={r.url} type="button" className={`pic-hit ${busy === r.url ? 'pic-busy' : ''}`} disabled={Boolean(busy)} onClick={() => run(r.url, () => api.importImage(r.url).then((x) => x.url))} title={`${r.title} (${r.source})`}>
                  <img src={r.thumb} alt={r.title} loading="lazy" referrerPolicy="no-referrer" />
                  <span>{r.source}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="picker-error">{error}</p>}

        <div className="dialog-other">
          <input ref={file} type="file" accept="image/*" hidden onChange={pickFile} />
          <button type="button" className="btn btn-outline btn-small" onClick={() => file.current.click()} disabled={Boolean(busy)}>
            {busy === 'upload' ? 'Uploading…' : 'Upload from your device'}
          </button>
          <form className="dialog-link" onSubmit={useLink}>
            <input className="q-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="or paste an image link" />
            <button className="btn btn-small btn-ink" disabled={!link.trim()}>
              Use
            </button>
          </form>
        </div>
        <p className="dialog-fine">Search results come from Wikipedia, iTunes and Openverse. Only use pictures you're allowed to share.</p>
      </div>
    </div>
  );
}
