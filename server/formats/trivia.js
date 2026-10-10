import { nanoid } from 'nanoid';
import { beatPct, scoreQuip } from '../../shared/quips.js';
import { BadInput, image, pct, text } from './util.js';

const okId = (id) => typeof id === 'string' && /^[\w-]{1,24}$/.test(id);

export default {
  validate(data) {
    if (!Array.isArray(data?.questions)) throw new BadInput('Add some questions');
    const questions = data.questions
      .filter((q) => q?.text?.trim())
      .map((q, i) => {
        const answers = (Array.isArray(q.answers) ? q.answers : [])
          .map((a) => ({ id: okId(a?.id) ? a.id : nanoid(6), label: text(a?.label, 80, { required: false }), image: image(a?.image) }))
          .filter((a) => a.label);
        if (answers.length < 2) throw new BadInput(`Question ${i + 1} needs at least 2 answers`);
        if (answers.length > 4) throw new BadInput(`Question ${i + 1} has too many answers (4 max)`);
        if (!answers.some((a) => a.id === q.correct)) throw new BadInput(`Mark the right answer for question ${i + 1}`);
        return {
          id: okId(q.id) ? q.id : nanoid(8),
          text: text(q.text, 160),
          image: image(q.image),
          answers,
          correct: q.correct,
          note: text(q.note, 200, { required: false }),
        };
      });
    if (questions.length < 3) throw new BadInput('You need at least 3 questions');
    if (questions.length > 20) throw new BadInput('Keep it to 20 questions max');
    return { questions };
  },

  validatePlay(data, result) {
    const given = result?.answers ?? {};
    const answers = {};
    let score = 0;
    for (const q of data.questions) {
      if (!q.answers.some((a) => a.id === given[q.id])) throw new BadInput('You skipped a question');
      answers[q.id] = given[q.id];
      if (given[q.id] === q.correct) score += 1;
    }
    return { answers, score, total: data.questions.length };
  },

  aggregate(data, results) {
    const dist = {};
    const right = Object.fromEntries(data.questions.map((q) => [q.id, 0]));
    let sum = 0;
    for (const r of results) {
      dist[r.score] = (dist[r.score] ?? 0) + 1;
      sum += r.score;
      for (const q of data.questions) if (r.answers[q.id] === q.correct) right[q.id] += 1;
    }
    const count = results.length;
    return {
      count,
      avg: count ? Math.round((sum / count) * 10) / 10 : null,
      dist,
      right: Object.fromEntries(Object.entries(right).map(([id, n]) => [id, pct(n, count)])),
    };
  },

  card(game, result, stats) {
    const total = game.data.questions.length;
    if (result) {
      const beat = beatPct(stats.dist, result.score, stats.count);
      return {
        kicker: 'My score',
        layout: 'big',
        big: `${result.score}/${result.total}. ${scoreQuip(result.score, result.total)}`,
        sub: stats.count >= 5 ? `Better than ${beat}% of people who took it. Can you beat that?` : 'Can you beat that?',
        image: game.cover,
      };
    }
    return {
      kicker: `Trivia · ${total} questions`,
      layout: 'big',
      big: stats.count >= 5 ? `Average score: ${stats.avg}/${total}` : `${total} questions. No googling.`,
      sub: game.blurb || 'Think you know your stuff? Prove it.',
      image: game.cover,
    };
  },

  summary(game, result) {
    return `I got ${result.score}/${result.total}. ${scoreQuip(result.score, result.total)} Your turn.`;
  },
};
