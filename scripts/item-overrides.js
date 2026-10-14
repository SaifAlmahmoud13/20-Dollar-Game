// Fixes for item pictures, keyed "theme-id/Item name":
//   false            keep the emoji (no picture)
//   { q, pick }      search for something else and/or take a later match
export default {};

// Themes made of characters, real people or video-game items keep their emoji: pictures of them
// belong to their owners, and photos of the real thing don't fit a game's look.
export const SKIP_THEMES = new Set([
  'avengers-team', 'superhero-squad', 'one-piece-crew', 'rapper-lineup', 'youtuber-squad', 'disney-pixar-team',
  'star-wars-crew', 'naruto-team', 'dragon-ball-team', 'pokemon-team', 'anime-all-stars', 'justice-league',
  'supervillain-team', 'spider-verse-team', 'x-men-team', 'gotham-crew', 'hogwarts-team', 'fellowship',
  'demon-slayer-squad', 'movie-villain-team', 'tv-dream-team', 'sitcom-flat-share', 'animated-dream-team',
  'nba-teams', 'champions-league-xi', 'england-xi', 'sport-goats', 'nba-dream-team', 'clash-royale-deck',
  'transfer-window', 'minecraft-base', 'fortnite-loadout', 'superhero-arsenal', 'fighter-for-a-1v1',
]);
