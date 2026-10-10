# Playbee

Live at **https://playbee.pro**.

> To rename the site, edit `shared/brand.js` (name, domain, tagline, description, colour) and rebuild. Nothing else mentions the name.

Make-your-own BuzzFeed-style games: blind rankings, quizzes, this-or-that and friends. Anyone can make one, every game gets its own link, and every result turns into a share card.

## Run it locally

Needs Node 20+.

```bash
npm install
npm run seed            # a few starter games (add `-- --demo-plays` to fake some plays for testing)
npm run dev             # site on http://localhost:5317, api on :4317
```

Production:

```bash
npm run build
npm start   # serves everything on PORT (default 4317)
```

In production, share links and cards use https://playbee.pro (from `shared/brand.js`). Set `PUBLIC_URL` only to override it, e.g. for a staging copy. Data (SQLite + uploads) lives in `./data`, or wherever `DATA_DIR` points.

## Formats

Blind ranking, this or that, would you rather, poll (live results), trivia quiz, personality quiz, tier list, bracket, and rate these. Every one ends on a result page with its own link and a share card.

## Pictures

Anything that can have a picture has a camera button: items, both sides of a pair, quiz questions, quiz answers, personality results and covers. It opens one dialog that:

- searches as you type, pre-filled with what you already wrote (Wikipedia first, then iTunes artwork for Music/Movies/TV, then Creative Commons photos from Openverse; no API keys needed)
- uploads from your device (resized to 900px on the server)
- or takes a pasted https link

"Find pictures for me" fills in every item that has a name but no picture yet. Picked search results are copied onto our own disk so they never break, and they show up on share cards too.

Picture searches identify themselves to Wikimedia with https://playbee.pro, as Wikimedia asks; set `IMAGE_SEARCH_CONTACT` to use an email instead.

Heads up on rights: Wikipedia and iTunes pictures of films, albums and characters are usually copyrighted (Wikipedia uses them under fair use). That's normal for fan-made quizzes, but for brand/sponsored games use pictures the brand provides.

## How it fits together

- `server/` Express + SQLite. `server/formats/*` holds the rules for each game type: validating a new game, validating a play, crowd stats, and what goes on the share card.
- `server/card.js` draws the 1200×630 share image as SVG and turns it into a PNG (no headless browser).
- `client/` React + Vite. `client/src/formats/*` has the editor, player and result screen for each game type.
- `shared/meta.js` site name, categories and the list of formats, used by both sides.

Pages:

| URL | What |
| --- | --- |
| `/` | homepage: make, trending this week, categories, newest |
| `/play/:slug` | play a game |
| `/r/:id` | one person's result (this is what gets shared) |
| `/make`, `/make/:type` | create |
| `/browse/:category?` | browse, sort by newest / most played |
| `/card/play/:slug.png`, `/card/r/:id.png` | share images |

## Privacy

Plays are stored as just "what was picked". No accounts, IPs or user ids are saved with them. The browser remembers which results are yours in localStorage.

## Adding a format

1. `server/formats/<name>.js` with `validate`, `validatePlay`, `aggregate`, `card`, `summary`, then register it in `server/formats/index.js`.
2. `client/src/formats/<name>.jsx` with `blank`, `check`, `Editor`, `Player`, `Result`, `shareText`, then register it in `client/src/formats/index.js`.
3. Add it to `FORMATS` in `shared/meta.js` and give it a doodle in `client/src/components/FormatArt.jsx`.

Fonts: Rubik and Archivo Black, both SIL Open Font License (see `server/fonts`).
