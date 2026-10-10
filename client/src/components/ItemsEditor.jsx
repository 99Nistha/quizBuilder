import { LIMITS } from '../../../shared/meta.js';
import ImagePicker from './ImagePicker.jsx';

let counter = 0;
export const newItem = (label = '') => ({ id: `n${Date.now().toString(36)}${(counter++).toString(36)}`, label, image: null });

// The list-of-things editor that most formats share.
export default function ItemsEditor({ items, onChange, min, max, noun = 'item', placeholder = 'Type a thing', heading }) {
  const update = (id, patch) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onChange(items.filter((it) => it.id !== id));
  const add = () => items.length < max && onChange([...items, newItem()]);

  function onKey(e, i) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (i === items.length - 1) add();
      requestAnimationFrame(() => e.target.closest('.items')?.querySelectorAll('input[type=text]')[i + 1]?.focus());
    }
  }

  const filled = items.filter((it) => it.label.trim()).length;

  return (
    <fieldset className="card-box">
      <legend className="card-legend">
        {heading ?? `The ${noun}s`}
        <span className={`count ${filled < min ? 'count-low' : ''}`}>
          {filled}/{max}
        </span>
      </legend>
      <ol className="items">
        {items.map((it, i) => (
          <li key={it.id} className="item-row">
            <span className="item-n">{i + 1}</span>
            <input type="text" value={it.label} maxLength={LIMITS.label} placeholder={i === 0 ? placeholder : ''} onChange={(e) => update(it.id, { label: e.target.value })} onKeyDown={(e) => onKey(e, i)} />
            <ImagePicker compact value={it.image} onChange={(image) => update(it.id, { image })} label="pic" />
            <button type="button" className="item-x" onClick={() => remove(it.id)} disabled={items.length <= min} aria-label={`Remove ${it.label || 'item'}`}>
              ×
            </button>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button type="button" className="btn btn-outline btn-small" onClick={add}>
          + Add another
        </button>
      )}
      <p className="hint">
        {min} to {max} {noun}s. Pictures are optional but people love them.
      </p>
    </fieldset>
  );
}
