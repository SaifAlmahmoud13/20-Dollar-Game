import { useEffect, useMemo, useState } from 'react';
import { ALL_THEMES } from './data/index.js';
import { createGame, isOver } from './game/logic.js';
import { load, save, usePersistent } from './lib/storage.js';
import Home from './screens/Home.jsx';
import Players from './screens/Players.jsx';
import Themes from './screens/Themes.jsx';
import Reveal from './screens/Reveal.jsx';
import Auction from './screens/Auction.jsx';
import Results from './screens/Results.jsx';
import { CreateThemeModal, HelpModal, SettingsModal } from './components/Modals.jsx';

// A game in progress survives an accidental refresh.
const restored = load('session', null);
const IN_GAME = ['reveal', 'auction', 'results'];

export default function App() {
  const [screen, setScreen] = useState(restored?.screen ?? 'home');
  const [setup, setSetup] = usePersistent('setup', { names: ['', ''], teams: false });
  const [settings, setSettings] = usePersistent('settings', { budget: 20, itemsPerRound: 10, aiJudge: false });
  const [customThemes, setCustomThemes] = usePersistent('customThemes', []);
  const [selected, setSelected] = usePersistent('selected', ALL_THEMES.map((t) => t.id));
  const [apiKey, setApiKey] = usePersistent('apiKey', '');
  const [theme, setTheme] = useState(restored?.theme ?? null);
  const [game, setGame] = useState(restored?.game ?? null);
  const [history, setHistory] = useState(restored?.history ?? []);
  const [outcome, setOutcome] = useState(restored?.outcome ?? null);
  const [wins, setWins] = useState(restored?.wins ?? {});
  const [modal, setModal] = useState(null);

  useEffect(() => {
    save('session', IN_GAME.includes(screen) ? { screen, theme, game, history, outcome, wins } : undefined);
  }, [screen, theme, game, history, outcome, wins]);

  const allThemes = useMemo(() => [...ALL_THEMES, ...customThemes], [customThemes]);
  const pool = useMemo(() => {
    const chosen = new Set(selected);
    return allThemes.filter((t) => chosen.has(t.id));
  }, [allThemes, selected]);

  const label = setup.teams ? 'Team' : 'Player';
  const names = setup.names.map((n, i) => n.trim() || `${label} ${i + 1}`);

  function pickTheme(excludeId) {
    const options = pool.length > 1 ? pool.filter((t) => t.id !== excludeId) : pool;
    return options[Math.floor(Math.random() * options.length)];
  }

  function reveal(excludeId) {
    setTheme(pickTheme(excludeId));
    setScreen('reveal');
  }

  function startRound(t) {
    setGame(createGame({ names, theme: t, budget: settings.budget, itemsPerRound: settings.itemsPerRound }));
    setHistory([]);
    setOutcome(null);
    setScreen('auction');
  }

  function handleSell(next) {
    setHistory([...history, game]);
    setGame(next);
    if (isOver(next)) setScreen('results');
  }

  function undo() {
    setGame(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }

  function decide(result) {
    setOutcome(result);
    setWins((w) => {
      const next = { ...w };
      for (const i of result.winners) next[game.players[i].name] = (next[game.players[i].name] ?? 0) + 1;
      return next;
    });
  }

  function addCustomTheme(draft) {
    const t = { ...draft, id: `custom-${Date.now().toString(36)}`, category: 'custom' };
    setCustomThemes([...customThemes, t]);
    setSelected([...selected, t.id]);
    setModal(null);
  }

  function deleteCustomTheme(id) {
    setCustomThemes(customThemes.filter((t) => t.id !== id));
    setSelected(selected.filter((x) => x !== id));
  }


  let view;
  switch (screen) {
    case 'players':
      view = (
        <Players setup={setup} setSetup={setSetup} onBack={() => setScreen('home')} onNext={() => setScreen('themes')} onHelp={() => setModal('help')} />
      );
      break;
    case 'themes':
      view = (
        <Themes
          allThemes={allThemes}
          customThemes={customThemes}
          selected={selected}
          setSelected={setSelected}
          settings={settings}
          setSettings={setSettings}
          apiKey={apiKey}
          onBack={() => setScreen('players')}
          onStart={() => reveal()}
          onHelp={() => setModal('help')}
          onSettings={() => setModal('settings')}
          onCreate={() => setModal('create')}
          onDeleteCustom={deleteCustomTheme}
        />
      );
      break;
    case 'reveal':
      view = (
        <Reveal
          theme={theme}
          settings={settings}
          canShuffle={pool.length > 1}
          onShuffle={() => reveal(theme.id)}
          onGo={() => startRound(theme)}
          onBack={() => setScreen('themes')}
        />
      );
      break;
    case 'auction':
      view = <Auction game={game} onSell={handleSell} onUndo={undo} canUndo={history.length > 0} onQuit={() => setScreen('themes')} />;
      break;
    case 'results':
      view = (
        <Results
          game={game}
          outcome={outcome}
          setOutcome={decide}
          aiJudge={settings.aiJudge}
          apiKey={apiKey}
          label={label}
          wins={wins}
          onRematch={() => startRound(theme)}
          onNewTheme={() => reveal(theme.id)}
          onChangeThemes={() => setScreen('themes')}
          onHome={() => setScreen('home')}
        />
      );
      break;
    default:
      view = <Home onStart={() => setScreen('players')} onHelp={() => setModal('help')} />;
  }

  return (
    <div className="app">
      {view}
      {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal apiKey={apiKey} onSave={setApiKey} onClose={() => setModal(null)} />}
      {modal === 'create' && (
        <CreateThemeModal
          apiKey={apiKey}
          onNeedKey={() => setModal('settings')}
          onCreate={addCustomTheme}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
