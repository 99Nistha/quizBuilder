import { useRef, useState } from 'react';
import { api } from '../lib/api.js';

// Upload a picture or paste a link. Calls onChange(url | null).
export default function ImagePicker({ value, onChange, label = 'Add pic', compact = false }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function pasteLink() {
    const url = window.prompt('Paste an image link (https://…)');
    if (!url) return;
    if (!/^https:\/\//i.test(url.trim())) return setError('Links need to start with https://');
    setError('');
    onChange(url.trim());
  }

  if (value) {
    return (
      <div className={`picker picker-has ${compact ? 'picker-compact' : ''}`}>
        <img src={value} alt="" />
        <button type="button" className="picker-x" onClick={() => onChange(null)} aria-label="Remove picture">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className={`picker ${compact ? 'picker-compact' : ''}`}>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={pick} />
      <button type="button" className="picker-btn" onClick={() => input.current.click()} disabled={busy}>
        {busy ? 'Uploading…' : label}
      </button>
      {!compact && (
        <button type="button" className="link-btn" onClick={pasteLink}>
          or paste a link
        </button>
      )}
      {error && <span className="picker-error">{error}</span>}
    </div>
  );
}
