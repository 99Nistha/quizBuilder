import { createContext, useContext } from 'react';

// When a game already has plays, its structure is locked: names and pictures
// can change, but nothing can be added, removed or re-pointed.
export const EditLock = createContext(false);
export const useLocked = () => useContext(EditLock);

// Edit keys live in this browser. Whoever has a game's key can edit it.
const KEY = 'qb:edit';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

export const editKeys = {
  all: read,
  get: (slug) => read()[slug],
  set(slug, key) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...read(), [slug]: key }));
    } catch {
      /* private mode */
    }
  },
  remove(slug) {
    try {
      const all = read();
      delete all[slug];
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* private mode */
    }
  },
};

export const editLink = (slug, key) => `${location.origin}/edit/${slug}#${key}`;
