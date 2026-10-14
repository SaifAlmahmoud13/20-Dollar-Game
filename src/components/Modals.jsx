import { useState } from 'react';
import { Modal } from './ui.jsx';
import { generateTheme, AIError, AI_ENABLED, NEEDS_KEY } from '../ai/index.js';
import { PHOTO_CREDITS, THEMES_BY_ID } from '../data/index.js';

export function HelpModal({ onClose }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <ol className="rules">
        <li>Everyone starts with the same budget ($20 by default).</li>
        <li>A theme is revealed, like <b>Pirate ship</b> or <b>Demon Slayer squad</b>. Your goal: build the best one.</li>
        <li>Items come up one at a time. Shout your bids! The auctioneer raises the price and taps <b>Sold</b> next to the highest bidder.</li>
        <li>Everyone has the same number of slots. Once yours are full you are out of the bidding, and if only one player has room left, they get the rest for free.</li>
        <li>
          When all items are gone, compare boards.{' '}
          {AI_ENABLED ? 'Let the AI judge roast you all, or vote on who built it better.' : 'Vote on who built it better.'}
        </li>
      </ol>
      <p className="muted">Tip: hype up the bad items so your friends overpay for them.</p>
      {PHOTO_CREDITS.length > 0 && (
        <details className="credits">
          <summary>Photo credits</summary>
          <ul>
            {PHOTO_CREDITS.map((c) => (
              <li key={c.id}>
                {THEMES_BY_ID[c.id]?.name ?? c.id}:{' '}
                <a href={c.page} target="_blank" rel="noreferrer">
                  {c.author}
                </a>{' '}
                · {c.license} · {c.source}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Modal>
  );
}

export function SettingsModal({ apiKey, onSave, onClose }) {
  const [value, setValue] = useState(apiKey);
  return (
    <Modal title="AI settings" onClose={onClose}>
      <p className="muted">
        The AI judge and <b>Create with AI</b> use Claude. Paste an Anthropic API key from{' '}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
          console.anthropic.com
        </a>
        . It is stored only in this browser and sent straight to Anthropic.
      </p>
      <label className="field">
        <span>Anthropic API key</span>
        <input
          type="password"
          autoComplete="off"
          placeholder="sk-ant-..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <div className="row-buttons">
        {apiKey && (
          <button type="button" className="btn btn-ghost" onClick={() => { onSave(''); onClose(); }}>
            Remove key
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => { onSave(value.trim()); onClose(); }}>
          Save
        </button>
      </div>
    </Modal>
  );
}

const IDEAS = ['Build the best pirate ship', 'Jujutsu Kaisen team', 'Hogwarts dorm room', 'Survive a week in the jungle', 'Marvel villain team', 'Perfect sleepover'];

function parseManualItems(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, ...rest] = line.split(/\s+/);
      // A leading token with no letters or digits is treated as the emoji.
      if (rest.length && !/[\p{L}\p{N}]/u.test(first)) return { emoji: first, name: rest.join(' ') };
      return { emoji: '⭐', name: line };
    });
}

export function CreateThemeModal({ apiKey, onNeedKey, onCreate, onClose }) {
  const [tab, setTab] = useState(AI_ENABLED && (!NEEDS_KEY || apiKey) ? 'ai' : 'manual');
  const [idea, setIdea] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [itemsText, setItemsText] = useState('');

  async function generate() {
    if (NEEDS_KEY && !apiKey) return onNeedKey();
    setBusy(true);
    setError('');
    setDraft(null);
    try {
      setDraft(await generateTheme(apiKey, idea.trim()));
    } catch (err) {
      setError(err instanceof AIError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const manualItems = parseManualItems(itemsText);
  const manualReady = name.trim() && manualItems.length >= 8;

  return (
    <Modal title="Create a theme" onClose={onClose}>
      {AI_ENABLED && (
        <div className="tabs">
          <button type="button" className={tab === 'ai' ? 'active' : ''} onClick={() => setTab('ai')}>
            ✨ With AI
          </button>
          <button type="button" className={tab === 'manual' ? 'active' : ''} onClick={() => setTab('manual')}>
            ✍️ Write my own
          </button>
        </div>
      )}

      {tab === 'ai' ? (
        <>
          {NEEDS_KEY && !apiKey && (
            <p className="notice">
              AI themes need an Anthropic API key.{' '}
              <button type="button" className="link" onClick={onNeedKey}>
                Add one
              </button>
            </p>
          )}
          <label className="field">
            <span>What should players build?</span>
            <input
              placeholder="e.g. Build the best pirate ship"
              value={idea}
              maxLength={120}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && idea.trim() && !busy && generate()}
            />
          </label>
          <div className="chips">
            {IDEAS.map((s) => (
              <button type="button" key={s} className="chip" onClick={() => setIdea(s)}>
                {s}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ai" disabled={!idea.trim() || busy} onClick={generate}>
            {busy ? 'Claude is cooking…' : draft ? 'Try again' : 'Generate theme'}
          </button>
          {error && <p className="error">{error}</p>}
          {draft && (
            <div className="draft">
              <h3>
                {draft.emoji} {draft.name}
              </h3>
              <ul className="item-list">
                {draft.items.map((it) => (
                  <li key={it.name}>
                    <span>{it.emoji}</span> {it.name}
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary" onClick={() => onCreate(draft)}>
                Save & add to my themes
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="field-row">
            <label className="field emoji-field">
              <span>Emoji</span>
              <input value={emoji} maxLength={8} placeholder="🏴‍☠️" onChange={(e) => setEmoji(e.target.value)} />
            </label>
            <label className="field grow">
              <span>Theme name</span>
              <input value={name} maxLength={40} placeholder="Pirate ship" onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Items, one per line (at least 8), best first. Start a line with an emoji to use it.</span>
            <textarea
              rows={8}
              value={itemsText}
              placeholder={'💣 Cannons\n🦜 Parrot\n🗺️ Treasure map\n…'}
              onChange={(e) => setItemsText(e.target.value)}
            />
          </label>
          <p className="muted">{manualItems.length} items</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!manualReady}
            onClick={() => onCreate({ name: name.trim(), emoji: emoji.trim() || '⭐', items: manualItems })}
          >
            Save theme
          </button>
        </>
      )}
    </Modal>
  );
}
