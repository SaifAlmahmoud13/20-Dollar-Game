import { describe, expect, it } from 'vitest';
import { createGame, sell, canBuy, isOver, forcedWinner, maxBid, slotsPerPlayer, currentItem } from './logic.js';
import { ALL_THEMES, CATEGORIES, THEMES_BY_ID } from '../data/index.js';

const theme = THEMES_BY_ID['pirate-ship'];
const seeded = () => {
  let s = 42;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

describe('themes', () => {
  it('have unique ids and enough items for a full round', () => {
    const ids = ALL_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of ALL_THEMES) {
      expect(t.items.length, t.name).toBeGreaterThanOrEqual(16);
      for (const item of t.items) {
        expect(item.emoji, `${t.name}: ${item.name}`).toBeTruthy();
        expect(item.name, t.name).toBeTruthy();
      }
    }
  });

  it('popular list only references real themes', () => {
    expect(CATEGORIES[0].themes.every(Boolean)).toBe(true);
  });
});

describe('auction', () => {
  it('splits slots evenly, rounding up', () => {
    expect(slotsPerPlayer(10, 2)).toBe(5);
    expect(slotsPerPlayer(10, 3)).toBe(4);
  });

  it('deducts money and assigns the item', () => {
    let g = createGame({ names: ['A', 'B'], theme, rng: seeded() });
    const item = currentItem(g);
    g = sell(g, 0, 7);
    expect(g.players[0].money).toBe(13);
    expect(g.players[0].items[0]).toMatchObject({ ...item, price: 7 });
    expect(g.index).toBe(1);
  });

  it('blocks bids a player cannot afford or has no room for', () => {
    let g = createGame({ names: ['A', 'B'], theme, itemsPerRound: 4, rng: seeded() });
    expect(canBuy(g, 0, 21)).toBe(false);
    g = sell(g, 0, 20);
    expect(canBuy(g, 0, 1)).toBe(false);
    expect(canBuy(g, 0, 0)).toBe(true);
    g = sell(g, 0, 0);
    expect(canBuy(g, 0, 0)).toBe(false); // slots full
    expect(() => sell(g, 0, 0)).toThrow();
  });

  it('hands remaining items to the last player with room, then ends', () => {
    let g = createGame({ names: ['A', 'B'], theme, itemsPerRound: 4, rng: seeded() });
    g = sell(g, 0, 3);
    g = sell(g, 0, 3);
    expect(forcedWinner(g)).toBe(1);
    expect(maxBid(g)).toBe(20);
    g = sell(g, 1, 0);
    g = sell(g, 1, 0);
    expect(isOver(g)).toBe(true);
  });
});

describe('theme photos', () => {
  it('every credited photo exists and belongs to a real theme', async () => {
    const { existsSync } = await import('node:fs');
    const { PHOTO_CREDITS } = await import('../data/index.js');
    for (const c of PHOTO_CREDITS) {
      expect(THEMES_BY_ID[c.id], c.id).toBeTruthy();
      expect(existsSync(new URL(`../../public/themes/${c.id}.webp`, import.meta.url)), c.id).toBe(true);
      expect(c.author && c.license && c.page, c.id).toBeTruthy();
    }
  });
});
