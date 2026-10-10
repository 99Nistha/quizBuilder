import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, FORMATS, LIMITS, REGIONS } from '../../../shared/meta.js';
import ImagePicker from '../components/ImagePicker.jsx';
import { formatUI } from '../formats/index.js';
import { api } from '../lib/api.js';
import { EditLock, editKeys } from '../lib/editing.js';
import { PictureContext } from '../lib/pictures.js';
import { useTitle } from '../lib/util.js';
import NotFound from './NotFound.jsx';

export default function Create() {
  const { type } = useParams();
  const navigate = useNavigate();
  const fmt = FORMATS[type];
  useTitle(fmt ? `Make a ${fmt.name.toLowerCase()}` : 'Make a game');
  if (!fmt || !formatUI[type]) return <NotFound />;

  async function create(game) {
    const { slug, editKey } = await api.create(game);
    editKeys.set(slug, editKey);
    navigate(`/play/${slug}?new=1`);
  }

  return <GameForm type={type} onSave={create} />;
}

// The maker form, used for new games and for editing.
// `initial` is an existing game when editing; `locked` means it already has plays.
export function GameForm({ type, initial, locked = false, onSave, onDelete }) {
  const fmt = FORMATS[type];
  const ui = formatUI[type];
  const editing = Boolean(initial);
  const [meta, setMeta] = useState(() => ({
    title: initial?.title ?? '',
    blurb: initial?.blurb ?? '',
    category: initial?.category ?? '',
    region: initial?.region ?? 'global',
    creator: initial?.creator ?? '',
    cover: initial?.cover ?? null,
  }));
  const [data, setData] = useState(() => initial?.data ?? ui.blank());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const problem = !meta.title.trim() ? 'Give it a title first.' : !meta.category ? 'Pick a category so people can find it.' : ui.check?.(data);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      await onSave({ type, ...meta, data });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <PictureContext.Provider value={{ category: meta.category }}>
      <EditLock.Provider value={locked}>
        <form className="wrap narrow maker" onSubmit={submit}>
          <p className="maker-back">{editing ? <Link to={`/play/${initial.slug}`}>← back to the game</Link> : <Link to="/make">← other formats</Link>}</p>
          <h1 className="page-title">
            {editing ? 'Edit' : 'New'} <span style={{ color: fmt.color }}>{fmt.name.toLowerCase()}</span>
          </h1>
          <p className="page-sub">{editing ? 'Changes go live as soon as you save.' : ui.makerHint}</p>
          {locked && (
            <p className="callout">
              <strong>{initial.plays === 1 ? 'Someone has' : `${initial.plays.toLocaleString('en-US')} people have`} played this</strong>, so you can fix names, pictures and details, but adding or removing things is locked. Otherwise their results would stop making sense.
            </p>
          )}

          <fieldset className="card-box">
            <label className="field">
              <span>Title</span>
              <input value={meta.title} onChange={set('title')} maxLength={LIMITS.title} placeholder={ui.titlePlaceholder} autoFocus={!editing} />
            </label>
            <label className="field">
              <span>
                A line about it <em>optional</em>
              </span>
              <input value={meta.blurb} onChange={set('blurb')} maxLength={LIMITS.blurb} placeholder="Set the mood. Trash talk welcome." />
            </label>
            <div className="field">
              <span>Category</span>
              <div className="cat-pick">
                {CATEGORIES.map((c) => (
                  <button type="button" key={c.id} className={`chip ${meta.category === c.id ? 'chip-on' : ''}`} style={{ '--c': c.color }} onClick={() => setMeta((m) => ({ ...m, category: c.id }))}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span>
                Where's it from? <em>helps people find local stuff</em>
              </span>
              <div className="cat-pick">
                {REGIONS.map((r) => (
                  <button type="button" key={r.id} className={`chip ${meta.region === r.id ? 'chip-on' : ''}`} onClick={() => setMeta((m) => ({ ...m, region: r.id }))}>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-row">
              <label className="field">
                <span>
                  Your name <em>optional</em>
                </span>
                <input value={meta.creator} onChange={set('creator')} maxLength={LIMITS.creator} placeholder="Shows as “by …”" />
              </label>
              <div className="field">
                <span>
                  Cover pic <em>optional</em>
                </span>
                <ImagePicker value={meta.cover} onChange={(cover) => setMeta((m) => ({ ...m, cover }))} label="Add a cover" query={meta.title} />
              </div>
            </div>
          </fieldset>

          <ui.Editor data={data} setData={setData} />

          {error && <p className="form-error">{error}</p>}
          <div className="maker-actions">
            <button className="btn btn-red btn-big" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish it'}
            </button>
            {editing ? (
              <button type="button" className="link-btn danger-link" onClick={onDelete} disabled={saving}>
                Delete this game
              </button>
            ) : (
              <span className="maker-fine">Anyone with the link can play. Keep it fun, keep it kind.</span>
            )}
          </div>
        </form>
      </EditLock.Provider>
    </PictureContext.Provider>
  );
}
