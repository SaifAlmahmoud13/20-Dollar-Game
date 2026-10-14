import { themeGradient } from '../data/index.js';

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

// Spread stickers over a loose grid with a little jitter so boards look hand-placed.
function layout(items, seed) {
  const n = items.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.4)));
  const rows = Math.max(1, Math.ceil(n / cols));
  return items.map((item, i) => {
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? n - r * cols : cols;
    const c = i % cols;
    const jx = (hash(seed + item.name + 'x') - 0.5) * 0.35;
    const jy = (hash(seed + item.name + 'y') - 0.5) * 0.3;
    return {
      item,
      left: ((c + 0.5 + jx) / inRow) * 100,
      top: ((r + 0.5 + jy) / rows) * 100,
      rot: (hash(seed + item.name + 'r') - 0.5) * 24,
    };
  });
}

export default function Board({ theme, player, highlight, badge, onClick, compact }) {
  const placed = layout(player.items, player.name);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`board ${highlight ? 'highlight' : ''} ${compact ? 'compact' : ''}`}
      style={{ background: themeGradient(theme.id), '--player': player.color }}
      onClick={onClick}
    >
      <span className="board-watermark" aria-hidden="true">
        {theme.emoji}
      </span>
      {placed.map(({ item, left, top, rot }) => (
        <span key={item.name} className="sticker" style={{ left: `${left}%`, top: `${top}%`, '--rot': `${rot}deg` }}>
          <span className="sticker-emoji">{item.emoji}</span>
          {!compact && <span className="sticker-label">{item.name}</span>}
        </span>
      ))}
      {player.items.length === 0 && <span className="board-empty">Nothing yet</span>}
      {highlight && <span className="crown" aria-hidden="true">👑</span>}
      {badge && <span className="board-badge">{badge}</span>}
    </Tag>
  );
}
