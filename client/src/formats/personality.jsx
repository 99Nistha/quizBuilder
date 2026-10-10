import { useRef, useState } from 'react';
import PictureSuggestions from '../components/PictureSuggestions.jsx';
import AutoPictures from '../components/AutoPictures.jsx';
import ImagePicker from '../components/ImagePicker.jsx';
import { newItem } from '../components/ItemsEditor.jsx';
import AnswerButton from '../components/AnswerButton.jsx';
import QuestionsEditor, { newQuestion } from '../components/QuestionsEditor.jsx';
import Same, { CrowdNote, crowdReady } from '../components/Same.jsx';
import { useLocked } from '../lib/editing.js';
import { Bars } from './poll.jsx';

const newResult = () => ({ ...newItem(), desc: '' });

function ResultsEditor({ results, onChange }) {
  const set = (id, patch) => onChange(results.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const latest = useRef(set);
  latest.current = set;
  const setImage = (id) => (image) => latest.current(id, { image });
  const [typing, setTyping] = useState(null);
  const locked = useLocked();
  return (
    <fieldset className="card-box">
      <legend className="card-legend">
        Possible results
        <span className="count">{results.filter((r) => r.label.trim()).length}/8</span>
      </legend>
      <p className="hint first-hint">What people can end up as. Do these first, then the questions.</p>
      <ol className="q-list">
        {results.map((r, i) => (
          <li key={r.id} className="q-edit">
            <div className="q-head">
              <span className="q-num">{String.fromCharCode(65 + i)}</span>
              <input type="text" className="q-input" value={r.label} maxLength={60} placeholder={['Folklore', 'Reputation', '1989'][i] ?? 'Result'} onChange={(e) => set(r.id, { label: e.target.value })} onFocus={() => setTyping(r.id)} onBlur={() => setTyping((t) => (t === r.id ? null : t))} />
              <ImagePicker compact value={r.image} onChange={setImage(r.id)} query={r.label} />
              {!locked && (
                <button type="button" className="item-x" disabled={results.length <= 2} onClick={() => onChange(results.filter((x) => x.id !== r.id))} aria-label="Remove result">
                  ×
                </button>
              )}
            </div>
            {typing === r.id && !r.image && <PictureSuggestions query={r.label} onPick={setImage(r.id)} />}
            <div className="q-foot">
              <input type="text" className="q-input q-note" value={r.desc} maxLength={280} placeholder="A line or two about people who get this" onChange={(e) => set(r.id, { desc: e.target.value })} />
            </div>
          </li>
        ))}
      </ol>
      <div className="editor-actions">
        {!locked && results.length < 8 && (
          <button type="button" className="btn btn-outline btn-small" onClick={() => onChange([...results, newResult()])}>
            + Add a result
          </button>
        )}
        <AutoPictures entries={results.filter((r) => !r.image).map((r) => ({ key: r.id, label: r.label }))} onDone={(found) => onChange(results.map((r) => (found[r.id] ? { ...r, image: found[r.id] } : r)))} />
      </div>
    </fieldset>
  );
}

function Editor({ data, setData }) {
  return (
    <>
      <ResultsEditor results={data.results} onChange={(results) => setData({ ...data, results })} />
      <QuestionsEditor mode="personality" results={data.results} max={15} questions={data.questions} onChange={(questions) => setData({ ...data, questions })} />
    </>
  );
}

function Player({ game, onDone, saving }) {
  const { questions } = game.data;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[i];

  function answer(aid) {
    const next = { ...answers, [q.id]: aid };
    setAnswers(next);
    if (i === questions.length - 1) onDone({ answers: next });
    else setI(i + 1);
  }

  if (!q) return null;
  return (
    <div className="quiz">
      <p className="br-count center">
        {i + 1} of {questions.length}
      </p>
      <div className="progress">
        <span style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <div className="q-card" key={q.id}>
        {q.image && <img src={q.image} alt="" className="q-img" />}
        <h2 className="q-text">{q.text}</h2>
        <div className={`q-answers ${q.answers.some((a) => a.image) ? 'q-answers-pics' : ''}`}>
          {q.answers.map((a) => (
            <AnswerButton key={a.id} answer={a} className={answers[q.id] === a.id ? 'right' : ''} disabled={saving} onClick={() => answer(a.id)} />
          ))}
        </div>
        {i > 0 && !saving && (
          <button className="link-btn back-btn" onClick={() => setI(i - 1)}>
            ← back
          </button>
        )}
        {saving && <p className="hint">Working out who you are…</p>}
      </div>
    </div>
  );
}

function Result({ game, result, stats, yours }) {
  const outcome = game.data.results.find((r) => r.id === result.outcome);
  const share = stats.items.find((s) => s.id === outcome.id)?.pct;
  return (
    <section className="result">
      <p className="you-got">{yours ? 'You got' : 'They got'}</p>
      <div className="outcome">
        {outcome.image && <img src={outcome.image} alt="" />}
        <div>
          <h2 className="outcome-name">{outcome.label}</h2>
          {outcome.desc && <p className="outcome-desc">{outcome.desc}</p>}
        </div>
      </div>
      {crowdReady(stats) ? (
        <>
          <p className="verdict">
            <strong>{share}%</strong> of people got {outcome.label} too. Here's how everyone else turned out:
          </p>
          <Bars items={stats.items} mineId={outcome.id} mineTag={yours ? 'you' : 'them'} labelOf={(id) => game.data.results.find((r) => r.id === id)?.label} />
        </>
      ) : (
        <p className="verdict">You're the first to take this! Once others do, you'll see how rare your result is.</p>
      )}
      <h3 className="sub-heading">{yours ? 'Your answers' : 'Their answers'}</h3>
      <ol className="q-review">
        {game.data.questions.map((q) => {
          const a = q.answers.find((x) => x.id === result.answers?.[q.id]);
          return (
            <li key={q.id} className="ok">
              <div>
                <strong>{q.text}</strong>
                <span>{a?.label}</span>
                <Same pct={stats.picks?.[q.id]?.[a?.id]} stats={stats} label="picked the same" />
              </div>
            </li>
          );
        })}
      </ol>
      <CrowdNote stats={stats} />
    </section>
  );
}

function blank() {
  const results = [newResult(), newResult(), newResult()];
  const question = () => {
    const q = newQuestion(3);
    q.answers = q.answers.map((a, i) => ({ ...a, result: results[i].id }));
    return q;
  };
  return { results, questions: [question(), question(), question()] };
}

export default {
  blank,
  check: (data) => {
    const named = data.results.filter((r) => r.label.trim());
    if (named.length < 2) return 'Add at least 2 results people can get.';
    const qs = data.questions.filter((q) => q.text.trim());
    if (qs.length < 3) return 'Add at least 3 questions.';
    for (const [i, q] of qs.entries()) {
      const filled = q.answers.filter((a) => a.label.trim());
      if (filled.length < 2) return `Question ${i + 1} needs at least 2 answers.`;
      if (filled.some((a) => !named.some((r) => r.id === a.result))) return `Every answer in question ${i + 1} needs a result to count towards.`;
    }
    return null;
  },
  makerHint: 'Set up the results people can get, then write questions where each answer nudges them towards one.',
  titlePlaceholder: 'Which Taylor Swift era are you?',
  shareText: (game, result) => `I got ${game.data.results.find((r) => r.id === result.outcome)?.label}! "${game.title}"`,
  Editor,
  Player,
  Result,
};
