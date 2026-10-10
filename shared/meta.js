// Shared by the server and the browser. Keep it plain JS.

export const SITE_NAME = 'Quizbop';

export const CATEGORIES = [
  { id: 'music', name: 'Music', color: '#ff5a8a' },
  { id: 'movies', name: 'Movies', color: '#ffb000' },
  { id: 'tv', name: 'TV', color: '#7b61ff' },
  { id: 'sports', name: 'Sports', color: '#1db954' },
  { id: 'celebs', name: 'Celebs', color: '#ff7a1a' },
  { id: 'dance', name: 'Dance', color: '#e040fb' },
  { id: 'gaming', name: 'Gaming', color: '#2f7bff' },
  { id: 'food', name: 'Food', color: '#ee3322' },
  { id: 'anime', name: 'Anime', color: '#00b3c7' },
  { id: 'internet', name: 'Internet', color: '#222222' },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

// Formats are added here as they get built.
export const FORMATS = {
  blind_ranking: {
    name: 'Blind ranking',
    pitch: 'Items show up one by one. Lock each into a spot before you see the next.',
    color: '#ee3322',
    verb: 'Rank',
  },
  this_or_that: {
    name: 'This or that',
    pitch: 'Two options, pick one, repeat. Then see if everyone else agrees.',
    color: '#2f7bff',
    verb: 'Pick',
  },
  would_you_rather: {
    name: 'Would you rather',
    pitch: 'Two cursed scenarios. No dodging. Find out who else would make the same call.',
    color: '#7b61ff',
    verb: 'Choose',
  },
  poll: {
    name: 'Poll',
    pitch: 'One question, a few options, live results. Settle it once and for all.',
    color: '#1db954',
    verb: 'Vote',
  },
  personality: {
    name: 'Personality quiz',
    pitch: '"Which ___ are you?" Answer a few questions, get a result to argue about.',
    color: '#ff5a8a',
    verb: 'Find out',
  },
  trivia: {
    name: 'Trivia quiz',
    pitch: 'Right or wrong answers, a score at the end, bragging rights forever.',
    color: '#ff7a1a',
    verb: 'Play',
  },
  tier_list: {
    name: 'Tier list',
    pitch: 'Sort a pile of things into S, A, B, C and D. Then see the crowd\u2019s version.',
    color: '#00a3b5',
    verb: 'Sort',
  },
  bracket: {
    name: 'Bracket',
    pitch: 'Head to head knockout rounds until there\u2019s one champion left.',
    color: '#161616',
    verb: 'Crown',
  },
};

export const formatList = () => Object.entries(FORMATS).map(([id, f]) => ({ id, ...f }));

export const LIMITS = {
  title: 90,
  blurb: 200,
  label: 60,
  creator: 30,
};
