// AI through Pollinations (pollinations.ai), a free text-generation service that needs
// no account, key or payment. Used by the installed app whenever there's internet;
// if it can't be reached the game falls back to its offline judge.
// Player names and the items they bought are sent to the service to be judged.
import { AIError } from './errors.js';
import { JUDGE_INSTRUCTIONS, THEME_INSTRUCTIONS, cleanJudgement, cleanTheme, judgeRequest, themeRequest } from './prompts.js';

const ENDPOINT = 'https://text.pollinations.ai/openai';

// Pull one JSON object out of a reply, even if the model wrapped it in a sentence or code fence.
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('no JSON');
  }
}

async function askJSON(instructions, prompt, format) {
  const ctl = new AbortController();
  // Free and shared, so it can be slow: give up after 20 s and let the offline judge answer.
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctl.signal,
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: `${instructions}\n\nReply with only a JSON object like ${format}` },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        referrer: '20-dollar-game',
      }),
    });
    if (!res.ok) throw new AIError(`The free AI is busy (${res.status}). Try again in a minute.`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    return parseJSON(text);
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError('Couldn’t reach the free AI. Check your internet and try again.');
  } finally {
    clearTimeout(timer);
  }
}

export async function generateTheme(_apiKey, idea) {
  const out = await askJSON(
    THEME_INSTRUCTIONS,
    themeRequest(idea),
    '{"name": "Pirate ship", "emoji": "🏴‍☠️", "items": [{"name": "Cannons", "emoji": "💣"}]}.',
  );
  return cleanTheme(out, idea);
}

export async function judgeGame(_apiKey, game, label = 'Player') {
  const out = await askJSON(
    JUDGE_INSTRUCTIONS,
    `${judgeRequest(game, label)}\n\nGive every player number a score from 0.0 to 10.0.`,
    '{"scores": [{"player": 1, "score": 7.5}], "verdict": "2-3 punchy sentences"}.',
  );
  return cleanJudgement(out, game);
}
