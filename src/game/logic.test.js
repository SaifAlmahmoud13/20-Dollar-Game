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
  it('every theme has a board scene', async () => {
    const { default: SCENES } = await import('../data/scenes.js');
    const { default: SCENE_IMAGES } = await import('../data/scene-images.js');
    for (const id of Object.values(SCENES)) expect(SCENE_IMAGES[id], id).toBeTruthy();
    for (const t of ALL_THEMES) expect(t.scene, t.name).toBeTruthy();
    for (const id of Object.keys(SCENES)) expect(THEMES_BY_ID[id], id).toBeTruthy();
  });

  it('every credited photo exists and belongs to a real theme', async () => {
    const { existsSync } = await import('node:fs');
    const { PHOTO_CREDITS } = await import('../data/index.js');
    for (const c of PHOTO_CREDITS) {
      if (!c.scene) expect(THEMES_BY_ID[c.id], c.id).toBeTruthy();
      expect(existsSync(new URL(`../../public/${c.scene ? 'scenes' : 'themes'}/${c.id}.webp`, import.meta.url)), c.id).toBe(true);
      expect(c.author && c.license && c.page, c.id).toBeTruthy();
    }
  });

  it('item pictures point at real sprite cells and real items', async () => {
    const { existsSync } = await import('node:fs');
    const { default: ITEM_IMAGES } = await import('../data/item-images.js');
    const { itemPicture } = await import('../data/index.js');
    for (const [id, sheet] of Object.entries(ITEM_IMAGES)) {
      const t = THEMES_BY_ID[id];
      expect(t, id).toBeTruthy();
      expect(existsSync(new URL(`../../public/items/${sheet.file}`, import.meta.url)), id).toBe(true);
      for (const [name, i] of Object.entries(sheet.items)) {
        expect(t.items.some((it) => it.name === name), `${id}: ${name}`).toBe(true);
        expect(i, `${id}: ${name}`).toBeLessThan(sheet.cols * sheet.rows);
        expect(itemPicture(t, name).backgroundImage, name).toContain(`items/${sheet.file}`);
      }
    }
  });

  it('custom themes borrow pictures by item name; unknown items keep their emoji', async () => {
    const { default: ITEM_IMAGES } = await import('../data/item-images.js');
    const { itemPicture } = await import('../data/index.js');
    const [id, sheet] = Object.entries(ITEM_IMAGES)[0];
    const name = Object.keys(sheet.items)[0];
    expect(itemPicture({ id: 'custom-x' }, ` ${name.toUpperCase()} `).backgroundImage).toContain(`items/${sheet.file}`);
    expect(itemPicture({ id: 'custom-x' }, 'Definitely not an item')).toBeNull();
    expect(itemPicture(THEMES_BY_ID[id], 'Definitely not an item')).toBeNull();
  });
});

describe('money helpers', () => {
  it('formats money', async () => {
    const { money, shortMoney, clamp } = await import('../lib/format.js');
    expect(money(1000000)).toBe('$1,000,000');
    expect(shortMoney(250000)).toBe('$250K');
    expect(clamp(5_000_000, 0, 1_000_000)).toBe(1_000_000);
  });

  it('runs a million-dollar game', () => {
    let g = createGame({ names: ['A', 'B'], theme, budget: 1_000_000, itemsPerRound: 4, rng: seeded() });
    g = sell(g, 0, 750_000);
    expect(g.players[0].money).toBe(250_000);
    expect(canBuy(g, 0, 250_001)).toBe(false);
    expect(maxBid(g)).toBe(1_000_000);
  });
});

describe('offline judge', () => {
  it('scores must-haves above duds and names the winner', async () => {
    const { localJudge, itemQuality } = await import('./judge.js');
    const pizza = THEMES_BY_ID['pizza'];
    expect(itemQuality(pizza, 'Fresh mozzarella')).toBeGreaterThan(9);
    expect(itemQuality(pizza, 'Ketchup base')).toBeLessThan(2);
    const item = (name, price) => ({ ...pizza.items.find((it) => it.name === name), price });
    const game = {
      theme: pizza,
      budget: 20,
      slots: 2,
      players: [
        { name: 'Ana', money: 10, items: [item('Fresh mozzarella', 6), item('Pepperoni', 4)] },
        { name: 'Ben', money: 12, items: [item('Raw egg', 5), item('Ketchup base', 3)] },
      ],
    };
    const { scores, verdict } = localJudge(game);
    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(verdict).toContain('Ana');
    expect(verdict).toMatch(/Ben/);
    expect(localJudge(game).verdict).toBe(verdict); // same game, same verdict
    expect(verdict).not.toMatch(/\$|paid|spent|steal|robbery|splash/i); // money never matters
  });

  it('every theme has fewer duds than items', () => {
    for (const t of ALL_THEMES) expect(t.duds, t.name).toBeLessThan(t.items.length - 6);
  });
});
