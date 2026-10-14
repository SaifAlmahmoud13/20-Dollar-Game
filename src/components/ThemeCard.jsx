import { themeBackground } from '../data/index.js';

const LABEL_SHADE = 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8))';

export default function ThemeCard({ theme, selected, onToggle, onDelete }) {
  return (
    <div className={`theme-card ${selected ? 'selected' : ''}`} style={{ background: themeBackground(theme, LABEL_SHADE) }}>
      <button type="button" className="theme-card-hit" aria-pressed={selected} onClick={onToggle}>
        {!theme.image && (
          <span className="theme-card-emoji" aria-hidden="true">
            {theme.emoji}
          </span>
        )}
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
