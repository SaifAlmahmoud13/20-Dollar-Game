import { themeGradient } from '../data/index.js';
import { TopBar } from '../components/ui.jsx';

export default function Reveal({ theme, settings, canShuffle, onShuffle, onGo, onBack }) {
  const items = Math.min(settings.itemsPerRound, theme.items.length);
  return (
    <div className="screen reveal">
      <TopBar onBack={onBack} title="Your theme" />
      <div className="content center">
        <div className="reveal-card" key={theme.id} style={{ background: themeGradient(theme.id) }}>
          <span className="reveal-emoji">{theme.emoji}</span>
          <span className="reveal-kicker">Build the best</span>
          <h1>{theme.name}</h1>
        </div>
        <p className="reveal-meta">
          ${settings.budget} each · {items} items up for auction
        </p>
      </div>
      <div className="footer">
        {canShuffle && (
          <button type="button" className="btn btn-ghost" onClick={onShuffle}>
            🔀 Different theme
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onGo}>
          Let's go
        </button>
      </div>
    </div>
  );
}
