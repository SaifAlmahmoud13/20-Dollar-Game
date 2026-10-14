// Prompts and answer clean-up shared by both ways of reaching Claude
// (the Anthropic API with a player's key, and the claude.ai Artifact viewer).
import { AIError } from './errors.js';

export const THEME_INSTRUCTIONS =
  'You design themes for the "$20 Challenge", a party auction game. Players get a small budget, ' +
  'items for a theme are auctioned one by one, and everyone tries to build the best version of the theme. ' +
  'Good item lists mix about 6 must-have star items, 6 decent ones and 6 funny duds people will be stuck with. ' +
  'Items are concrete things, people or characters that fit the theme. Keep names short and recognisable.';

export const themeRequest = (idea) => `Create a theme for: ${idea}\n\nReturn exactly 18 items, each with one fitting emoji.`;

export const JUDGE_INSTRUCTIONS =
  'You are the AI judge of the "$20 Challenge" party game. Players bid a small budget on items to build the best ' +
  'version of a theme. Judge how well each build fits the theme and works as a whole; money left over does not count. ' +
  'Use the full 0-10 range so the winner is clear. Your verdict is a playful roast like a game-show host: name the winner, ' +
  'tease the weakest picks, keep it friendly and PG-13. Refer to players by their names.';

export function judgeRequest(game, label = 'Player') {
  const lines = game.players.map((p, i) => {
    const items = p.items.map((it) => `${it.name} ($${it.price})`).join(', ') || 'nothing';
    return `${label} ${i + 1} — "${p.name}": ${items}. Money left: $${p.money}.`;
  });
  return `Theme: ${game.theme.name}\n\n${lines.join('\n')}`;
}

export function cleanTheme(out, idea) {
  const items = (Array.isArray(out?.items) ? out.items : [])
    .filter((i) => i?.name && i?.emoji)
    .map((i) => ({ name: String(i.name).trim(), emoji: [...String(i.emoji).trim()].slice(0, 4).join('') || '⭐' }));
  if (items.length < 8) throw new AIError('Not enough items came back. Try again.');
  return { name: String(out.name ?? '').trim() || idea, emoji: String(out.emoji ?? '').trim() || '✨', items };
}

export function cleanJudgement(out, game) {
  const scores = game.players.map((_, i) => {
    const s = Number((Array.isArray(out?.scores) ? out.scores : []).find((x) => Number(x?.player) === i + 1)?.score);
    return Number.isFinite(s) ? Math.round(Math.min(10, Math.max(0, s)) * 10) / 10 : 0;
  });
  return { scores, verdict: typeof out?.verdict === 'string' ? out.verdict : '' };
}
