import Anthropic from '@anthropic-ai/sdk';
import { AIError } from './errors.js';

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
  const out = await askJSON(apiKey, {
    system:
      'You design themes for the "$20 Challenge", a party auction game. Players get a small budget, ' +
      'items for a theme are auctioned one by one, and everyone tries to build the best version of the theme. ' +
      'Good item lists mix about 6 must-have star items, 6 decent ones and 6 funny duds people will be stuck with. ' +
      'Items are concrete things, people or characters that fit the theme. Keep names short and recognisable.',
    prompt: `Create a theme for: ${idea}\n\nReturn exactly 18 items, each with one fitting emoji.`,
    schema: THEME_SCHEMA,
  });
  const items = (out.items ?? [])
    .filter((i) => i?.name && i?.emoji)
    .map((i) => ({ name: i.name.trim(), emoji: [...i.emoji.trim()].slice(0, 4).join('') || '⭐' }));
  if (items.length < 8) throw new AIError('Not enough items came back. Try again.');
  return { name: out.name?.trim() || idea, emoji: out.emoji?.trim() || '✨', items };
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
  const lines = game.players.map((p, i) => {
    const items = p.items.map((it) => `${it.name} ($${it.price})`).join(', ') || 'nothing';
    return `${label} ${i + 1} — "${p.name}": ${items}. Money left: $${p.money}.`;
  });
  const out = await askJSON(apiKey, {
    system:
      'You are the AI judge of the "$20 Challenge" party game. Players bid a small budget on items to build the best ' +
      'version of a theme. Judge how well each build fits the theme and works as a whole; money left over does not count. ' +
      'Use the full 0-10 range so the winner is clear. Your verdict is a playful roast like a game-show host: name the winner, ' +
      'tease the weakest picks, keep it friendly and PG-13. Refer to players by their names.',
    prompt: `Theme: ${game.theme.name}\n\n${lines.join('\n')}`,
    schema: JUDGE_SCHEMA,
  });
  const scores = game.players.map((_, i) => {
    const s = out.scores?.find((x) => x.player === i + 1)?.score;
    return Number.isFinite(s) ? Math.round(Math.min(10, Math.max(0, s)) * 10) / 10 : 0;
  });
  return { scores, verdict: out.verdict ?? '' };
}
