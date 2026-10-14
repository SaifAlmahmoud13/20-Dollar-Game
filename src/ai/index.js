// How the game reaches an AI, chosen at build time with VITE_AI:
//   (unset)  free   Pollinations, a free AI service: no account, key or payment
//   viewer   the claude.ai Artifact viewer: Claude on the player's own Claude account
//   api      the Anthropic API, with an API key the players paste in Settings
//   off      no AI: the offline judge and hand-written themes only
// Without internet the game always uses its offline judge (game/judge.js).
// The Anthropic SDK is only downloaded the first time an AI feature is used; the
// small viewer provider is bundled in, since an Artifact page is a single file.
import * as viewer from './viewer.js';
import * as free from './free.js';

export { AIError } from './errors.js';

const MODE = import.meta.env?.VITE_AI ?? 'free';
export const AI_MODE = MODE;

export const AI_ENABLED = MODE !== 'off';
export const NEEDS_KEY = MODE === 'api';

const provider = async () => (MODE === 'viewer' ? viewer : MODE === 'free' ? free : import('./claude.js'));

export const generateTheme = async (...args) => (await provider()).generateTheme(...args);
export const judgeGame = async (...args) => (await provider()).judgeGame(...args);

// Whether the AI judge can be tried right now: there's internet (and, for the API-key
// version, a key). Otherwise the game uses its offline judge.
export const aiJudgeReady = (apiKey) =>
  AI_ENABLED && (!NEEDS_KEY || !!apiKey) && (typeof navigator === 'undefined' || navigator.onLine !== false);
