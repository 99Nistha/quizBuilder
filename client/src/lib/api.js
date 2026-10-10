async function request(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: opts.body && !(opts.body instanceof FormData) ? { 'content-type': 'application/json', ...opts.headers } : opts.headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Something went wrong. Try again?');
  return body;
}

export const api = {
  home: () => request('/api/home'),
  games: (params) => request(`/api/games?${new URLSearchParams(params)}`),
  game: (slug) => request(`/api/games/${encodeURIComponent(slug)}`),
  create: (game) => request('/api/games', { method: 'POST', body: JSON.stringify(game) }),
  play: (slug, result) => request(`/api/games/${encodeURIComponent(slug)}/plays`, { method: 'POST', body: JSON.stringify({ result }) }),
  result: (id) => request(`/api/results/${encodeURIComponent(id)}`),
  imageSearch: (q, category = '', quick = false) => request(`/api/image-search?${new URLSearchParams({ q, category, ...(quick ? { quick: 1 } : {}) })}`),
  importImage: (url) => request('/api/images/import', { method: 'POST', body: JSON.stringify({ url }) }),
  upload: (file) => {
    const form = new FormData();
    form.append('image', file);
    return request('/api/uploads', { method: 'POST', body: form });
  },
};
