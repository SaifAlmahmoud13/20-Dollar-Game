import food from './themes/food.js';
import lifestyle from './themes/lifestyle.js';
import party from './themes/party.js';
import sports from './themes/sports.js';
import heroes from './themes/heroes.js';
import adventure from './themes/adventure.js';

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// "🍕 Pepperoni|🧀 Mozzarella" -> [{ emoji, name }]
export function parseItems(str) {
  return str.split('|').map((entry) => {
    const s = entry.trim();
    const i = s.indexOf(' ');
    return { emoji: s.slice(0, i), name: s.slice(i + 1).trim() };
  });
}

const build = (category, rows) =>
  rows.map(([name, emoji, items]) => ({
    id: slugify(name),
    name,
    emoji,
    category,
    items: parseItems(items),
  }));

const BUILT_IN = {
  food: build('food', food),
  lifestyle: build('lifestyle', lifestyle),
  party: build('party', party),
  sports: build('sports', sports),
  heroes: build('heroes', heroes),
  adventure: build('adventure', adventure),
};

export const ALL_THEMES = Object.values(BUILT_IN).flat();
export const THEMES_BY_ID = Object.fromEntries(ALL_THEMES.map((t) => [t.id, t]));

const POPULAR_IDS = [
  'pirate-ship', 'desert-island-setup', 'burger', 'perfect-life', 'pool-party',
  'zombie-survival-kit', 'one-piece-crew', 'demon-slayer-squad', 'theme-park',
  'pizza', 'boys-night', 'girls-night', 'dream-house', 'avengers-team',
  'fighter-for-a-1v1', 'private-island', 'fast-food-meal', 'house-party',
  'pokemon-team', 'gaming-setup',
];

export const CATEGORIES = [
  { id: 'popular', name: 'Popular', emoji: '🏆', themes: POPULAR_IDS.map((id) => THEMES_BY_ID[id]) },
  { id: 'food', name: 'Food', emoji: '🍭', themes: BUILT_IN.food },
  { id: 'lifestyle', name: 'Lifestyle', emoji: '🏠', themes: BUILT_IN.lifestyle },
  { id: 'party', name: 'Party', emoji: '🥂', themes: BUILT_IN.party },
  { id: 'sports', name: 'Sports & Gaming', emoji: '🏈', themes: BUILT_IN.sports },
  { id: 'heroes', name: 'Heroes & Anime', emoji: '📺', themes: BUILT_IN.heroes },
  { id: 'adventure', name: 'Adventure', emoji: '⚔️', themes: BUILT_IN.adventure },
];

// Stable per-theme colours so every theme gets its own backdrop.
export function themeHue(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

export function themeGradient(id) {
  const h = themeHue(id);
  return `linear-gradient(150deg, hsl(${h} 62% 42%), hsl(${(h + 40) % 360} 55% 16%))`;
}
