// A display font that fits each theme, used for its name during the game. The fonts ship
// with the game (src/fonts.css), so they work offline too. Custom themes use the normal font.
const FONTS = {
  pirate: "'Pirata One', serif",
  comic: "'Bangers', sans-serif",
  spooky: "'Creepster', sans-serif",
  space: "'Orbitron', sans-serif",
  medieval: "'Cinzel Decorative', serif",
  pixel: "'Press Start 2P', monospace",
  typewriter: "'Special Elite', monospace",
  fun: "'Luckiest Guy', sans-serif",
  diner: "'Lobster', cursive",
  sporty: "'Bebas Neue', sans-serif",
  fancy: "'Pacifico', cursive",
  marker: "'Permanent Marker', cursive",
  festive: "'Mountains of Christmas', cursive",
};

const BY_CATEGORY = { food: 'diner', lifestyle: 'fancy', party: 'fun', sports: 'sporty', heroes: 'comic', adventure: 'fun' };

const BY_THEME = {
  'pirate-ship': 'pirate',
  'haunted-house': 'spooky', 'halloween-party': 'spooky', 'zombie-survival-kit': 'spooky', 'your-own-monster': 'spooky',
  'doomsday-bunker': 'typewriter', 'doomsday-crew': 'typewriter', 'spy-kit': 'typewriter', 'heist-crew': 'typewriter',
  'space-mission': 'space', 'your-own-planet': 'space', 'star-wars-crew': 'space',
  castle: 'medieval', dragon: 'medieval', 'wizard-s-tower': 'medieval', fellowship: 'medieval', 'hogwarts-team': 'medieval',
  'your-own-country': 'medieval',
  'minecraft-base': 'pixel', 'game-console': 'pixel', 'gaming-setup': 'pixel', 'fortnite-loadout': 'fun',
  'clash-royale-deck': 'fun', 'streamer-setup': 'pixel', 'board-game-night': 'fun', 'home-theater': 'fun', playground: 'fun',
  'skate-park': 'marker', 'road-trip': 'marker', 'camping-trip': 'marker', 'desert-island-setup': 'marker',
  'school-lunchbox': 'marker', 'childhood-snacks': 'fun', 'candy-shop-haul': 'fun', 'birthday-cake': 'fun',
  'christmas-morning': 'festive', 'new-year-s-eve': 'fancy', 'movie-night': 'fun', 'prom-night': 'fancy',
  'fixer-upper-house': 'marker', 'fixer-upper-car': 'marker', 'boomer-household': 'diner',
  'rapper-lineup': 'sporty', 'youtuber-squad': 'fun', 'disney-pixar-team': 'fun', 'animated-dream-team': 'fun',
  'tv-dream-team': 'sporty', 'sitcom-flat-share': 'fun', 'movie-villain-team': 'spooky',
};

// The CSS font-family for a theme's name, or undefined for the game's normal font.
export function themeFont(theme) {
  return FONTS[BY_THEME[theme?.id] ?? BY_CATEGORY[theme?.category]];
}

export const ALL_FONTS = Object.values(FONTS);
