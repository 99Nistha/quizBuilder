import { useLocked } from '../lib/editing.js';
import ImagePicker from './ImagePicker.jsx';
import { newItem } from './ItemsEditor.jsx';

export const newQuestion = (answers = 3) => ({
  id: newItem().id,
  text: '',
  image: null,
  note: '',
  correct: null,
  answers: Array.from({ length: answers }, () => ({ id: newItem().id, label: '', result: null, image: null })),
});

// Used by trivia (each question has one right answer) and personality
// quizzes (each answer points at a result).
export default function QuestionsEditor({ questions, onChange, mode, results = [], min = 3, max = 20 }) {
  const setQ = (id, patch) => onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const setA = (q, aid, patch) => setQ(q.id, { answers: q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a)) });
  const namedResults = results;
  const locked = useLocked();

  return (
    <fieldset className="card-box">
      <legend className="card-legend">
        Questions
        <span className={`count ${questions.filter((q) => q.text.trim()).length < min ? 'count-low' : ''}`}>
          {questions.filter((q) => q.text.trim()).length}/{max}
        </span>
      </legend>
      <ol className="q-list">
        {questions.map((q, i) => (
          <li key={q.id} className="q-edit">
            <div className="q-head">
              <span className="q-num">Q{i + 1}</span>
              <input type="text" className="q-input" value={q.text} maxLength={160} placeholder={i === 0 ? (mode === 'trivia' ? 'Which planet has the most moons?' : 'Pick a Sunday activity') : 'Question'} onChange={(e) => setQ(q.id, { text: e.target.value })} />
              <ImagePicker compact value={q.image} onChange={(image) => setQ(q.id, { image })} query={q.text} />
              {!locked && (
                <button type="button" className="item-x" disabled={questions.length <= min} onClick={() => onChange(questions.filter((x) => x.id !== q.id))} aria-label="Remove question">
                  ×
                </button>
              )}
            </div>
            <ul className="a-list">
              {q.answers.map((a, j) => (
                <li key={a.id} className="a-edit">
                  {mode === 'trivia' && (
                    <label className={`a-correct ${q.correct === a.id ? 'on' : ''}`} title="This is the right answer">
                      <input type="radio" name={`c-${q.id}`} checked={q.correct === a.id} disabled={locked} onChange={() => setQ(q.id, { correct: a.id })} />
                      <span>{q.correct === a.id ? '✓ right' : 'right?'}</span>
                    </label>
                  )}
                  <input type="text" className="q-input" value={a.label} maxLength={80} placeholder={`Answer ${j + 1}`} onChange={(e) => setA(q, a.id, { label: e.target.value })} />
                  <ImagePicker compact value={a.image} onChange={(image) => setA(q, a.id, { image })} query={a.label} />
                  {mode === 'personality' && (
                    <select className="select a-result" disabled={locked} value={a.result ?? ''} onChange={(e) => setA(q, a.id, { result: e.target.value || null })} aria-label="Counts towards">
                      <option value="">counts towards…</option>
                      {results.map((r, k) => (
                        <option key={r.id} value={r.id}>
                          {r.label.trim() || `Result ${String.fromCharCode(65 + k)}`}
                        </option>
                      ))}
                    </select>
                  )}
                  {!locked && <button type="button" className="item-x" disabled={q.answers.length <= 2} onClick={() => setQ(q.id, { answers: q.answers.filter((x) => x.id !== a.id), correct: q.correct === a.id ? null : q.correct })} aria-label="Remove answer">
                    ×
                  </button>}
                </li>
              ))}
            </ul>
            <div className="q-foot">
              {!locked && q.answers.length < 4 && (
                <button type="button" className="link-btn" onClick={() => setQ(q.id, { answers: [...q.answers, { id: newItem().id, label: '', result: null, image: null }] })}>
                  + another answer
                </button>
              )}
              {mode === 'trivia' && <input type="text" className="q-input q-note" value={q.note} maxLength={200} placeholder="Fun fact after they answer (optional)" onChange={(e) => setQ(q.id, { note: e.target.value })} />}
            </div>
          </li>
        ))}
      </ol>
      {!locked && questions.length < max && (
        <button type="button" className="btn btn-outline btn-small" onClick={() => {
            const q = newQuestion(mode === 'trivia' ? 3 : Math.min(4, Math.max(2, namedResults.length)));
            if (mode === 'personality') q.answers = q.answers.map((a, i) => ({ ...a, result: namedResults[i]?.id ?? null }));
            onChange([...questions, q]);
          }}>
          + Add a question
        </button>
      )}
    </fieldset>
  );
}
