import { useRef, useState } from 'react';
import { findPicture, usePictureContext } from '../lib/pictures.js';

// "Find pictures for me": looks up a picture for every entry that has a name
// but no picture yet. `entries` is [{ key, label }]; onDone gets { key: url }.
export default function AutoPictures({ entries, onDone }) {
  const { category } = usePictureContext();
  const [progress, setProgress] = useState(null);
  const [note, setNote] = useState('');
  // the person may keep typing while we search, so always apply to the latest list
  const latest = useRef(onDone);
  latest.current = onDone;
  const todo = entries.filter((e) => e.label?.trim());

  async function go() {
    const found = {};
    let done = 0;
    setNote('');
    setProgress(0);
    // a few at a time: quick, without hammering the image sources
    const queue = [...todo];
    const worker = async () => {
      for (let e = queue.shift(); e; e = queue.shift()) {
        try {
          const url = await findPicture(e.label.trim(), category);
          if (url) found[e.key] = url;
        } catch {
          /* skip ones we can't find */
        }
        setProgress(++done);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    latest.current(found);
    setProgress(null);
    const missed = todo.length - Object.keys(found).length;
    if (missed) setNote(`Couldn't find ${missed === todo.length ? 'any' : missed}. Tap the camera to search for those yourself.`);
  }

  if (!todo.length && !note) return null;
  return (
    <>
      {todo.length > 0 && (
        <button type="button" className="btn btn-small btn-outline auto-pics" onClick={go} disabled={progress !== null}>
          {progress !== null ? `Finding pictures… ${progress}/${todo.length}` : `Find pictures for me (${todo.length})`}
        </button>
      )}
      {note && <span className="hint auto-note">{note}</span>}
    </>
  );
}
