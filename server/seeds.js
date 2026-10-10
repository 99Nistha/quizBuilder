const items = (...labels) => labels.map((label, i) => ({ id: `i${i + 1}`, label }));

// Fake plays lean towards the listed order so the crowd stats look like
// real opinions rather than noise. Only used with --demo-plays.
const leaning = (data, shuffle) => {
  const ids = data.items.map((i) => i.id);
  return { order: Math.random() < 0.45 ? ids : shuffle(ids) };
};

const pairs = (...list) => list.map(([a, b], i) => ({ id: `p${i + 1}`, a: { label: a }, b: { label: b } }));
const splitPicks = (data) => ({ picks: Object.fromEntries(data.pairs.map((p, i) => [p.id, Math.random() < 0.3 + ((i * 37) % 50) / 100 ? 'a' : 'b'])) });

let qn = 0;
const q = (text, answers, correct, note = '') => {
  qn += 1;
  return { id: `q${qn}`, text, note, answers: answers.map((label, i) => ({ id: `q${qn}a${i}`, label })), correct: `q${qn}a${correct}` };
};

export const seeds = [
  {
    type: 'blind_ranking',
    slug: 'blind-rank-pizza-toppings',
    title: 'Blind rank these pizza toppings',
    blurb: "You don't know what's coming next. Pineapple people, this is your moment.",
    category: 'food',
    creator: 'nistha',
    data: { items: items('Pepperoni', 'Mushrooms', 'Pineapple', 'Extra cheese', 'Olives', 'Jalapeños', 'Onions', 'Sausage') },
    fakePlay: leaning,
  },
  {
    type: 'blind_ranking',
    slug: 'blind-rank-taylor-swift-eras',
    title: 'Blind rank the Taylor Swift eras',
    blurb: 'No skipping ahead. Lock it in.',
    category: 'music',
    creator: 'nistha',
    data: { items: items('Debut', 'Fearless', 'Speak Now', 'Red', '1989', 'Reputation', 'Lover', 'Folklore', 'Evermore', 'Midnights') },
    fakePlay: leaning,
  },
  {
    type: 'blind_ranking',
    slug: 'blind-rank-pixar-movies',
    title: 'Blind rank 8 Pixar movies',
    blurb: 'Where does Cars end up? Be honest.',
    category: 'movies',
    data: { items: items('Toy Story', 'Up', 'Ratatouille', 'WALL-E', 'Inside Out', 'Finding Nemo', 'Coco', 'Cars') },
    fakePlay: leaning,
  },
  {
    type: 'blind_ranking',
    slug: 'blind-rank-starter-pokemon',
    title: 'Blind rank the Kanto + Johto starters',
    category: 'gaming',
    data: { items: items('Bulbasaur', 'Charmander', 'Squirtle', 'Chikorita', 'Cyndaquil', 'Totodile') },
    fakePlay: leaning,
  },
  {
    type: 'blind_ranking',
    slug: 'blind-rank-sitcoms',
    title: 'Blind rank these comfort sitcoms',
    blurb: 'The ones you put on when you just need something on.',
    category: 'tv',
    data: { items: items('The Office', 'Friends', 'Parks and Rec', 'Brooklyn Nine-Nine', 'Modern Family', 'New Girl', 'Schitt’s Creek') },
    fakePlay: leaning,
  },
  {
    type: 'this_or_that',
    slug: 'this-or-that-snacks',
    title: 'This or that: snack aisle edition',
    blurb: 'Quick, no thinking. Your gut knows.',
    category: 'food',
    data: { pairs: pairs(['Sweet', 'Salty'], ['Doritos', 'Pringles'], ['KitKat', 'Twix'], ['Popcorn', 'Nachos'], ['Gummy bears', 'Sour worms'], ['Oreos', 'Chips Ahoy'], ['Hot Cheetos', 'Takis']) },
    fakePlay: splitPicks,
  },
  {
    type: 'this_or_that',
    slug: 'this-or-that-2000s-pop',
    title: 'Pick one: 2000s pop girlies',
    category: 'music',
    data: { pairs: pairs(['Britney', 'Christina'], ['Avril', 'Kelly Clarkson'], ['Beyoncé', 'Rihanna'], ['Nelly Furtado', 'Shakira'], ['Hilary Duff', 'Lindsay Lohan']) },
    fakePlay: splitPicks,
  },
  {
    type: 'would_you_rather',
    slug: 'would-you-rather-travel-chaos',
    title: 'Would you rather: travel chaos edition',
    blurb: 'Every option is bad. Pick the least bad.',
    category: 'internet',
    data: {
      pairs: pairs(
        ['Have a 14-hour flight next to a crying baby', 'Have a 14-hour flight next to someone who talks the whole time'],
        ['Lose your luggage on day one', 'Lose your phone on day one'],
        ['Only eat at chain restaurants abroad', 'Only eat street food, no exceptions'],
        ['Travel with your ex', 'Travel with your boss'],
        ['Sleep in an airport for one night', 'Take a 30-hour bus instead'],
      ),
    },
    fakePlay: splitPicks,
  },
  {
    type: 'poll',
    slug: 'best-pixar-sad-moment',
    title: 'Which Pixar moment destroyed you the most?',
    category: 'movies',
    data: { items: items('The first 10 minutes of Up', 'Bing Bong in Inside Out', 'Jessie\u2019s song in Toy Story 2', 'Remember Me in Coco', 'The incinerator in Toy Story 3') },
    fakePlay: (data) => ({ pick: data.items[Math.floor(Math.random() ** 1.6 * data.items.length)].id }),
  },
  {
    type: 'trivia',
    slug: 'only-real-gamers-get-5',
    title: 'Only real gamers get 5/5',
    blurb: 'Retro edition. No googling, we can tell.',
    category: 'gaming',
    data: {
      questions: [
        q('What colour is Pac-Man?', ['Yellow', 'Red', 'Blue'], 0, 'He was originally going to be called Puck-Man.'),
        q('Which company made the Game Boy?', ['Sega', 'Nintendo', 'Sony', 'Atari'], 1),
        q('What is Mario\u2019s brother called?', ['Wario', 'Toad', 'Luigi'], 2),
        q('In Tetris, how many blocks make up each piece?', ['3', '4', '5'], 1, 'That\u2019s where the name comes from: tetra = four.'),
        q('Which game has a character called Master Chief?', ['Halo', 'Doom', 'Gears of War', 'Destiny'], 0),
      ],
    },
    fakePlay: (data) => {
      const answers = {};
      let score = 0;
      for (const qq of data.questions) {
        const right = Math.random() < 0.7;
        answers[qq.id] = right ? qq.correct : qq.answers.find((a) => a.id !== qq.correct).id;
        if (right) score += 1;
      }
      return { answers, score, total: data.questions.length };
    },
  },
  {
    type: 'personality',
    slug: 'which-pasta-shape-are-you',
    title: 'Which pasta shape are you?',
    blurb: 'Deeply scientific. Peer reviewed by nobody.',
    category: 'food',
    data: {
      results: [
        { id: 'spag', label: 'Spaghetti', desc: 'A classic. Reliable, a little chaotic, gets everywhere. People love you even when you make a mess.' },
        { id: 'farf', label: 'Farfalle', desc: 'You are dressed up for an event that is not happening. Main character energy, zero apologies.' },
        { id: 'macc', label: 'Mac & cheese elbows', desc: 'Pure comfort. You are the friend people call at 2am and you always pick up.' },
      ],
      questions: [
        { id: 'pq1', text: 'Pick a Saturday plan', answers: [{ id: 'a1', label: 'Big dinner with friends', result: 'spag' }, { id: 'a2', label: 'Getting dressed up for no reason', result: 'farf' }, { id: 'a3', label: 'Blanket, sofa, comfort show', result: 'macc' }] },
        { id: 'pq2', text: 'Your group chat role?', answers: [{ id: 'b1', label: 'Sends 40 messages in a row', result: 'spag' }, { id: 'b2', label: 'Posts outfit pics for approval', result: 'farf' }, { id: 'b3', label: 'Checks in on everyone', result: 'macc' }] },
        { id: 'pq3', text: 'Choose a drink', answers: [{ id: 'c1', label: 'Red wine', result: 'spag' }, { id: 'c2', label: 'Something pink with a tiny umbrella', result: 'farf' }, { id: 'c3', label: 'Hot chocolate', result: 'macc' }] },
        { id: 'pq4', text: 'Pick a holiday', answers: [{ id: 'd1', label: 'Rome, obviously', result: 'spag' }, { id: 'd2', label: 'Paris, for the photos', result: 'farf' }, { id: 'd3', label: 'A cabin with no wifi', result: 'macc' }] },
      ],
    },
    fakePlay: (data) => {
      const answers = Object.fromEntries(data.questions.map((qq) => [qq.id, qq.answers[Math.floor(Math.random() ** 1.3 * qq.answers.length)].id]));
      const tally = {};
      for (const qq of data.questions) {
        const r = qq.answers.find((a) => a.id === answers[qq.id]).result;
        tally[r] = (tally[r] ?? 0) + 1;
      }
      return { answers, outcome: Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0] };
    },
  },
];
