// The Anthropic SDK is only downloaded the first time an AI feature is used.
export { AIError } from './errors.js';

export const generateTheme = async (...args) => (await import('./claude.js')).generateTheme(...args);
export const judgeGame = async (...args) => (await import('./claude.js')).judgeGame(...args);
