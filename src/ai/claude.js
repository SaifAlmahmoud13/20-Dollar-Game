import Anthropic from '@anthropic-ai/sdk';
import { AIError } from './errors.js';
import { JUDGE_INSTRUCTIONS, THEME_INSTRUCTIONS, cleanJudgement, cleanTheme, judgeRequest, themeRequest } from './prompts.js';

const MODEL = 'claude-opus-5-5';

function client(apiKey) {
  // The key is typed in by the players and stays in this browser.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

async function askJSON(apiKey, { system, prompt, schema }) {
  let res;
  try {
    res = await client(apiKey).beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      system,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AIError('That API key was rejected. Check it in Settings.');
    if (err instanceof Anthropic.PermissionDeniedError) throw new AIError('This API key is not allowed to use the model.');
    if (err instanceof Anthropic.RateLimitError) throw new AIError('Rate limited. Wait a moment and try again.');
    if (err instanceof Anthropic.APIConnectionError) throw new AIError('Could not reach Claude. Are you online?');
    if (err instanceof Anthropic.APIError) throw new AIError(`Claude API error (${err.status ?? 'unknown'}).`);
    throw err;
  }
  if (res.stop_reason === 'refusal') throw new AIError('Claude declined that one. Try something else.');
  if (res.stop_reason === 'max_tokens') throw new AIError('The answer was cut off. Try again.');
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  try {
    return JSON.parse(text);
  } catch {
    throw new AIError('Got an unreadable answer. Try again.');
  }
}

const THEME_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short theme title, 1-4 words, e.g. "Pirate ship"' },
    emoji: { type: 'string', description: 'One emoji for the theme' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '1-4 words' },
          emoji: { type: 'string', description: 'One emoji' },
        },
        required: ['name', 'emoji'],
        additionalProperties: false,
      },
    },
  },
  required: ['name', 'emoji', 'items'],
  additionalProperties: false,
};

export async function generateTheme(apiKey, idea) {
  const out = await askJSON(apiKey, { system: THEME_INSTRUCTIONS, prompt: themeRequest(idea), schema: THEME_SCHEMA });
  return cleanTheme(out, idea);
}

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          player: { type: 'integer', description: 'Player number as given in the prompt' },
          score: { type: 'number', description: 'Score from 0.0 to 10.0, one decimal' },
        },
        required: ['player', 'score'],
        additionalProperties: false,
      },
    },
    verdict: { type: 'string', description: '2-3 punchy sentences' },
  },
  required: ['scores', 'verdict'],
  additionalProperties: false,
};

export async function judgeGame(apiKey, game, label = 'Player') {
  const out = await askJSON(apiKey, { system: JUDGE_INSTRUCTIONS, prompt: judgeRequest(game, label), schema: JUDGE_SCHEMA });
  return cleanJudgement(out, game);
}
