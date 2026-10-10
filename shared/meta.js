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
};

export const formatList = () => Object.entries(FORMATS).map(([id, f]) => ({ id, ...f }));

export const LIMITS = {
  title: 90,
  blurb: 200,
  label: 60,
  creator: 30,
};
