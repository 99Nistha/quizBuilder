const items = (...labels) => labels.map((label, i) => ({ id: `i${i + 1}`, label }));

// Fake plays lean towards the listed order so the crowd stats look like
// real opinions rather than noise. Only used with --demo-plays.
const leaning = (data, shuffle) => {
  const ids = data.items.map((i) => i.id);
  return { order: Math.random() < 0.45 ? ids : shuffle(ids) };
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
];
