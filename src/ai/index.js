// How the game reaches Claude, chosen at build time with VITE_AI:
//   (unset)  the Anthropic API, with an API key the players paste in Settings
//   viewer   the claude.ai Artifact viewer, on the player's own Claude account
//   off      no AI: players vote and write their own themes
// The Anthropic SDK is only downloaded the first time an AI feature is used; the
// small viewer provider is bundled in, since an Artifact page is a single file.
import * as viewer from './viewer.js';

export { AIError } from './errors.js';

const MODE = import.meta.env?.VITE_AI ?? 'api';

export const AI_ENABLED = MODE !== 'off';
export const NEEDS_KEY = MODE === 'api';

const provider = async () => (MODE === 'viewer' ? viewer : import('./claude.js'));

export const generateTheme = async (...args) => (await provider()).generateTheme(...args);
export const judgeGame = async (...args) => (await provider()).judgeGame(...args);

// Whether the real AI judge can be tried right now: there's internet, and (for the
// API-key version) a key. Otherwise the game uses its offline judge.
export const aiJudgeReady = (apiKey) =>
  AI_ENABLED && (!NEEDS_KEY || !!apiKey) && (typeof navigator === 'undefined' || navigator.onLine !== false);
