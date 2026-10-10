import { createContext, useContext } from 'react';
import { api } from './api.js';

// The maker page shares its category so music searches can include album art, etc.
export const PictureContext = createContext({ category: '' });
export const usePictureContext = () => useContext(PictureContext);

// Best guess picture for a label: top search hit, copied to our server.
export async function findPicture(label, category) {
  const { results } = await api.imageSearch(label, category, true);
  if (!results.length) return null;
  const { url } = await api.importImage(results[0].url);
  return url;
}
