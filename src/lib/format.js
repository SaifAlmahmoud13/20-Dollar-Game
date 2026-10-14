// Money and number helpers. Budgets can run from $1 to a billion.

export const MAX_BUDGET = 1_000_000_000;

export const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

// "$50K", "$1.5M" — short enough for buttons.
export const shortMoney = (n) =>
  `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
