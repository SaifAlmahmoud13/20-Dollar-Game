# $20 Challenge

A pass-and-play version of the TikTok auction draft party game. Everyone gets $20, a theme like
**Pirate ship**, **One Piece crew** or **Theme park** is revealed, and items are auctioned one by one.
Outbid your friends, hype up the duds, and build the best version of the theme.

Mobile-first web app (React + Vite). Play on one phone passed around the room, or install it to the home screen.

## How a round works

1. Add 2–8 players (or teams).
2. Pick which themes can come up: 129 built-in themes across Popular, Food, Lifestyle, Party,
   Sports & Gaming, Heroes & Anime and Adventure, plus your own.
3. A random theme is revealed. Shuffle if you don't like it.
4. Each item goes up for auction. Players shout bids, the auctioneer sets the price and taps **Sold** next to the winner.
   Everyone has the same number of slots. Once yours are full you're out, and if only one player still has room,
   they get the remaining items for free. A mistake can be undone.
5. Compare boards. Either the **AI judge** scores every build out of 10 and roasts the losers, or you vote.
6. Rematch on the same theme, or roll a new one. Wins are tallied across rounds.

Budget per player ($5–$100) and items per round (4–16) are under **Advanced options**.

## AI features

**Create with AI** turns any idea ("Jujutsu Kaisen team", "Survive a week in the jungle") into a full theme, and
the **AI judge** scores the final boards with a roast.

- **With internet** the app uses [Pollinations](https://pollinations.ai), a free AI service that needs no account
  or key. Player names and the items they bought are sent to it to be judged.
- **Without internet**, or if the AI can't be reached, the built-in offline judge (`src/game/judge.js`) scores the
  boards instead. Each theme lists its must-have items first and its duds last (`src/data/duds.js`).

Other builds (set `VITE_AI` at build time): `viewer` uses Claude through the claude.ai Artifact viewer (see below),
`api` uses the Anthropic API with a key players paste in ⚙️ (stored only in their browser), and `off` uses only the
offline judge.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # game rules + theme data checks
npm run build    # static site in dist/
```

`dist/` is a static site and can be hosted anywhere. `npm run build` also writes `dist/sw.js`, a service worker
that stores the whole game (code, photos, sounds) on first visit, so it then opens and plays offline and can be
added to a phone's home screen.

Every push to the main branch is published to GitHub Pages by `.github/workflows/pages.yml`
(https://saifalmahmoud13.github.io/20-Dollar-Game/). Pages must be switched on once under
Settings → Pages → Source: GitHub Actions.

`npm run build:artifact` builds a version for a claude.ai Artifact in `dist-artifact/`: one page with the JS and
CSS inlined, plus `themes/*.webp` published alongside it. Artifacts can't reach the Anthropic API directly, so this
build asks Claude through the viewer's `sample` capability instead (publish with `capabilities: {sample: {}}`): the
AI judge and AI themes run on the player's own Claude account, with no API key.

## Project layout

```
src/
  data/themes/*.js   theme content, one file per category
  data/index.js      categories, Popular list, theme colours
  game/logic.js      pure auction rules (tested in logic.test.js)
  ai/                Claude calls, lazy-loaded so the SDK only downloads when AI is used
  screens/           Home → Players → Themes → Reveal → Auction → Results
  components/        boards, theme cards, modals, small UI pieces
```

### Theme photos

Theme cards, the reveal and the result boards show a photo per theme (falling back to a colour gradient and emoji).
Photos live in `public/themes/<id>.webp` and their credits in `src/data/theme-images.js`, which the Help screen
lists. To (re)fetch them:

```bash
npm run theme-images                          # every theme without a photo yet
npm run theme-images -- --only pizza --force  # replace one
PIXABAY_API_KEY=... npm run theme-images      # use Pixabay (fast, recommended)
PEXELS_API_KEY=... npm run theme-images       # or Pexels; without a key it uses Wikimedia Commons (slow)
```

Search terms are in `scripts/image-queries.js`. Use `{ q: '...', pick: 2 }` to take a later result when the first
one is a bad fit.

### Board scenes

While bidding and on the results screen, each player's items are placed as stickers on an empty scene for
the theme (grass for Theme park, a basement for Boys' night, a ship's deck for One Piece…). The 31 scenes are in
`public/scenes/`, chosen per theme in `src/data/scenes.js`, and fetched with
`npm run theme-images -- --scenes` (search terms in `scripts/scene-queries.js`).

### Landscape and portrait

The game is landscape by default; **Portrait mode** under Advanced options switches it. On a phone held the other
way, the game asks the screen to turn and, if it can't, rotates its own view (`src/lib/layout.js`).

### Adding a theme

Add a row to the matching file in `src/data/themes/`:

```js
['Pirate ship', '🏴‍☠️', '⛵ Black sails|💣 Cannons|🗺️ Treasure map|…'],
```

Give it at least 16 items, mixing must-haves with a few funny duds. Tests fail if a theme has too few items or a
duplicate name. To feature it, add its id (the slugified name, e.g. `pirate-ship`) to `POPULAR_IDS` in
`src/data/index.js`.
