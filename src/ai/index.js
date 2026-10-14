// The Anthropic SDK is only downloaded the first time an AI feature is used.
export { AIError } from './errors.js';

// Off in builds where the page can't reach the Anthropic API (the claude.ai Artifact build).
export const AI_ENABLED = import.meta.env?.VITE_AI !== 'off';

export const generateTheme = async (...args) => (await import('./claude.js')).generateTheme(...args);
export const judgeGame = async (...args) => (await import('./claude.js')).judgeGame(...args);
