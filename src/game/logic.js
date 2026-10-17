// Pure game rules. Every function returns a new game object; nothing mutates.

export const PLAYER_COLORS = ['#f39200', '#7c5cff', '#22c3a6', '#ff4f79', '#3fa9f5', '#e6c229', '#9be15d', '#ff8a4c'];

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Everyone gets the same number of slots; once yours are full you stop bidding.
export const slotsPerPlayer = (itemCount, playerCount) => Math.ceil(itemCount / playerCount);

export function createGame({ names, theme, budget = 20, itemsPerRound = 10, rng = Math.random }) {
  const count = Math.min(itemsPerRound, theme.items.length);
  return {
    theme,
    budget,
    queue: shuffle(theme.items, rng).slice(0, count),
    index: 0,
    slots: slotsPerPlayer(count, names.length),
    starter: Math.floor(rng() * names.length), // who opens the bidding, announced as the auction starts
    players: names.map((name, i) => ({
      name,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      money: budget,
      items: [],
    })),
  };
}

export const currentItem = (game) => game.queue[game.index] ?? null;
export const isOver = (game) => game.index >= game.queue.length;
export const hasRoom = (game, p) => game.players[p].items.length < game.slots;

export const canBuy = (game, p, price) =>
  !isOver(game) && hasRoom(game, p) && price >= 0 && game.players[p].money >= price;

export const playersWithRoom = (game) =>
  game.players.map((_, i) => i).filter((i) => hasRoom(game, i));

// Highest price anyone who can still take items could pay.
export const maxBid = (game) =>
  Math.max(0, ...playersWithRoom(game).map((i) => game.players[i].money));

export function sell(game, p, price) {
  if (!canBuy(game, p, price)) throw new Error('Illegal sale');
  const item = { ...currentItem(game), price };
  return {
    ...game,
    index: game.index + 1,
    players: game.players.map((pl, i) =>
      i === p ? { ...pl, money: pl.money - price, items: [...pl.items, item] } : pl,
    ),
  };
}

// When only one player still has room, the item is theirs for free.
export function forcedWinner(game) {
  const open = playersWithRoom(game);
  return open.length === 1 ? open[0] : null;
}

export const spent = (game, p) => game.budget - game.players[p].money;
