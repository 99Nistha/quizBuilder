// Shrinks pictures in the browser before they're uploaded (900px is plenty).
import { uploadPicture } from './supabase.js';

const MAX = 900;

async function shrink(blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // jpeg has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that picture"))), 'image/jpeg', 0.82));
}

export async function savePicture(blob) {
  // GIFs keep their animation, as long as they're not huge
  if (blob.type === 'image/gif' && blob.size < 5 * 1024 * 1024) return uploadPicture(blob, 'gif');
  return uploadPicture(await shrink(blob), 'jpg');
}

// A search result: copy it to our storage so it never breaks. If the source
// won't hand it over, fall back to linking it directly.
export async function importPicture(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return await savePicture(await res.blob());
  } catch {
    return url;
  }
}
