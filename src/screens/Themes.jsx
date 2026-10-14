import { useState } from 'react';
import { CATEGORIES } from '../data/index.js';
import ThemeCard from '../components/ThemeCard.jsx';
import { TopBar, Toggle, Stepper } from '../components/ui.jsx';
import { AI_ENABLED, NEEDS_KEY } from '../ai/index.js';

export default function Themes({
  allThemes, customThemes, selected, setSelected, settings, setSettings, apiKey,
  onBack, onStart, onHelp, onSettings, onCreate, onDeleteCustom,
}) {
  const categories = customThemes.length
    ? [...CATEGORIES, { id: 'custom', name: 'My themes', emoji: '✨', themes: customThemes }]
    : CATEGORIES;
  const [catId, setCatId] = useState('popular');
  const [advanced, setAdvanced] = useState(false);
  const category = categories.find((c) => c.id === catId) ?? categories[0];
  const chosen = new Set(selected);
  const count = allThemes.filter((t) => chosen.has(t.id)).length;

  const toggle = (id) => setSelected(chosen.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const allSelected = count === allThemes.length;
  const setJudge = (on) => {
    if (on && NEEDS_KEY && !apiKey) onSettings();
    setSettings({ ...settings, aiJudge: on });
  };

  return (
    <div className="screen themes">
      <TopBar
        onBack={onBack}
        title="$20 Challenge"
        right={
          <>
            {NEEDS_KEY && (
              <button type="button" className="icon-btn" aria-label="AI settings" onClick={onSettings}>
                ⚙️
              </button>
            )}
            <button type="button" className="icon-btn" aria-label="How to play" onClick={onHelp}>
              ?
            </button>
          </>
        }
      />
      <div className="content">
        <h2 className="section-label">Categories</h2>
        <div className="categories" role="tablist">
          {categories.map((c) => (
            <button
              type="button"
              role="tab"
              aria-selected={c.id === category.id}
              key={c.id}
              className={`category ${c.id === category.id ? 'active' : ''}`}
              onClick={() => setCatId(c.id)}
            >
              <span className="category-emoji">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <div className="selected-row">
          <span className="section-label">
            {count} theme{count === 1 ? '' : 's'} selected
          </span>
          <button
            type="button"
            className="link"
            onClick={() => setSelected(allSelected ? [] : allThemes.map((t) => t.id))}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="theme-grid">
          <button type="button" className="theme-card create-card" onClick={onCreate}>
            <span className="sparkle" aria-hidden="true">✦</span>
            <span className="theme-card-name">{AI_ENABLED ? 'Create with AI' : 'Create a theme'}</span>
          </button>
          {category.themes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              selected={chosen.has(t.id)}
              onToggle={() => toggle(t.id)}
              onDelete={category.id === 'custom' ? () => onDeleteCustom(t.id) : undefined}
            />
          ))}
        </div>
      </div>
      <div className="footer panel">
        {AI_ENABLED && (
          <div className="setting-card">
            <div className="setting-row">
              <span>AI judge</span>
              <Toggle label="AI judge" checked={settings.aiJudge && (!NEEDS_KEY || !!apiKey)} onChange={setJudge} />
            </div>
          </div>
        )}
        <button type="button" className="advanced-toggle" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>
          Advanced options <span className={`chev ${advanced ? 'up' : ''}`}>⌄</span>
        </button>
        {advanced && (
          <div className="setting-card">
            <div className="setting-row">
              <span>Budget per player</span>
              <Stepper
                label="budget"
                value={settings.budget}
                min={5}
                max={100}
                step={5}
                format={(v) => `$${v}`}
                onChange={(budget) => setSettings({ ...settings, budget })}
              />
            </div>
            <div className="setting-row">
              <span>Items per round</span>
              <Stepper
                label="items per round"
                value={settings.itemsPerRound}
                min={4}
                max={16}
                onChange={(itemsPerRound) => setSettings({ ...settings, itemsPerRound })}
              />
            </div>
          </div>
        )}
        <button type="button" className="btn btn-primary" disabled={count === 0} onClick={onStart}>
          {count === 0 ? 'Pick at least one theme' : 'Start the auction'}
        </button>
      </div>
    </div>
  );
}
