import food from './themes/food.js';
import lifestyle from './themes/lifestyle.js';
import party from './themes/party.js';
import sports from './themes/sports.js';
import heroes from './themes/heroes.js';
import adventure from './themes/adventure.js';
import IMAGES from './theme-images.js';
import DUDS, { DEFAULT_DUDS } from './duds.js';
import SCENES, { CATEGORY_SCENES } from './scenes.js';
import SCENE_IMAGES from './scene-images.js';

// Vite sets BASE_URL; plain Node (tests, scripts) has no import.meta.env.
const BASE = import.meta.env?.BASE_URL ?? '/';

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

// The empty backdrop a theme's player boards use (see scenes.js), if its photo exists.
function sceneFor(id, category) {
  const scene = SCENES[id] ?? CATEGORY_SCENES[category];
  return SCENE_IMAGES[scene] ? `${BASE}scenes/${scene}.webp` : null;
}

const build = (category, rows) =>
  rows.map(([name, emoji, items]) => ({
    id: slugify(name),
    name,
    emoji,
    category,
    items: parseItems(items),
    duds: DUDS[slugify(name)] ?? DEFAULT_DUDS,
    image: IMAGES[slugify(name)] ? `${BASE}themes/${slugify(name)}.webp` : null,
    scene: sceneFor(slugify(name), category),
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

// Photo when the theme has one, otherwise its colour gradient. `shade` darkens the photo
// so text or stickers on top stay readable.
export function themeBackground(theme, shade = 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))') {
  return theme.image ? `${shade}, url("${theme.image}") center / cover` : themeGradient(theme.id);
}

// A player board: the theme's empty scene, else its photo, else its colour gradient.
export function boardBackground(theme) {
  return theme.scene ? `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.25)), url("${theme.scene}") center / cover` : themeBackground(theme);
}

export const PHOTO_CREDITS = [
  ...Object.entries(IMAGES).map(([id, credit]) => ({ id, ...credit })),
  ...Object.entries(SCENE_IMAGES).map(([id, credit]) => ({ id, scene: true, ...credit })),
];
