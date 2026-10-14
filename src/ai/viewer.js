// AI through the claude.ai Artifact viewer's `sample` capability: the page asks
// Claude on the viewer's own Claude account, so no API key is involved.
// The viewer asks the player to allow it the first time.
import { AIError } from './errors.js';
import { JUDGE_INSTRUCTIONS, THEME_INSTRUCTIONS, cleanJudgement, cleanTheme, judgeRequest, themeRequest } from './prompts.js';

let samplePromise;
const getSample = () => {
  samplePromise ??= window.claude?.use ? window.claude.use('sample') : Promise.resolve(null);
  return samplePromise;
};

const MESSAGES = {
  not_granted: 'Claude isn’t allowed for this game. Vote on the winner instead.',
  sampling_disabled: 'Claude isn’t available on this account. Vote on the winner instead.',
  rate_limited: 'Claude is busy right now. Wait a minute and try again.',
  session_expired: 'You’ve been signed out of Claude. Sign in again and retry.',
  refused: 'Claude declined that one. Try something else.',
  invalid_json: 'Got an unreadable answer. Try again.',
  empty_completion: 'Got an empty answer. Try again.',
};

async function askJSON(prompt, options) {
  const sample = await getSample();
  if (!sample) throw new AIError('Claude isn’t available here. Open the game on claude.ai to use it.');
  try {
    return await sample.json(prompt, options);
  } catch (err) {
    throw new AIError(MESSAGES[err?.code] ?? 'Couldn’t reach Claude. Try again.');
  }
}

export async function generateTheme(_apiKey, idea) {
  const out = await askJSON(
    `${THEME_INSTRUCTIONS}\n\n${themeRequest(idea)}\n\n` +
      'Reply with only a JSON object like {"name": "Pirate ship", "emoji": "🏴‍☠️", "items": [{"name": "Cannons", "emoji": "💣"}]}.',
    { cache: false }, // "Try again" should give a new list
  );
  return cleanTheme(out, idea);
}

export async function judgeGame(_apiKey, game, label = 'Player') {
  const out = await askJSON(
    `${JUDGE_INSTRUCTIONS}\n\n${judgeRequest(game, label)}\n\n` +
      'Reply with only a JSON object like {"scores": [{"player": 1, "score": 7.5}], "verdict": "2-3 punchy sentences"} ' +
      'with one score from 0.0 to 10.0 for every player number above.',
  );
  return cleanJudgement(out, game);
}
