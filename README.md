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

## AI features (optional)

**Create with AI** turns any idea ("Jujutsu Kaisen team", "Survive a week in the jungle") into a full theme, and
the **AI judge** scores the final boards. Both use Claude (`claude-opus-5-5`).

Open ⚙️ on the theme screen and paste an Anthropic API key from
[console.anthropic.com](https://console.anthropic.com/settings/keys). The key is stored in the browser's
localStorage and sent directly from the browser to the Anthropic API. That's fine on your own device, but don't
deploy this publicly with a shared key baked in. Put a small backend in front if you want to offer AI to strangers.

Without a key the whole game still works: themes can be written by hand (**Create with AI → Write my own**)
and players vote on the winner.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # game rules + theme data checks
npm run build    # static site in dist/
```

`dist/` is a static site and can be hosted anywhere (Netlify, Vercel, GitHub Pages, …).

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
PEXELS_API_KEY=... npm run theme-images       # use Pexels instead of Wikimedia Commons
```

Search terms are in `scripts/image-queries.js`. Use `{ q: '...', pick: 2 }` to take a later result when the first
one is a bad fit.

### Adding a theme

Add a row to the matching file in `src/data/themes/`:

```js
['Pirate ship', '🏴‍☠️', '⛵ Black sails|💣 Cannons|🗺️ Treasure map|…'],
```

Give it at least 16 items, mixing must-haves with a few funny duds. Tests fail if a theme has too few items or a
duplicate name. To feature it, add its id (the slugified name, e.g. `pirate-ship`) to `POPULAR_IDS` in
`src/data/index.js`.
