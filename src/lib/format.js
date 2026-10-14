// Money and number helpers. Budgets can run from $1 to a billion.

export const MAX_BUDGET = 1_000_000_000;

export const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

// "$50K", "$1.5M" — short enough for buttons.
export const shortMoney = (n) =>
  `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;

// Round to a "nice" step (1, 2 or 5 times a power of ten) so buttons move in friendly amounts.
export function niceStep(x) {
  if (!(x > 1)) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  const m = x / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

// Bid buttons scale with the budget: $20 -> +1/+5, $1,000,000 -> +50K/+250K.
export const bidSteps = (budget) => {
  const small = niceStep(budget / 20);
  return { small, big: small * 5 };
};

// Budget buttons: $5 at a time for small budgets, bigger jumps for big ones.
export const budgetStep = (budget) => Math.max(5, niceStep(budget / 4));

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
