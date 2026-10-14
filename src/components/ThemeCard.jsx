import { themeGradient } from '../data/index.js';

export default function ThemeCard({ theme, selected, onToggle, onDelete }) {
  return (
    <div className={`theme-card ${selected ? 'selected' : ''}`} style={{ background: themeGradient(theme.id) }}>
      <button type="button" className="theme-card-hit" aria-pressed={selected} onClick={onToggle}>
        <span className="theme-card-emoji" aria-hidden="true">
          {theme.emoji}
        </span>
        <span className="theme-card-name">{theme.name}</span>
        {selected && <span className="check" aria-hidden="true">✓</span>}
      </button>
      {onDelete && (
        <button type="button" className="theme-card-delete" aria-label={`Delete ${theme.name}`} onClick={onDelete}>
          ✕
        </button>
      )}
    </div>
  );
}
