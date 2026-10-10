import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, FORMATS, LIMITS } from '../../../shared/meta.js';
import ImagePicker from '../components/ImagePicker.jsx';
import { formatUI } from '../formats/index.js';
import { api } from '../lib/api.js';
import { PictureContext } from '../lib/pictures.js';
import { useTitle } from '../lib/util.js';
import NotFound from './NotFound.jsx';

export default function Create() {
  const { type } = useParams();
  const fmt = FORMATS[type];
  const ui = formatUI[type];
  const navigate = useNavigate();
  useTitle(fmt ? `Make a ${fmt.name.toLowerCase()}` : 'Make a game');

  const [meta, setMeta] = useState({ title: '', blurb: '', category: '', creator: '', cover: null });
  const [data, setData] = useState(() => ui?.blank());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!fmt || !ui) return <NotFound />;

  const set = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }));

  async function publish(e) {
    e.preventDefault();
    setError('');
    const problem = !meta.title.trim() ? 'Give it a title first.' : !meta.category ? 'Pick a category so people can find it.' : ui.check?.(data);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      const { slug } = await api.create({ type, ...meta, data });
      navigate(`/play/${slug}?new=1`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <PictureContext.Provider value={{ category: meta.category }}>
    <form className="wrap narrow maker" onSubmit={publish}>
      <p className="maker-back">
        <Link to="/make">← other formats</Link>
      </p>
      <h1 className="page-title">
        New <span style={{ color: fmt.color }}>{fmt.name.toLowerCase()}</span>
      </h1>
      <p className="page-sub">{ui.makerHint}</p>

      <fieldset className="card-box">
        <label className="field">
          <span>Title</span>
          <input value={meta.title} onChange={set('title')} maxLength={LIMITS.title} placeholder={ui.titlePlaceholder} autoFocus />
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
              <button
                type="button"
                key={c.id}
                className={`chip ${meta.category === c.id ? 'chip-on' : ''}`}
                style={{ '--c': c.color }}
                onClick={() => setMeta((m) => ({ ...m, category: c.id }))}
              >
                {c.name}
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
          {saving ? 'Publishing…' : 'Publish it'}
        </button>
        <span className="maker-fine">Anyone with the link can play. Keep it fun, keep it kind.</span>
      </div>
    </form>
    </PictureContext.Provider>
  );
}
