# Playbee

Live at **https://playbee.pro**.

Make-your-own BuzzFeed-style games: blind rankings, this-or-that, would you rather, polls, trivia, personality quizzes, tier lists, brackets and rate-these. Anyone can make one, every game gets its own link, and every result turns into a share card.

> To rename the site, edit `shared/brand.js` (name, domain, tagline, colours, logo) and push. Nothing else mentions the name.

## How it runs

- **GitHub Pages** serves the site. Every push to `main` builds and publishes it (`.github/workflows/deploy.yml`), and it rebuilds every hour so new games get their own link-preview card.
- **Supabase** stores games, plays and pictures. `supabase/schema.sql` sets it all up. The site only ever calls the functions defined there, so the public key in `shared/brand.js` can't read or change anything else.
- The **browser** does the rest: picture search (Wikipedia, iTunes, Openverse), shrinking uploads, and drawing share cards.

## First-time setup

1. Create a free project at supabase.com.
2. Supabase → **SQL Editor** → paste all of `supabase/schema.sql` → **Run**.
3. Supabase → **Settings → API**: copy the **Project URL** and the **anon public** key into `shared/brand.js` under `supabase`.
4. GitHub → repo **Settings → Pages** → Source: **GitHub Actions**. Custom domain: `playbee.pro`.
5. At your domain registrar, point `playbee.pro` at GitHub Pages (A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; CNAME `www` → `<your-github-username>.github.io`).
6. Push. The site is live once the "Deploy to GitHub Pages" action finishes.

To copy games from an old local database (`data/app.db` + `data/uploads`):

```bash
SUPABASE_SERVICE_KEY=<service_role key> npm run migrate
```

The service key is secret. Use it only on your own computer, never commit it.

## Working on it

```bash
npm install
npm run dev     # http://localhost:5317, talks to the Supabase project in shared/brand.js
```

`npm run build:pages` builds exactly what GitHub publishes, into `dist/`.

## Layout

- `client/` React + Vite site. `client/src/formats/*` has the editor, player and result screen for each game type.
- `shared/formats/*` rules for each game type: checking a new game, checking a play, crowd stats, and what goes on the share card. Used by the site and the build.
- `shared/card.js` draws the 1200×630 share card (SVG). The browser paints it on a canvas; the build uses resvg.
- `shared/brand.js` name, domain, colours, Supabase details.
- `tools/` Node scripts: the Pages build, the one-off migration, card rendering, and the starter game content (`seeds.js`, `seedsFresh.js`).
- `supabase/schema.sql` the database.

## Privacy

Plays are stored as just "what was picked". No accounts or names. To stop spam, a scrambled network address is kept for at most an hour. The browser remembers which results and games are yours in localStorage.

Fonts: Rubik and Archivo Black, SIL Open Font License (see `tools/fonts`).
