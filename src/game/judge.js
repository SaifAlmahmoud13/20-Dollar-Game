// The offline judge: scores every board and writes a short roast with no internet.
// Each theme lists its items best first and its duds last (see data/duds.js), so an
// item's place in that list says how good a pick it was.

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

  // The verdict only talks about which picks are better; prices and money don't matter.
  const ranked = (p) => [...p.items].sort((x, y) => itemQuality(theme, y.name) - itemQuality(theme, x.name));
  const sentences = [];
  if (winners.length > 1) {
    sentences.push(
      `It's a tie between ${winners.map((w) => w.name).join(' and ')}: ${winners.map((w) => ranked(w)[0]?.name).filter(Boolean).join(' and ')} cancel each other out.`,
    );
  } else {
    const w = winners[0];
    const [top1, top2] = ranked(w);
    sentences.push(
      top2
        ? pick(
            [
              `${w.name} wins with the stronger ${theme.name}: ${top1.name} and ${top2.name} lead the way.`,
              `${w.name} takes it. ${top1.name} and ${top2.name} are the best picks on the table.`,
              `${w.name} built the best ${theme.name}, and ${top1.name} is the standout.`,
            ],
            seed,
          )
        : `${w.name} wins, and ${top1.name} is the standout pick.`,
    );
  }

  if (worst < best && loser) {
    const winnerBest = winners.length === 1 ? ranked(winners[0])[0] : null;
    const weakest = ranked(loser).at(-1);
    if (weakest && isDud(theme, weakest.name)) {
      sentences.push(
        pick(
          [
            `${loser.name} got stuck with ${weakest.name}, the weakest pick of the night.`,
            `${weakest.name} really let ${loser.name} down.`,
            `Nobody wanted ${weakest.name}, ${loser.name}.`,
          ],
          seed + 'l',
        ),
      );
    } else if (winnerBest && weakest) {
      sentences.push(`${loser.name}'s ${weakest.name} is no match for ${winnerBest.name}.`);
    } else {
      sentences.push(`${loser.name} was close, but not close enough.`);
    }
  }

  return { scores, verdict: sentences.join(' ') };
}
