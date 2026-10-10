import { useState } from 'react';
import { beatPct, scoreQuip } from '../../../shared/quips.js';
import QuestionsEditor, { newQuestion } from '../components/QuestionsEditor.jsx';

function Editor({ data, setData }) {
  return (
    <>
      <QuestionsEditor mode="trivia" questions={data.questions} onChange={(questions) => setData({ ...data, questions })} />
      <p className="hint maker-tip">Tap "right?" next to the correct answer for each question.</p>
    </>
  );
}

function Player({ game, onDone, saving }) {
  const { questions } = game.data;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[i];
  const chosen = answers[q?.id];
  const score = questions.filter((x) => answers[x.id] === x.correct).length;
  const last = i === questions.length - 1;

  if (!q) {
    return (
      <div className="br-stage">
        <div className="br-done">
          <strong>
            {score}/{questions.length}
          </strong>
          <span>{scoreQuip(score, questions.length)}</span>
          <button className="btn btn-red btn-big" disabled={saving} onClick={() => onDone({ answers })}>
            {saving ? 'Saving…' : 'See how I did'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <p className="br-count center">
        Question {i + 1} of {questions.length} · {score} right so far
      </p>
      <div className="progress">
        <span style={{ width: `${(i / questions.length) * 100}%` }} />
      </div>
      <div className="q-card" key={q.id}>
        {q.image && <img src={q.image} alt="" className="q-img" />}
        <h2 className="q-text">{q.text}</h2>
        <div className="q-answers">
          {q.answers.map((a) => {
            const state = !chosen ? '' : a.id === q.correct ? 'right' : a.id === chosen ? 'wrong' : 'dim';
            return (
              <button key={a.id} className={`answer ${state}`} disabled={Boolean(chosen)} onClick={() => setAnswers((x) => ({ ...x, [q.id]: a.id }))}>
                {a.label}
              </button>
            );
          })}
        </div>
        {chosen && (
          <div className="q-after">
            <p className="q-verdict">{chosen === q.correct ? 'Yep!' : 'Nope.'}</p>
            {q.note && <p className="q-note-text">{q.note}</p>}
            <button className="btn btn-ink" onClick={() => setI(i + 1)} autoFocus>
              {last ? 'Finish' : 'Next question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ game, result, stats, yours }) {
  const beat = beatPct(stats.dist, result.score, stats.count);
  return (
    <section className="result">
      <div className="score-big">
        <span className="score-num">
          {result.score}
          <small>/{result.total}</small>
        </span>
        <span className="score-quip">{scoreQuip(result.score, result.total)}</span>
      </div>
      {stats.count >= 5 ? (
        <p className="verdict">
          {yours ? 'You' : 'They'} did better than <strong>{beat}%</strong> of people. The average is {stats.avg}/{result.total}.
        </p>
      ) : (
        <p className="verdict">Only a few people have played so far, so no leaderboard vibes yet.</p>
      )}
      <ol className="q-review">
        {game.data.questions.map((q) => {
          const ok = result.answers[q.id] === q.correct;
          const label = (id) => q.answers.find((a) => a.id === id)?.label;
          return (
            <li key={q.id} className={ok ? 'ok' : 'miss'}>
              <span className="q-review-mark">{ok ? '✔' : '✘'}</span>
              <div>
                <strong>{q.text}</strong>
                <span>
                  {ok ? label(q.correct) : (
                    <>
                      <s>{label(result.answers[q.id])}</s> → {label(q.correct)}
                    </>
                  )}
                  {stats.count >= 5 && <em> · {stats.right[q.id]}% got this</em>}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default {
  blank: () => ({ questions: [newQuestion(), newQuestion(), newQuestion()] }),
  check: (data) => {
    const qs = data.questions.filter((q) => q.text.trim());
    if (qs.length < 3) return 'Add at least 3 questions.';
    const bad = qs.findIndex((q) => q.answers.filter((a) => a.label.trim()).length < 2);
    if (bad >= 0) return `Question ${bad + 1} needs at least 2 answers.`;
    const unmarked = qs.findIndex((q) => !q.answers.some((a) => a.id === q.correct && a.label.trim()));
    if (unmarked >= 0) return `Mark the right answer for question ${unmarked + 1}.`;
    return null;
  },
  makerHint: 'Write questions with one right answer each. Players find out straight away if they got it, and get a score at the end.',
  titlePlaceholder: 'Only real Swifties get 8/10',
  shareText: (game, result) => `I got ${result.score}/${result.total} on "${game.title}". Bet you can't beat it:`,
  Editor,
  Player,
  Result,
};
