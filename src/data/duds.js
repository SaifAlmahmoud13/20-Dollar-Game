// How many items at the END of each theme's list are duds (the funny bad picks).
// The offline judge scores duds low; the items before them, best first, score high.
// Themes not listed have 3 duds.
export const DEFAULT_DUDS = 3;

export default {
  // Food
  burger: 2, kebab: 2, 'pancakes-waffles': 2, 'bbq-platter': 2, 'grilled-cheese': 2, 'ice-cream-sundae': 2,
  'pasta-bowl': 2, tacos: 1, ramen: 2, 'birthday-cake': 2, 'vending-machine': 2, 'poke-bowl': 1, raclette: 2,
  // Lifestyle
  'dream-house': 2, 'dream-bedroom': 2, 'dream-garden': 2, 'perfect-life': 2, 'dream-vacation': 4, 'dream-kitchen': 2,
  'perfect-face': 5, 'boomer-household': 0,
  // Party
  'house-party': 4, 'girls-night': 2, 'birthday-party': 2, 'drinking-games': 5, 'rooftop-party': 5,
  'christmas-morning': 5, 'new-year-s-eve': 5,
  // Sports & Gaming
  'clash-royale-deck': 0, 'nba-teams': 1, 'champions-league-xi': 0, 'england-xi': 1, 'sport-goats': 0,
  'home-theater': 4, 'sports-bar': 4, 'nba-dream-team': 0,
  // Heroes & Anime
  'avengers-team': 0, 'one-piece-crew': 1, 'rapper-lineup': 1, 'youtuber-squad': 4, 'disney-pixar-team': 0,
  'naruto-team': 1, 'dragon-ball-team': 2, 'anime-all-stars': 1, 'justice-league': 2, 'supervillain-team': 2,
  'spider-verse-team': 2, 'x-men-team': 0, 'gotham-crew': 2, 'superhero-arsenal': 2, 'hogwarts-team': 2,
  fellowship: 4, 'demon-slayer-squad': 1, 'movie-villain-team': 2, 'tv-dream-team': 0, 'sitcom-flat-share': 0,
  'animated-dream-team': 1,
  // Adventure
  'fighter-for-a-1v1': 5, 'desert-island-setup': 2, 'zombie-survival-kit': 2, 'doomsday-bunker': 2,
  'your-own-planet': 2, 'your-own-country': 2, 'theme-park': 0, 'haunted-house': 0, 'camping-trip': 4,
  'spy-kit': 2, 'wizard-s-tower': 2,
};
