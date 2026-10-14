import { useState } from 'react';
import { CATEGORIES } from '../data/index.js';
import ThemeCard from '../components/ThemeCard.jsx';
import { NumberInput, TopBar, Toggle, Stepper } from '../components/ui.jsx';
import { AI_ENABLED, NEEDS_KEY } from '../ai/index.js';
import { MAX_BUDGET, money } from '../lib/format.js';
import { sfx } from '../lib/sound.js';

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
    setSettings({ ...settings, aiJudge: on });
  };

  return (
    <div className="screen themes">
      <TopBar
        onBack={onBack}
        title="$20 Challenge"
        right={
          <>
            <button
              type="button"
              className="icon-btn"
              aria-label={settings.sound === false ? 'Turn sound on' : 'Turn sound off'}
              onClick={() => setSettings({ ...settings, sound: settings.sound === false })}
            >
              {settings.sound === false ? '🔇' : '🔊'}
            </button>
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
              onToggle={() => {
                sfx.tap();
                toggle(t.id);
              }}
              onDelete={category.id === 'custom' ? () => onDeleteCustom(t.id) : undefined}
            />
          ))}
        </div>
      </div>
      <div className="footer panel">
        <div className="setting-card">
          <div className="setting-row">
            <span>AI judge</span>
            <Toggle label="AI judge" checked={!!settings.aiJudge} onChange={setJudge} />
          </div>
          {settings.aiJudge && NEEDS_KEY && !apiKey && (
            <p className="setting-note">
              Using the offline judge. To use Claude when you have internet, add an API key in ⚙️.
            </p>
          )}
        </div>
        <button type="button" className="advanced-toggle" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>
          Advanced options <span className={`chev ${advanced ? 'up' : ''}`}>⌄</span>
        </button>
        {advanced && (
          <div className="setting-card">
            <div className="setting-row">
              <span>Budget per player</span>
              <Stepper
                label="Budget per player"
                value={settings.budget}
                min={1}
                max={MAX_BUDGET}
                step={settings.budgetStep ?? 1}
                format={money}
                onChange={(budget) => setSettings({ ...settings, budget })}
              />
            </div>
            <div className="setting-row">
              <span>Budget buttons move by</span>
              <NumberInput
                grow
                className="step-input"
                label="Budget buttons move by"
                value={settings.budgetStep ?? 1}
                min={1}
                max={MAX_BUDGET}
                format={money}
                onChange={(budgetStep) => setSettings({ ...settings, budgetStep })}
              />
            </div>
            <div className="setting-row">
              <span>Items per round</span>
              <Stepper
                label="Items per round"
                value={settings.itemsPerRound}
                min={4}
                max={16}
                onChange={(itemsPerRound) => setSettings({ ...settings, itemsPerRound })}
              />
            </div>
            <div className="setting-row">
              <span>Bid buttons move by</span>
              <NumberInput
                grow
                className="step-input"
                label="Bid buttons move by"
                value={settings.bidStep ?? 1}
                min={1}
                max={MAX_BUDGET}
                format={money}
                onChange={(bidStep) => setSettings({ ...settings, bidStep })}
              />
            </div>
            <div className="setting-row">
              <span>Portrait mode</span>
              <Toggle
                label="Portrait mode"
                checked={settings.orientation === 'portrait'}
                onChange={(on) => setSettings({ ...settings, orientation: on ? 'portrait' : 'landscape' })}
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
