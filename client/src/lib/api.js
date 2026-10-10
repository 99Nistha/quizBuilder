// Everything the pages need, backed by Supabase. Same shape as the old server
// API, so the pages don't care where the data lives.
import { CATEGORIES, LIMITS } from '../../../shared/meta.js';
import { formats } from '../../../shared/formats/index.js';
import { BadInput, text } from '../../../shared/formats/util.js';
import { withView } from '../../../shared/gameView.js';
import { searchImages } from '../../../shared/pictureSearch.js';
import { importPicture, savePicture } from './images.js';
import { rpc } from './supabase.js';

const notFound = () => new Error("Couldn't find that one");
const statsFor = (game, results) => formats[game.type].aggregate(game.data, results);

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '');

// Same checks the old server did, run before anything is saved.
function checkGame(game) {
  const format = formats[game.type];
  if (!format) throw new BadInput('Pick a game type');
  if (!CATEGORIES.some((c) => c.id === game.category)) throw new BadInput('Pick a category');
  return {
    p_title: text(game.title, LIMITS.title, { field: 'The title' }),
    p_blurb: text(game.blurb, LIMITS.blurb, { required: false }),
    p_category: game.category,
    p_region: game.region || 'global',
    p_cover: game.cover || null,
    p_creator: text(game.creator, LIMITS.creator, { required: false }),
    p_data: format.validate(game.data),
  };
}

// The play page already loaded the game; keep it so saving a play doesn't fetch it again.
const loaded = new Map();

export const api = {
  async home() {
    const h = await rpc('home');
    return {
      stats: h.stats,
      trending: h.trending.map(withView),
      fresh: h.fresh.map(withView),
      categories: CATEGORIES.map((c) => ({ ...c, count: h.categories[c.id] ?? 0 })),
      regions: h.regions,
    };
  },

  async games({ category, type, region, sort, page } = {}) {
    const r = await rpc('list_games', { p_category: category || null, p_type: type || null, p_region: region || null, p_sort: sort || 'new', p_page: Number(page) || 0 });
    return { games: r.games.map(withView), more: r.more };
  },

  async game(slug) {
    const r = await rpc('get_game', { p_slug: slug });
    if (!r) throw notFound();
    loaded.set(slug, r.game);
    return { game: withView(r.game), stats: statsFor(r.game, r.results) };
  },

  async create(game) {
    const fields = checkGame(game);
    return rpc('create_game', { p_type: game.type, ...fields, p_slug: slugify(fields.p_title) });
  },

  async play(slug, result) {
    const game = loaded.get(slug) ?? (await rpc('get_game', { p_slug: slug }))?.game;
    if (!game) throw notFound();
    return rpc('add_play', { p_slug: slug, p_result: formats[game.type].validatePlay(game.data, result) });
  },

  async result(id) {
    const r = await rpc('get_play', { p_id: id });
    if (!r) throw notFound();
    return { id: r.id, result: r.result, game: withView(r.game), stats: statsFor(r.game, r.results) };
  },

  imageSearch: async (q, category = '', quick = false) => ({ results: await searchImages(q, category, { quick }) }),
  importImage: async (url) => ({ url: await importPicture(url) }),
  async upload(file) {
    if (!file.type.startsWith('image/')) throw new Error('That file isn’t a picture. Try a JPG, PNG, GIF or WebP.');
    if (file.size > 15 * 1024 * 1024) throw new Error('That picture is huge. Try one under 15 MB.');
    return { url: await savePicture(file) };
  },

  async forEdit(slug, key) {
    const r = await rpc('game_for_edit', { p_slug: slug, p_key: key });
    return { game: withView(r.game), locked: r.locked };
  },
  update: (slug, key, game) => rpc('update_game', { p_slug: slug, p_key: key, ...checkGame(game) }),
  remove: (slug, key) => rpc('delete_game', { p_slug: slug, p_key: key }),
};
