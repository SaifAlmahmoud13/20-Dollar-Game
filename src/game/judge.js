// The offline judge: scores every board and writes a short roast with no internet.
// Each theme lists its items best first and its duds last (see data/duds.js), so an
// item's place in that list says how good a pick it was.
import { money } from '../lib/format.js';

const STAR_COUNT = 6;

// How good one pick is, from 0 to 10.
export function itemQuality(theme, itemName) {
  const n = theme.items.length;
  const idx = theme.items.findIndex((it) => it.name === itemName);
  if (idx < 0) return 6;
  const duds = Math.min(theme.duds ?? 0, n - 1);
  if (idx >= n - duds) return 1.5;
  if (idx < STAR_COUNT) return 9.5 - (idx / STAR_COUNT) * 0.8; // 9.5 down to ~8.8
  return 7.5 - ((idx - STAR_COUNT) / Math.max(1, n - duds - STAR_COUNT)) * 1.5; // 7.5 down to 6
}

const isDud = (theme, name) => itemQuality(theme, name) < 2;

// Stable "random" pick, so the same game always gets the same verdict.
function pick(list, seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return list[h % list.length];
}

export function localJudge(game) {
  const { theme, players } = game;
  const scores = players.map((p) => {
    if (!p.items.length) return 0;
    const avg = p.items.reduce((sum, it) => sum + itemQuality(theme, it.name), 0) / p.items.length;
    const missing = Math.max(0, game.slots - p.items.length);
    return Math.round(Math.max(0, Math.min(10, avg - missing * 0.5)) * 10) / 10;
  });

  const best = Math.max(...scores);
  const worst = Math.min(...scores);
  const winners = players.filter((_, i) => scores[i] === best);
  const loserIdx = scores.indexOf(worst);
  const loser = players[loserIdx];
  const seed = theme.id + players.map((p) => p.name + p.items.map((it) => it.name).join()).join('|');

  const sentences = [];
  if (winners.length > 1) {
    sentences.push(`It's a tie between ${winners.map((w) => w.name).join(' and ')}. The judge can't split them.`);
  } else {
    const w = winners[0];
    const star = [...w.items].sort((a, b) => itemQuality(theme, b.name) - itemQuality(theme, a.name))[0];
    const bargain = w.items.find((it) => it.price <= game.budget * 0.1 && itemQuality(theme, it.name) >= 8.8);
    sentences.push(
      bargain
        ? pick(
            [
              `${w.name} wins, and getting ${bargain.name} for ${money(bargain.price)} was daylight robbery.`,
              `${w.name} takes it. ${bargain.name} for just ${money(bargain.price)} was the steal of the night.`,
            ],
            seed,
          )
        : pick(
            [
              `${w.name} built the best ${theme.name.toLowerCase()} here, with ${star.name} leading the way.`,
              `${w.name} wins it. ${star.name} was the pick that sealed it.`,
              `${w.name} takes the crown. Hard to argue with ${star.name}.`,
            ],
            seed,
          ),
    );
  }

  if (worst < best && loser) {
    const dud = loser.items.find((it) => isDud(theme, it.name));
    if (dud) {
      sentences.push(
        dud.price > 0
          ? pick(
              [
                `${loser.name} paid ${money(dud.price)} for ${dud.name}. Bold choice.`,
                `${loser.name} spent ${money(dud.price)} on ${dud.name}, and the judge has questions.`,
                `Nobody asked for ${dud.name}, ${loser.name}, least of all at ${money(dud.price)}.`,
              ],
              seed + 'l',
            )
          : pick(
              [`${loser.name} got stuck with ${dud.name} and it shows.`, `${dud.name} really let ${loser.name} down.`],
              seed + 'l',
            ),
      );
    } else {
      sentences.push(pick([`${loser.name} played it safe and it shows.`, `${loser.name} was close, but not close enough.`], seed + 'l'));
    }
  }

  // The priciest purchase of the night, if it was a real splurge and isn't already mentioned.
  let priciest = null;
  for (const p of players) for (const it of p.items) if (!priciest || it.price > priciest.it.price) priciest = { p, it };
  if (priciest && priciest.it.price >= game.budget * 0.25 && !sentences.some((s) => s.includes(priciest.it.name))) {
    sentences.push(`Biggest splash: ${priciest.p.name} dropping ${money(priciest.it.price)} on ${priciest.it.name}.`);
  }

  return { scores, verdict: sentences.join(' ') };
}
