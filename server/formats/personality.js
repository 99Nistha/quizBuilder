import { nanoid } from 'nanoid';
import { BadInput, image, pct, text } from './util.js';

const okId = (id) => typeof id === 'string' && /^[\w-]{1,24}$/.test(id);

// Most-picked result wins. Ties go to whichever tied result was picked last,
// so the final question acts as a tiebreaker.
export function outcomeOf(data, answers) {
  const tally = {};
  let lastOf = {};
  data.questions.forEach((q, i) => {
    const r = q.answers.find((a) => a.id === answers[q.id])?.result;
    if (!r) return;
    tally[r] = (tally[r] ?? 0) + 1;
    lastOf[r] = i;
  });
  return Object.keys(tally).sort((a, b) => tally[b] - tally[a] || lastOf[b] - lastOf[a])[0];
}

export default {
  validate(data) {
    const results = (Array.isArray(data?.results) ? data.results : [])
      .filter((r) => r?.label?.trim())
      .map((r) => ({ id: okId(r.id) ? r.id : nanoid(8), label: text(r.label, 60), image: image(r.image), desc: text(r.desc, 280, { required: false }) }));
    if (results.length < 2) throw new BadInput('Add at least 2 possible results');
    if (results.length > 8) throw new BadInput('8 results max');
    const ids = new Set(results.map((r) => r.id));

    const questions = (Array.isArray(data?.questions) ? data.questions : [])
      .filter((q) => q?.text?.trim())
      .map((q, i) => {
        const answers = (Array.isArray(q.answers) ? q.answers : [])
          .filter((a) => a?.label?.trim())
          .map((a) => {
            if (!ids.has(a.result)) throw new BadInput(`Every answer in question ${i + 1} needs a result to count towards`);
            return { id: okId(a.id) ? a.id : nanoid(6), label: text(a.label, 80), result: a.result };
          });
        if (answers.length < 2 || answers.length > 4) throw new BadInput(`Question ${i + 1} needs 2 to 4 answers`);
        return { id: okId(q.id) ? q.id : nanoid(8), text: text(q.text, 160), image: image(q.image), answers };
      });
    if (questions.length < 3) throw new BadInput('You need at least 3 questions');
    if (questions.length > 15) throw new BadInput('Keep it to 15 questions max');
    return { results, questions };
  },

  validatePlay(data, result) {
    const given = result?.answers ?? {};
    const answers = {};
    for (const q of data.questions) {
      if (!q.answers.some((a) => a.id === given[q.id])) throw new BadInput('You skipped a question');
      answers[q.id] = given[q.id];
    }
    return { answers, outcome: outcomeOf(data, answers) };
  },

  aggregate(data, results) {
    const counts = Object.fromEntries(data.results.map((r) => [r.id, 0]));
    for (const r of results) if (r.outcome in counts) counts[r.outcome] += 1;
    const count = results.length;
    return { count, items: data.results.map((r) => ({ id: r.id, votes: counts[r.id], pct: pct(counts[r.id], count) })) };
  },

  card(game, result, stats) {
    const outcome = game.data.results.find((r) => r.id === result?.outcome);
    if (outcome) {
      const share = stats.items.find((i) => i.id === outcome.id)?.pct;
      return {
        kicker: stats.count >= 5 ? `I got this (so did ${share}% of people)` : 'I got',
        layout: 'big',
        big: outcome.label,
        sub: outcome.desc || 'Which one are you?',
      };
    }
    return { kicker: 'Which one are you?', layout: 'list', marks: 'checks', rows: game.data.results.map((r) => r.label) };
  },

  summary(game, result) {
    const outcome = game.data.results.find((r) => r.id === result.outcome);
    return `I got ${outcome?.label}! Which one are you?`;
  },
};
